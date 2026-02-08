
import React from 'react';
import { AppView } from '../App';
import { ICONS } from '../constants';

const FEATURE_CARDS: { id: AppView; title: string; description: string; icon: React.ReactNode; color: string }[] = [
  { 
    id: 'archive', 
    title: 'Archive Master', 
    description: 'Centralized memory manager. Organize, retrieve, and resume Story, Recap, and Transcription assets with version control.', 
    icon: <ICONS.List className="w-8 h-8" />, 
    color: 'text-slate-600 bg-slate-50' 
  },
  { 
    id: 'video_gen', 
    title: 'Video Lab (Veo)', 
    description: 'Generate stunning high-quality cinematic video clips from your scripts using the power of Google Veo 3.1.', 
    icon: <ICONS.Studio className="w-8 h-8" />, 
    color: 'text-rose-600 bg-rose-50' 
  },
  { 
    id: 'professional_recap', 
    title: 'Recap Producer', 
    description: 'Transform 2-hour videos into high-retention 10m scripts. Includes SEO package, hook templates, and story-faithful narration.', 
    icon: <ICONS.Sparkles className="w-8 h-8" />, 
    color: 'text-amber-600 bg-amber-50' 
  },
  { 
    id: 'story', 
    title: 'Story Creator', 
    description: 'Elevate raw concepts into immersive, emotionally-charged narratives using world-class storytelling and novel-grade prose.', 
    icon: <ICONS.Pencil className="w-8 h-8" />, 
    color: 'text-orange-600 bg-orange-50' 
  },
  { 
    id: 'transcribe_file', 
    title: 'Script Writer', 
    description: 'Turn raw audio and video into high-fidelity scripts with automated speaker identification and precise timestamps.', 
    icon: <ICONS.Studio className="w-8 h-8" />, 
    color: 'text-indigo-600 bg-indigo-50' 
  },
  { 
    id: 'transcribe_youtube', 
    title: 'YouTube Pro', 
    description: 'Extract intelligence from any YouTube URL with grounded metadata reports, executive summaries, and source verification.', 
    icon: <ICONS.Link className="w-8 h-8" />, 
    color: 'text-red-600 bg-red-50' 
  },
  { 
    id: 'translate', 
    title: 'Smart Translate', 
    description: 'Localize content globally with neural translation that masters regional slang, industry jargon, and emotional subtext.', 
    icon: <ICONS.Pencil className="w-6 h-6" />, 
    color: 'text-emerald-600 bg-emerald-50' 
  },
  { 
    id: 'subtitles', 
    title: 'Subtitle Gen', 
    description: 'Create production-ready SRT assets with automated timing, multi-language support, and professional industry formatting.', 
    icon: <ICONS.Studio className="w-8 h-8" />, 
    color: 'text-amber-600 bg-amber-50' 
  },
  { 
    id: 'voice', 
    title: 'AI Voiceover', 
    description: 'Synthesize natural-sounding narration using premium persona nodes optimized for vlogs, corporate, and cinematic tracks.', 
    icon: <ICONS.Studio className="w-8 h-8" />, 
    color: 'text-purple-600 bg-purple-50' 
  },
  { 
    id: 'recap', 
    title: 'Visual Recap', 
    description: 'Condense long-form recordings into high-impact executive summaries, key milestones, and actionable insights.', 
    icon: <ICONS.Pencil className="w-8 h-8" />, 
    color: 'text-sky-600 bg-sky-50' 
  },
  { 
    id: 'content', 
    title: 'Content Creator', 
    description: 'Maximize multi-platform reach by transforming raw ideas into high-retention viral scripts for TikTok, Reels, and Shorts.', 
    icon: <ICONS.Studio className="w-8 h-8" />, 
    color: 'text-pink-600 bg-pink-50' 
  },
  { 
    id: 'thumbnail', 
    title: 'Thumbnail Gen', 
    description: 'Boost click-through rates with AI-synthesized visual concepts tailored to tech, gaming, and lifestyle vlogs.', 
    icon: <ICONS.Image className="w-8 h-8" />, 
    color: 'text-rose-600 bg-rose-50' 
  },
  { 
    id: 'downloader', 
    title: 'Downloader', 
    description: 'Archive production-grade media assets for offline editing, historical preservation, and frame-accurate content analysis.', 
    icon: <ICONS.Download className="w-8 h-8" />, 
    color: 'text-cyan-600 bg-cyan-50' 
  }
];

export const Dashboard: React.FC<{ onSelectTool: (view: AppView) => void }> = ({ onSelectTool }) => {
  return (
    <div className="space-y-16 animate-fadeIn pb-24">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Supercharge your <span className="text-indigo-600">Workflow.</span></h2>
        <p className="text-lg text-slate-500 font-medium leading-relaxed px-4">The all-in-one multimodal tool suite for modern creators and cinematic editors.</p>
        <div className="pt-4 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-300">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Gemini 3 Pro & Veo 3.1 Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {FEATURE_CARDS.map((card) => (
          <div key={card.id} onClick={() => onSelectTool(card.id)} className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-300 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 flex flex-col items-start gap-6">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${card.color}`}>{card.icon}</div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
