
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI, Type, Modality } from "@google/genai";

const execPromise = promisify(exec);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 } 
});

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY; });

async function transcribeMediaBuffer(buffer, mimeType) {
  const ai = getAI();
  // Using gemini-3-pro-preview for higher accuracy in timestamping and speaker diarization
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: buffer.toString('base64'), mimeType: mimeType } },
          { text: "Transcribe this media verbatim. Identify speakers. Break into segments of max 5-7 seconds. Return strictly a JSON object with 'fullText', 'language', and 'segments' (array of {startTime, endTime, text, speaker}). Timestamps format: HH:MM:SS,mmm." }
        ]
      }
    ],
    config: {
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

  return JSON.parse(response.text);
}

async function getYouTubeMetadata(url) {
  try {
    // Resilient metadata extraction using specific output format
    const { stdout } = await execPromise(`yt-dlp --quiet --no-warnings --simulate --print "%(duration)s" --print "%(title)s" --print "%(id)s" --print "%(thumbnail)s" --print "%(webpage_url)s" "${url}"`);
    const output = stdout.toString().trim().split('\n');
    if (output.length < 5) throw new Error("YOUTUBE_METADATA_INCOMPLETE");
    
    return { 
      duration: parseInt(output[0], 10), 
      title: output[1],
      id: output[2],
      thumbnail: output[3],
      url: output[4]
    };
  } catch (e) {
    const errorMsg = e.stderr || e.message;
    if (errorMsg.includes('Private video')) throw new Error("YOUTUBE_PRIVATE_VIDEO");
    if (errorMsg.includes('confirm your age')) throw new Error("YOUTUBE_AGE_RESTRICTED");
    if (errorMsg.includes('unavailable')) throw new Error("YOUTUBE_UNAVAILABLE");
    throw new Error("YOUTUBE_GENERIC_ERROR");
  }
}

app.get('/api/system-info', async (req, res) => {
  try {
    const { stdout: ytVer } = await execPromise('yt-dlp --version');
    const { stdout: ffVer } = await execPromise('ffmpeg -version');
    res.json({
      ytDlp: ytVer.trim(),
      ffmpeg: ffVer.split('\n')[0].trim(),
      status: 'Ready'
    });
  } catch (e) {
    res.status(500).json({ status: 'Error', error: e.message });
  }
});

app.post('/api/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const result = await transcribeMediaBuffer(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    console.error("Upload transcription error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/youtube-transcript', async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const meta = await getYouTubeMetadata(youtubeUrl);
    // Download audio buffer with a generous limit for production use
    const { stdout } = await execPromise(`yt-dlp --quiet --no-warnings -f "ba[ext=m4a]/ba/best" -o - "${youtubeUrl}"`, {
      encoding: 'buffer',
      maxBuffer: 512 * 1024 * 1024 
    });
    const result = await transcribeMediaBuffer(stdout, 'audio/mp4');
    res.json({ ...result, title: meta.title, thumbnail: meta.thumbnail, duration: meta.duration });
  } catch (err) {
    console.error("YouTube transcription error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/text-to-subtitles', async (req, res) => {
  try {
    const { text } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform this raw script into time-coded segments for an SRT file. Since you don't have audio, ESTIMATE realistic pacing (approx 15-20 characters per second). Break it into segments of 4-7 seconds. Return strictly JSON. Script: \n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullText: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["startTime", "endTime", "text"]
              }
            }
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate to ${targetLang}. Preserve tone. Text: ${text}`,
    });
    res.json({ translatedText: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/translate-segments', async (req, res) => {
  try {
    const { segments, targetLang } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class subtitle translator. Translate these segments into ${targetLang}. 
      RULES:
      1. CRITICAL: NEVER change 'startTime' or 'endTime'.
      2. Ensure the translated text fits the duration. 
      3. Maintain the JSON schema exactly.
      Segments: ${JSON.stringify(segments)}`,
      config: { 
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
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/voice', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ audio: base64Audio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recap', async (req, res) => {
  try {
    const { url, length } = req.body;
    const meta = await getYouTubeMetadata(url);
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this video: ${url}. Title: ${meta.title}. Generate a ${length} executive recap. Return JSON with title, summary, keyPoints (array of strings).`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text);
    res.json({ ...data, originalTitle: meta.title, thumbnailUrl: meta.thumbnail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/content-creator', async (req, res) => {
  try {
    const { platform, topic, tone, lang, context, format } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a viral ${format} for ${platform} about "${topic}". Tone: ${topic}. Language: ${lang}. Context: ${context}. Return JSON: {hook, script, cta, tips: []}`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/story-creator', async (req, res) => {
  try {
    const { topic, context, lang } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Create a cinematic 3-act story arc for topic "${topic}". Lang: ${lang}. Context: ${context}. Return JSON: {act1, act2, act3, cinematicTips: []}`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-thumbnail', async (req, res) => {
  try {
    const { prompt } = req.body;
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    
    let base64Image = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }
    
    if (!base64Image) throw new Error("No image generated by the model.");
    res.json({ image: base64Image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/download-info', async (req, res) => {
  try {
    const meta = await getYouTubeMetadata(req.body.url);
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Server listening on ${port}`));
