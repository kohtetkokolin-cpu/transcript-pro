// Gemini Service - Fixed for Vercel deployment
// All model names corrected to actual available models (2025)

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranscriptionResult, TranscriptionSegment, ProfessionalRecapResult, ArchiveEntry, ThumbnailPackage } from "../types";
import { extractJson } from "../utils/helpers";

// Works in Vite (browser) via import.meta.env
const getApiKey = (): string => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
};

const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

// ── Model constants (verified available 2025) ─────────────────────────────
const MODEL_FLASH = 'gemini-2.0-flash';
const MODEL_PRO   = 'gemini-2.5-pro-preview-05-06';
const MODEL_TTS   = 'gemini-2.5-flash-preview-tts';

// ── Centralized error handler ─────────────────────────────────────────────
const handleAIError = (err: any): never => {
  const errorMsg = err?.message || JSON.stringify(err) || 'Unknown error';

  if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("QUOTA")) {
    throw new Error("QUOTA_EXHAUSTED: API quota exceeded. Please check your Gemini API key limits.");
  }
  if (errorMsg.includes("API_KEY_INVALID") || (errorMsg.includes("400") && errorMsg.includes("key"))) {
    throw new Error("INVALID_API_KEY: Your Gemini API key is invalid. Please update VITE_GEMINI_API_KEY in Vercel settings.");
  }
  if (errorMsg.includes("404") || errorMsg.includes("not found")) {
    throw new Error("MODEL_NOT_FOUND: The requested model was not found. Check your API key has Gemini access.");
  }
  throw new Error(errorMsg);
};

// ── System Instructions ───────────────────────────────────────────────────
const TRANSLATOR_SYSTEM_INSTRUCTION = "You are a professional translator. Provide accurate and context-aware translations. Never add explanations, just the translation.";
const MOVIE_RECAP_NARRATOR_INSTRUCTION = "You are a movie recap narrator. Use an engaging, rhythmic, and story-focused tone. Be dramatic and keep viewers hooked.";
const MYANMAR_DHAMMA_TRANSLATION_INSTRUCTION = "You are an expert in Burmese Dhamma and literature. Translate with a calm, meditative, and respectful tone, avoiding literal artifacts.";
const VOICE_SCRIPT_WRITER_INSTRUCTION = "You are a professional voiceover script writer. Refine raw text into clear, engaging narration with natural pauses and emphasis.";
const AUDIOBOOK_RECAP_INSTRUCTION = "You are a professional audiobook narrator. Focus on pacing, clarity, and narrative flow. Make it immersive.";
const MYANMAR_VOICEOVER_INSTRUCTION = "You are a professional Burmese narrator. Use natural, clear, and engaging Burmese phrasing. Avoid formal stiff language.";
const MYANMAR_DHAMMA_VOICEOVER_INSTRUCTION = "You are a Burmese Dhamma speaker. Use a peaceful, respectful, and authoritative tone suitable for Buddhist teachings.";
const CINEMATIC_VOICEOVER_INSTRUCTION = "You are a cinematic voiceover director. Craft a script with dramatic tension, atmospheric depth, and perfect timing for visual sequences.";

const PROFESSIONAL_RECAP_SYSTEM_INSTRUCTION = `You are an expert video editor and content strategist specializing in transforming long-form videos into engaging short recaps. You work like a professional editor who creates viral, copyright-safe content.

Core Mission: Transform 2-3 hour videos into compelling 10-15 minute recaps.
1. Preserve core story/key moments.
2. Remove copyrighted elements.
3. Add engaging hooks/retention elements.
4. Maintain narrative flow.
5. Support Myanmar language fluently for scripts and titles.

Return strictly a JSON object following the blueprint structure.`;

const TRANSCRIPTION_ENGINE_SYSTEM_INSTRUCTION = "You are a high-fidelity transcription engine. Extract verbatim text with speaker identification and precise timestamps.";

const THUMBNAIL_DESIGNER_INSTRUCTION = `You are a professional thumbnail designer and content strategist. Your role is to generate stunning, click-worthy YouTube/social media thumbnails based on story narratives.

When user provides a story/narrative/script:
1. Analyze the core emotion and message.
2. Identify key visual elements and themes.
3. Determine target audience and platform.
4. Extract the most compelling moment/hook.

You MUST support Myanmar (Burmese) language fluently.
Provide a detailed design specification for 16:9, 9:16, and 1:1 ratios.
Return strictly JSON.`;

