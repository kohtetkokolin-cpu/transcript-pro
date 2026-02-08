/**
 * =========================================
 * STEP 4 & STEP 5 – DEV ONLY MODE PROTECTION
 * -----------------------------------------
 * STEP 4: Allow all AI tools ONLY in local/dev testing
 * STEP 5: Automatically block them in production/public
 * =========================================
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI, Type, Modality } from "@google/genai";

/* ===============================
   STEP 4 – ENV MODE FLAGS
================================ */
const isDev = process.env.NODE_ENV !== "production";
const isAppDevMode = process.env.APP_MODE === "dev";

/* ===============================
   STEP 5 – DEV ONLY MIDDLEWARE
================================ */
const devOnlyMiddleware = (req, res, next) => {
  if (!isDev || !isAppDevMode) {
    return res.status(403).json({
      error: "API disabled. This feature is dev-only for now."
    });
  }
  next();
};

/* ===============================
   BASIC SERVER SETUP
================================ */
const execPromise = promisify(exec);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

/* ===============================
   FILE UPLOAD CONFIG
================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 }
});

/* ===============================
   GEMINI AI HELPER
================================ */
const getAI = () =>
  new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* ===============================
   TRANSCRIBE MEDIA
================================ */
async function transcribeMediaBuffer(buffer, mimeType) {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{
      parts: [
        { inlineData: { data: buffer.toString('base64'), mimeType } },
        { text: "Transcribe verbatim with timestamps. Return JSON only." }
      ]
    }],
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

/* ===============================
   SYSTEM CHECK API
================================ */
app.get('/api/system-info', async (req, res) => {
  try {
    const { stdout: ytVer } = await execPromise('yt-dlp --version');
    const { stdout: ffVer } = await execPromise('ffmpeg -version');
    res.json({
      ytDlp: ytVer.trim(),
      ffmpeg: ffVer.split('\n')[0],
      status: "Ready"
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ===============================
   UPLOAD & TRANSCRIBE (DEV ONLY)
================================ */
app.post(
  '/api/upload',
  devOnlyMiddleware,
  upload.single('media'),
  async (req, res) => {
    try {
      if (!req.file) throw new Error("No file uploaded");
      const result = await transcribeMediaBuffer(
        req.file.buffer,
        req.file.mimetype
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* ===============================
   TEXT TO SUBTITLES (DEV ONLY)
================================ */
app.post('/api/text-to-subtitles', devOnlyMiddleware, async (req, res) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert text to SRT-style segments. JSON only.\n${req.body.text}`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   TRANSLATE (DEV ONLY)
================================ */
app.post('/api/translate', devOnlyMiddleware, async (req, res) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate to ${req.body.targetLang}: ${req.body.text}`
    });
    res.json({ translatedText: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   VOICE TTS (DEV ONLY)
================================ */
app.post('/api/voice', devOnlyMiddleware, async (req, res) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: req.body.text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: req.body.voiceName }
          }
        }
      }
    });

    const audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    res.json({ audio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   SERVER START
================================ */
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
