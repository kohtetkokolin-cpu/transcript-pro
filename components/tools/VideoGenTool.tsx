
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { generateVideoAsset } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';
import { ArchiveEntry } from '../../types';
import { Tooltip } from '../Tooltip';
import { GoogleGenAI } from "@google/genai";

const VEO_REASSURING_MESSAGES = [
  "Initializing Veo 3.1 neural circuits...",
  "Mapping temporal narrative flow...",
  "Synthesizing high-fidelity frame clusters...",
  "Applying cinematic lighting & texture nodes...",
  "Optimizing motion paths for realism...",
  "Finalizing master video container...",
  "Almost there! Just polishing the production..."
];

const CINEMATIC_TAGS = {
  "Lighting": ["Neon Glow", "Volumetric Lighting", "Golden Hour", "Low-key Drama", "Cinematic Shadows", "Strobe Effects"],
  "Camera": ["Aerial Drone", "Slow Pan", "Handheld Shaky-cam", "Static Wide", "Extreme Close-up", "Low Angle"],
  "Vibe": ["Cyberpunk", "Photorealistic", "Vintage Film", "Surreal Dreamscape", "Noir", "High-Octane Action"]
};

export const VideoGenTool: React.FC<{ 
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}> = ({ onBack, initialAsset }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpleveling, setIsUpleveling] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    if (initialAsset) {
      setPrompt(initialAsset.content);
      setAspectRatio(initialAsset.metadata?.aspectRatio as any || '16:9');
      setResolution(initialAsset.metadata?.resolution as any || '1080p');
      if (initialAsset.metadata?.sourceUrl) setVideoUrl(initialAsset.metadata.sourceUrl);
    }
    refreshHistory();
  }, [initialAsset]);

  const refreshHistory = () => {
    setHistory(ArchiveService.listAll().filter(a => a.type === 'Video').slice(0, 10));
  };

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % VEO_REASSURING_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const checkApiKey = async () => {
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }
  };

  const handleUplevelPrompt = async () => {
    if (!prompt.trim()) return;
    setIsUpleveling(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a professional cinematic director. Take this simple video prompt and expand it into a detailed, high-quality, atmospheric description suitable for a high-end AI video model. Focus on lighting, camera movement, textures, and mood. Keep it under 60 words. 
        PROMPT: ${prompt}`,
      });
      if (response.text) {
        setPrompt(response.text.trim());
      }
    } catch (e) {
      console.error("Uplevel failed", e);
    } finally {
      setIsUpleveling(false);
    }
  };

  const addTag = (tag: string) => {
    setPrompt(prev => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return tag;
      if (cleanPrev.toLowerCase().includes(tag.toLowerCase())) return prev;
      return `${cleanPrev}, ${tag}`;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    await checkApiKey();
    
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    
    try {
      const url = await generateVideoAsset(prompt, { resolution, aspectRatio });
      if (!url) throw new Error("Video generation yielded no asset URL.");
      
      setVideoUrl(url);
      
      ArchiveService.saveAsset({
        type: 'Video',
        title: prompt.substring(0, 30) + '...',
        content: prompt,
        language: 'English',
        toolId: 'video_gen',
        metadata: { 
          sourceUrl: url, 
          aspectRatio, 
          resolution 
        }
      });
      refreshHistory();
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        setError("API Key project error. Please select a valid paid project key.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setError(err.message || "Synthesis engine fault.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const loadFromHistory = (item: ArchiveEntry) => {
    setPrompt(item.content);
    setAspectRatio(item.metadata?.aspectRatio as any || '16:9');
    setResolution(item.metadata?.resolution as any || '1080p');
    setVideoUrl(item.metadata?.sourceUrl || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-rose-500 transition-all shadow-sm active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">Veo Cinema Studio</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500 mt-3">Advanced Cinematic Synthesis</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Billing Docs</a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-5 space-y-8">
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-2xl space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cinematic Script</label>
                <button 
                  onClick={handleUplevelPrompt}
                  disabled={!prompt.trim() || isUpleveling || isGenerating}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-2 transition-colors disabled:opacity-30"
                >
                  {isUpleveling ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <ICONS.Sparkles className="w-3 h-3" />}
                  Magic Uplevel
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:outline-none focus:border-rose-500 font-bold text-lg transition-all shadow-inner h-64 resize-none custom-scrollbar placeholder:text-slate-300"
                  placeholder="Describe your cinematic masterpiece..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
                <div className="absolute bottom-6 right-6 flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{prompt.length} / 500</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Cinematic Keywords</p>
               <div className="space-y-4">
                 {Object.entries(CINEMATIC_TAGS).map(([category, tags]) => (
                   <div key={category} className="space-y-2">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter ml-2">{category}</p>
                     <div className="flex flex-wrap gap-2">
                       {tags.map(tag => (
                         <button 
                           key={tag} 
                           onClick={() => addTag(tag)}
                           disabled={isGenerating}
                           className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-300 hover:text-rose-600 transition-all active:scale-95"
                         >
                           {tag}
                         </button>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Aspect Ratio</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {(['16:9', '9:16'] as const).map(ratio => (
                    <button 
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${aspectRatio === ratio ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Resolution</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {(['720p', '1080p'] as const).map(res => (
                    <button 
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${resolution === res ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-7 bg-rose-600 text-white rounded-[2rem] font-black text-xl hover:bg-slate-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {isGenerating ? 'Rendering Master...' : 'Synthesize Video Asset'}
              {!isGenerating && <ICONS.Sparkles className="w-6 h-6" />}
            </button>
            {error && <div className="p-6 bg-rose-50 text-rose-700 rounded-3xl text-[10px] font-bold border border-rose-100 animate-fadeIn">{error}</div>}
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[300px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Production Archive</h3>
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {history.map(item => (
                <div key={item.id} onClick={() => loadFromHistory(item)} className={`p-5 rounded-2xl border cursor-pointer transition-all group ${videoUrl === item.metadata?.sourceUrl ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-100 hover:border-rose-300'}`}>
                  <p className={`text-xs font-black truncate ${videoUrl === item.metadata?.sourceUrl ? 'text-rose-600' : 'text-slate-700'}`}>{item.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="py-12 text-center opacity-20">
                   <p className="text-[10px] font-black uppercase tracking-widest">No assets saved</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          {!videoUrl ? (
            <div className="h-[750px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 gap-8 bg-white/50 animate-fadeIn">
               {isGenerating ? (
                 <div className="text-center space-y-10 animate-pulse">
                    <div className="w-24 h-24 border-8 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-4">
                       <p className="text-3xl font-black text-rose-600 uppercase tracking-widest">{VEO_REASSURING_MESSAGES[loadingMsgIdx]}</p>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">Estimated completion: 1-3 minutes</p>
                    </div>
                 </div>
               ) : (
                 <>
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-40">
                      <ICONS.Studio className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-4 px-10">
                      <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Theater Empty</p>
                      <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Describe a cinematic scene in the concept box or use "Magic Uplevel" to expand a simple idea into a visual masterpiece.</p>
                    </div>
                 </>
               )}
            </div>
          ) : (
            <div className="bg-slate-900 rounded-[4rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[750px] animate-fadeIn">
              <div className="p-12 md:p-16 flex flex-col items-center justify-center flex-1 space-y-10">
                 <div className={`relative w-full max-w-4xl shadow-2xl rounded-[2.5rem] overflow-hidden border-8 border-white/5 bg-black ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[600px] w-auto'}`}>
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-cover" 
                    />
                 </div>
                 
                 <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 p-10 rounded-[3rem] backdrop-blur-xl border border-white/10">
                    <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Master Production Script</p>
                       <h3 className="text-sm font-bold text-white italic leading-relaxed line-clamp-3">"{prompt}"</h3>
                    </div>
                    <div className="flex gap-4 shrink-0">
                       <button 
                         onClick={() => window.open(videoUrl, '_blank')}
                         className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3"
                       >
                         <ICONS.Download className="w-4 h-4" /> Download
                       </button>
                       <button 
                         onClick={() => setVideoUrl(null)}
                         className="px-8 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/10"
                       >
                         Reset
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