const STORY_ARCHITECT_INSTRUCTION = `You are a world-class story architect and novelist. Create deep, immersive, and emotionally resonant narratives.

STRICT NARRATIVE RULES:
1. NEVER summarize or skip parts of the story. Write every detail.
2. If the response becomes too long or you reach a natural chapter break/cliffhanger, STOP IMMEDIATELY.
3. At the end of every segment, you MUST ask the user: "ဆက်ရေးမလား?" (Should I continue?).
4. When continuing, start exactly from the last sentence of the previous output without repetition or greeting.
5. Maintain a professional, literary prose style in the requested language.`;

const ARCHIVE_ASSISTANT_SYSTEM_INSTRUCTION = `You are an AI assistant for Transcript Pro, a professional media workflow application. Your role is to help users with:
1. Transcription - Convert audio/video to accurate text transcripts
2. Translation - Translate content between languages (especially English <-> Myanmar)
3. Content Creation - Write video scripts, social media posts, and marketing copy
4. Subtitle Generation - Create SRT subtitle files with proper timing
5. Voice Generation - Provide text-to-speech guidance and scripts
6. Video Processing - Assist with video editing, recap creation, and voiceover syncing

Guidelines:
- Be professional but friendly in Myanmar language (Burmese script) or English as requested.
- Provide step-by-step instructions.
- Ask clarifying questions.
- Provide production-ready outputs.

CONTEXTUAL AWARENESS:
The user has an 'Archive' of past assets. You will be provided with a summary of their archived files.`;

// ── Archive Chat ──────────────────────────────────────────────────────────
export const startArchiveChat = (history: any[] = [], archiveSummary: string) => {
  const ai = getAI();
  return ai.chats.create({
    model: MODEL_PRO,
    config: {
      systemInstruction: `${ARCHIVE_ASSISTANT_SYSTEM_INSTRUCTION}\n\nUSER'S CURRENT ARCHIVE SUMMARY:\n${archiveSummary}`,
      temperature: 0.7,
    },
    history: history
  });
};

