# 🎬 Transcript Pro — AI Media Suite

A professional AI-powered media workflow tool built with React + Vite + Google Gemini.

## ✨ Features

| Tool | Description |
|------|-------------|
| 📝 Script Writer | Transcribe audio/video files with timestamps |
| 🎬 YouTube Pro | Analyze any YouTube URL for insights |
| 🌐 Smart Translate | Neural translation with tone profiles (Myanmar supported) |
| 🎵 Subtitle Gen | Generate & translate SRT subtitle files |
| 🎙️ AI Voiceover | Text-to-speech with 20+ voice personas |
| 🏆 Recap Producer | Professional video recap blueprints |
| ✍️ Story Creator | AI novel & audiobook generator |
| 📊 Content Creator | Viral content strategy for TikTok/YouTube/Reels |
| 🖼️ Thumbnail Gen | AI thumbnail design specs + image generation |
| 🎥 Video Lab | Generate AI videos using Veo 2.0 |
| 📦 Archive Master | Manage all your saved assets |

## 🚀 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/transcript-pro.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### 3. Add Environment Variable

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_GEMINI_API_KEY = AIzaSy...your_key_here...
```

Get your free API key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 4. Deploy!

Users can also enter their own API key via the **⚡ Connect Key** button in the app header.

---

## 🛠️ Run Locally

```bash
npm install
cp .env.example .env
# Edit .env and add your VITE_GEMINI_API_KEY
npm run dev
```

## 📋 Models Used

| Purpose | Model |
|---------|-------|
| Fast tasks (translate, content, subtitles) | `gemini-2.0-flash` |
| Complex tasks (recap, story, transcription) | `gemini-2.5-pro-preview-05-06` |
| Text-to-Speech | `gemini-2.5-flash-preview-tts` |
| Image generation | `imagen-3.0-generate-002` |
| Video generation | `veo-2.0-generate-001` |

> **Note:** Imagen & Veo require a billing-enabled Google Cloud project. All other features work on the free Gemini API tier.

## 🇲🇲 Myanmar Language Support

Full Myanmar (Burmese) language support across all tools:
- Myanmar Dhamma tone for translations
- Myanmar-optimized voice personas
- Story/audiobook generation in Myanmar script