// ── Thumbnail Strategy ────────────────────────────────────────────────────
export const generateThumbnailStrategy = async (narrative: string): Promise<ThumbnailPackage> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: `Analyze this narrative and design 3 click-worthy thumbnails (16:9, 9:16, 1:1). 
      Narrative: ${narrative}
      
      Format each ratio with: concept, visualComposition (mainFocalPoint, background, layout, depth), colorPalette (primary, secondary, contrastLevel), typography (mainText {text, fontStyle, size, color, position, effect}, subText {text, style, placement}), keyVisualElements (array of 3), emotionalTriggers (primaryEmotion, visualHooks), designPrinciples (array), aiImagePrompt.
      
      RETURN JSON with keys: "landscape", "vertical", "square".`,
      config: {
        systemInstruction: THUMBNAIL_DESIGNER_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });
    return extractJson(response.text || '{}') as ThumbnailPackage;
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Translate Text ────────────────────────────────────────────────────────
export const translateText = async (
  text: string,
  targetLang: string,
  options: { tone?: string, context?: string } = {}
): Promise<string> => {
  try {
    const ai = getAI();
    let systemInstruction = TRANSLATOR_SYSTEM_INSTRUCTION;

    if (options.tone === 'MovieRecap') systemInstruction = MOVIE_RECAP_NARRATOR_INSTRUCTION;
    if (options.tone === 'MyanmarDhamma') systemInstruction = MYANMAR_DHAMMA_TRANSLATION_INSTRUCTION;

    const prompt = `TRANSLATE THIS TEXT:
Target Language: ${targetLang}
Target Tone/Style: ${options.tone || 'Neutral'}
Additional Context: ${options.context || 'None'}

TEXT TO TRANSLATE:
${text}`;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: { systemInstruction }
    });

    return response.text || '';
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Refine Voiceover Script ───────────────────────────────────────────────
export const refineVoiceoverScript = async (text: string, style: 'Recap' | 'Audiobook' | 'Myanmar' | 'MyanmarDhamma' | 'Cinematic' = 'Recap'): Promise<string> => {
  try {
    const ai = getAI();
    let instruction = VOICE_SCRIPT_WRITER_INSTRUCTION;
    if (style === 'Audiobook') instruction = AUDIOBOOK_RECAP_INSTRUCTION;
    else if (style === 'Myanmar') instruction = MYANMAR_VOICEOVER_INSTRUCTION;
    else if (style === 'MyanmarDhamma') instruction = MYANMAR_DHAMMA_VOICEOVER_INSTRUCTION;
    else if (style === 'Cinematic') instruction = CINEMATIC_VOICEOVER_INSTRUCTION;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Refine this raw script into professional narration. Current Style: ${style}\n\nSCRIPT:\n${text}`,
      config: { systemInstruction: instruction }
    });
    return response.text || text;
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Analyze Voice Sample ──────────────────────────────────────────────────
export const analyzeVoiceSample = async (base64Audio: string, mimeType: string): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: [{
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: `Analyze the speaker in this audio file. Return strictly JSON: 
          {
            "age": "...",
            "gender": "...",
            "tone": "...",
            "pacing": "...",
            "uniqueCharacteristics": ["trait1", "trait2"],
            "analysisSummary": "...",
            "bestMatchPresetId": "Charon|Kore|Zephyr|Puck|Fenrir",
            "cloningSuccessConfidence": 0.95
          }` }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return extractJson(response.text || '{}');
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Professional Recap ────────────────────────────────────────────────────
export const generateProfessionalRecap = async (
  input: { url?: string; fileBase64?: string; mimeType?: string }
): Promise<ProfessionalRecapResult> => {
  try {
    const ai = getAI();

    let contents: any;
    if (input.url) {
      contents = `Analyze the video at ${input.url} and generate a professional editor's recap blueprint. Follow the structure provided in your system instructions. Use Myanmar language for scripts and metadata as appropriate.`;
    } else if (input.fileBase64 && input.mimeType) {
      contents = [{
        parts: [
          { inlineData: { data: input.fileBase64, mimeType: input.mimeType } },
          { text: "Analyze this video footage and generate a professional editor's recap blueprint. Use Myanmar language for scripts and metadata as appropriate." }
        ]
      }];
    }

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents,
      config: {
        systemInstruction: PROFESSIONAL_RECAP_SYSTEM_INSTRUCTION,
        tools: input.url ? [{ googleSearch: {} }] : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                originalTitle: { type: Type.STRING },
                duration: { type: Type.STRING },
                genre: { type: Type.STRING },
                targetLength: { type: Type.STRING },
                coreMessage: { type: Type.STRING }
              },
              required: ["originalTitle", "duration", "genre", "targetLength", "coreMessage"]
            },
            hookStrategy: {
              type: Type.OBJECT,
              properties: {
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      visual: { type: Type.STRING },
                      textOverlay: { type: Type.STRING },
                      voScript: { type: Type.STRING },
                      logic: { type: Type.STRING }
                    },
                    required: ["type", "visual", "textOverlay", "voScript", "logic"]
                  }
                }
              },
              required: ["options"]
            },
            editTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  segmentTitle: { type: Type.STRING },
                  timeRange: { type: Type.STRING },
                  beats: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timestamp: { type: Type.STRING },
                        description: { type: Type.STRING },
                        instruction: { type: Type.STRING }
                      },
                      required: ["description", "instruction"]
                    }
                  }
                },
                required: ["segmentTitle", "timeRange", "beats"]
              }
            },
            audioPlan: {
              type: Type.OBJECT,
              properties: {
                musicStrategy: { type: Type.STRING },
                originalAudioHandling: { type: Type.STRING },
                voScript: { type: Type.STRING }
              },
              required: ["musicStrategy", "originalAudioHandling", "voScript"]
            },
            visualTechniques: {
              type: Type.OBJECT,
              properties: {
                graphicReplacements: { type: Type.ARRAY, items: { type: Type.STRING } },
                engagementBoosters: { type: Type.ARRAY, items: { type: Type.STRING } },
                colorGrading: { type: Type.STRING }
              },
              required: ["graphicReplacements", "engagementBoosters", "colorGrading"]
            },
            retentionHooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  type: { type: Type.STRING },
                  text: { type: Type.STRING },
                  visual: { type: Type.STRING }
                },
                required: ["timestamp", "type", "text", "visual"]
              }
            },
            metadataStrategy: {
              type: Type.OBJECT,
              properties: {
                titles: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                thumbnailText: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["titles", "description", "tags", "thumbnailText"]
            },
            exportSettings: {
              type: Type.OBJECT,
              properties: {
                video: { type: Type.STRING },
                audio: { type: Type.STRING },
                platformNotes: { type: Type.STRING }
              },
              required: ["video", "audio", "platformNotes"]
            },
            copyrightChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["analysis", "hookStrategy", "editTimeline", "audioPlan", "visualTechniques", "retentionHooks", "metadataStrategy", "exportSettings", "copyrightChecklist"]
        }
      }
    });

    const data = extractJson(response.text || '{}');
    if (!data || !data.analysis) {
      throw new Error("Could not parse AI response as structured blueprint data.");
    }
    return data as ProfessionalRecapResult;
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Transcribe YouTube ────────────────────────────────────────────────────
export const transcribeYouTube = async (
  url: string,
  options: { clean?: boolean; includeTimestamps?: boolean } = {}
): Promise<TranscriptionResult & { sources?: any[] }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: `Examine the video at this URL and provide a detailed transcript or narrative script. URL: ${url}`,
      config: {
        systemInstruction: TRANSCRIPTION_ENGINE_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullText: { type: Type.STRING },
            language: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  text: { type: Type.STRING },
                  speaker: { type: Type.STRING }
                },
                required: ["startTime", "endTime", "text"]
              }
            }
          },
          required: ["fullText", "segments"]
        }
      }
    });

    const data = extractJson(response.text || '{}');
    if (!data || !data.fullText) {
      if (response.text) {
        return {
          fullText: response.text,
          language: "English",
          segments: [{ startTime: "00:00:00", endTime: "00:01:00", text: response.text }]
        };
      }
    }
    return data;
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Transcribe Local Media ────────────────────────────────────────────────
export const transcribeMedia = async (
  base64Data: string,
  mimeType: string,
  options: { clean?: boolean; includeTimestamps?: boolean } = {}
): Promise<TranscriptionResult> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: [{ parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: "Transcribe this audio/video with precise timestamps and speaker identification. Return JSON." }] }],
      config: {
        systemInstruction: TRANSCRIPTION_ENGINE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullText: { type: Type.STRING },
            language: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  text: { type: Type.STRING },
                  speaker: { type: Type.STRING }
                },
                required: ["startTime", "endTime", "text"]
              }
            }
          },
          required: ["fullText", "segments"]
        }
      }
    });
    return extractJson(response.text || '{}');
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Generate Voiceover (TTS) ──────────────────────────────────────────────
export const generateVoiceover = async (text: string, voiceName: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Content Package ───────────────────────────────────────────────────────
export const generateContentPackage = async (params: any): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Generate a viral content strategy for: ${JSON.stringify(params)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            whyThisWorks: { type: Type.STRING },
            hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            videoFlow: {
              type: Type.OBJECT,
              properties: {
                hook: { type: Type.STRING },
                context: { type: Type.STRING },
                mainContent: { type: Type.STRING },
                ending: { type: Type.STRING }
              },
              required: ["hook", "context", "mainContent", "ending"]
            }
          },
          required: ["title", "whyThisWorks", "hooks", "videoFlow"]
        }
      }
    });
    return extractJson(response.text || '{}');
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Story Arc ─────────────────────────────────────────────────────────────
export const generateStoryArc = async (params: { topic: string; context?: string; lang?: string; history?: string }): Promise<{ story: string }> => {
  try {
    const ai = getAI();
    const prompt = params.history
      ? `CONTINUATION REQUEST: Continue the novel exactly from where you stopped. NEVER summarize. Write the next chapter or scene with full detail. Finish by asking "ဆက်ရေးမလား?". Previous content context:\n\n${params.history}`
      : `NEW NOVEL REQUEST: Topic: ${params.topic}. Context: ${params.context || ''}. Language: ${params.lang || 'English'}. Start the manuscript. Remember to stop at a natural break and ask "ဆက်ရေးမလား?".`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction: STORY_ARCHITECT_INSTRUCTION }
    });

    return { story: response.text || '' };
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Audiobook Narration ───────────────────────────────────────────────────
export const generateAudiobookNarration = async (params: { text: string; lang: string; history?: string }): Promise<{ narration: string }> => {
  try {
    const ai = getAI();
    const prompt = params.history
      ? `Continue the audiobook narration exactly from where you stopped. Text to continue: ${params.text}`
      : `Convert this story into an audiobook-ready narration script. Language: ${params.lang}. Story Text:\n\n${params.text}`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction: AUDIOBOOK_RECAP_INSTRUCTION }
    });

    return { narration: response.text || '' };
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Thumbnail Image via Imagen ────────────────────────────────────────────
export const generateThumbnailImage = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio as any,
        outputMimeType: 'image/jpeg',
      }
    });

    const imageData = response?.generatedImages?.[0]?.image?.imageBytes;
    if (imageData) {
      return `data:image/jpeg;base64,${imageData}`;
    }
    throw new Error("No image data returned from Imagen.");
  } catch (err: any) {
    const errorMsg = err?.message || '';
    if (errorMsg.includes('QUOTA') || errorMsg.includes('billing') || errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('403')) {
      // Return SVG placeholder when Imagen not available on free tier
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#1e1b4b"/><rect x="40" y="40" width="1200" height="640" rx="20" fill="#312e81" stroke="#6366f1" stroke-width="2"/><text x="640" y="320" font-family="Arial,sans-serif" font-size="42" font-weight="bold" fill="white" text-anchor="middle">Thumbnail Concept Ready</text><text x="640" y="390" font-family="Arial,sans-serif" font-size="22" fill="#a5b4fc" text-anchor="middle">Imagen API requires billing-enabled Google Cloud project</text><text x="640" y="440" font-family="Arial,sans-serif" font-size="18" fill="#818cf8" text-anchor="middle">Design spec generated above — use Canva or Photoshop to implement</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    return handleAIError(err);
  }
};

// ── Refine Thumbnail Prompt ───────────────────────────────────────────────
export const refineThumbnailPrompt = async (prompt: string, style?: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Refine this image generation prompt to be more vivid and detailed for AI image generation: "${prompt}" Style preference: ${style || 'cinematic'}`
    });
    return response.text || prompt;
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Alternative Titles ────────────────────────────────────────────────────
export const generateAlternativeTitles = async (script: string, tags: string[]): Promise<string[]> => {
  try {
    const ai = getAI();
    const safeScript = (script || "").substring(0, 5000);
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Based on this recap script and these tags, generate 3-5 alternative high-CTR titles.
      Script: ${safeScript}
      Tags: ${tags.join(', ')}
      RETURN JSON: { "titles": ["...", "..."] }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["titles"]
        }
      }
    });

    const data = extractJson(response.text || '{}');
    return data?.titles || [];
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Analyze YouTube Video ─────────────────────────────────────────────────
export const analyzeYouTubeVideo = async (url: string, options: any): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Analyze the video at this URL and provide detailed information: ${url}. Include the video title, a comprehensive summary, and key points.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            thumbnailUrl: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  visual: { type: Type.STRING },
                  voiceover: { type: Type.STRING },
                },
                required: ["timestamp", "visual", "voiceover"]
              }
            }
          },
          required: ["originalTitle", "summary"]
        }
      }
    });
    const data = extractJson(response.text || '{}');
    if (!data || !data.summary) {
      if (response.text) {
        return { originalTitle: "YouTube Video", summary: response.text, thumbnailUrl: "", keyPoints: [] };
      }
    }
    return data;
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Translate Segments ────────────────────────────────────────────────────
export const translateSegments = async (segments: any[], targetLang: string, tone: string = 'Neutral'): Promise<any[]> => {
  try {
    const ai = getAI();
    let systemInstruction = TRANSLATOR_SYSTEM_INSTRUCTION;

    if (tone === 'MovieRecap') systemInstruction = MOVIE_RECAP_NARRATOR_INSTRUCTION;
    if (tone === 'MyanmarDhamma') systemInstruction = MYANMAR_DHAMMA_TRANSLATION_INSTRUCTION;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Translate these subtitle segments into ${targetLang}. 
      Tone Profile: ${tone}
      Preserve the startTime and endTime exactly.
      Segments: ${JSON.stringify(segments)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              text: { type: Type.STRING },
              speaker: { type: Type.STRING }
            },
            required: ["startTime", "endTime", "text"]
          }
        }
      }
    });
    return extractJson(response.text || '[]');
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Summarize Media ───────────────────────────────────────────────────────
export const summarizeMedia = async (
  base64Data: string,
  mimeType: string,
  options: any
): Promise<any> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: [{ parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: "Create a detailed video recap summary with key moments, timeline, and narrative structure. Return JSON." }] }],
      config: { responseMimeType: "application/json" }
    });
    return extractJson(response.text || '{}');
  } catch (e) {
    return handleAIError(e);
  }
};

// ── Video Generation ──────────────────────────────────────────────────────
export const generateVideoAsset = async (prompt: string, config: any): Promise<string> => {
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt,
      config: {
        numberOfVideos: 1,
        durationSeconds: 8,
        aspectRatio: config.aspectRatio || '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    return downloadLink ? `${downloadLink}&key=${getApiKey()}` : '';
  } catch (e) {
    return handleAIError(e);
  }
};
