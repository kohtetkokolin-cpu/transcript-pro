
import React, { useState, useEffect } from 'react';
import { ICONS, SUPPORTED_LANGUAGES } from '../../constants';
import { generateContentPackage } from '../../services/geminiService';
import { downloadFile } from '../../utils/helpers';
import { Tooltip } from '../Tooltip';

interface CreatorResult {
  title: string;
  whyThisWorks: string;
  hooks: string[];
  videoFlow: {
    hook: string;
    context: string;
    mainContent: string;
    ending: string;
  };
  optionalEnhancements?: {
    visuals: string;
    textOnScreen: string;
    tone: string;
  };
}

interface SavedStrategy {
  id: string;
  topic: string;
  platform: string;
  lang: string;
  result: CreatorResult;
  timestamp: number;
}

const STORAGE_KEY = 'history_content_creator_v2';

const PLATFORMS = [
  'YouTube Shorts',
  'TikTok',
  'Instagram Reels',
  'YouTube Long-form',
  'LinkedIn Video',
  'Twitter/X Video'
];

const TONES = [
  'Hook-Driven',
  'Educational',
  'Story-Driven',
  'Calm/Aesthetic',
  'High Energy',
  'Controversial',
  'Relatable/Vlog'
];

export const ContentCreatorTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [platform, setPlatform] = useState('YouTube Shorts');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('Short-form Video');
  const [tone, setTone] = useState('Hook-Driven');
  const [lang, setLang] = useState('English');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CreatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedStrategy[]>([]);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Sync History
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateContentPackage({ platform, topic, tone, lang, context, format });
      setResult(data);
      
      const newItem: SavedStrategy = {
        id: crypto.randomUUID(),
        topic,
        platform,
        lang,
        result: data,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
    } catch (err: any) {
      setError(err.message || "Strategy generation failed. Check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadFromHistory = (item: SavedStrategy) => {
    setResult(item.result);
    setTopic(item.topic);
    setPlatform(item.platform);
    setLang(item.lang || 'English');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(i => i.id !== id));
  };

  const downloadStrategy = () => {
    if (!result) return;
    const content = `
PRODUCTION STRATEGY: ${result.title}
PLATFORM: ${platform}
LANGUAGE: ${lang}
    
WHY THIS WORKS:
${result.whyThisWorks}

HOOK OPTIONS:
${result.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}

VIDEO FLOW:
- Hook: ${result.videoFlow.hook}
- Context: ${result.videoFlow.context}
- Main Content: ${result.videoFlow.mainContent}
- Ending: ${result.videoFlow.ending}

OPTIONAL ENHANCEMENTS:
- Visuals: ${result.optionalEnhancements?.visuals}
- Text-on-screen: ${result.optionalEnhancements?.textOnScreen}
- Emotional Tone: ${result.optionalEnhancements?.tone}
    `.trim();
    // Fix: Added safety check for result.title before substring call
    const safeTitle = (result.title || "Strategy").substring(0, 20).replace(/\s+/g, '_');
    downloadFile(content, `strategy_${safeTitle}.txt`, 'text/plain');
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all shadow-sm active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Creator Strategist</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-3">Retention Intelligence Mode</p>
          </div>
        </div>
        {result && (
          <button onClick={downloadStrategy} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-3 animate-fadeIn">
            <ICONS.Download className="w-4 h-4" /> Export Production Guide
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {/* Left Side: Controls & History */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Core Topic / Idea</label>
                <textarea 
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none h-32 resize-none custom-scrollbar"
                  placeholder="e.g. A review of the new spatial computing headset..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Target Platform</label>
                  <select 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-indigo-500 transition-all"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                  >
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tone Profile</label>
                        <select 
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[10px] outline-none focus:border-indigo-500 transition-all"
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                        >
                            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Language</label>
                        <select 
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[10px] outline-none focus:border-indigo-500 transition-all"
                            value={lang}
                            onChange={e => setLang(e.target.value)}
                        >
                            {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                        </select>
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Audience Context</label>
                <input 
                  type="text"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none"
                  placeholder="e.g. Professional designers, Gen Z explorers..."
                  value={context}
                  onChange={e => setContext(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 animate-fadeIn">{error}</div>}

            <button 
              onClick={handleGenerate} 
              disabled={!topic.trim() || isProcessing} 
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-4 active:scale-95 group"
            >
               {isProcessing ? 'Thinking like a Creator...' : 'Synthesize Strategy'}
               {!isProcessing && <ICONS.Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
            </button>
          </div>

          {/* History Panel */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Strategy Archive</h3>
              {history.length > 0 && <button onClick={() => setHistory([])} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Purge All</button>}
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => loadFromHistory(item)} 
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group relative ${result?.title === item.result.title ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-200'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-xs font-black truncate ${result?.title === item.result.title ? 'text-indigo-600' : 'text-slate-700'}`}>{item.topic}</p>
                    <button onClick={(e) => deleteFromHistory(e, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">{item.platform}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{item.lang || 'EN'}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="py-20 text-center opacity-20 grayscale flex flex-col items-center">
                  <ICONS.List className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archive Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="xl:col-span-8">
          {result ? (
            <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col min-h-[800px]">
              {/* Header */}
              <div className="bg-slate-900 p-12 md:p-16 text-white space-y-4">
                 <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{platform}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{lang} Optimized</span>
                 </div>
                 <h3 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">{result.title}</h3>
              </div>

              <div className="p-10 md:p-16 space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Psychology & Hooks */}
                    <div className="space-y-10">
                       <section className="space-y-4">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Why This Works
                          </h4>
                          <p className="text-lg font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-6">
                            "{result.whyThisWorks}"
                          </p>
                       </section>

                       <section className="space-y-6">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Neural Hook Options
                          </h4>
                          <div className="space-y-3">
                             {result.hooks.map((hook, i) => (
                               <div key={i} className="group p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-start gap-4">
                                  <span className="text-[10px] font-black text-indigo-300 group-hover:text-indigo-600">0{i+1}</span>
                                  <p className="text-sm font-bold text-slate-800 leading-snug">{hook}</p>
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>

                    {/* Enhancements */}
                    <section className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 space-y-8">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Production Enhancements</h4>
                       
                       <div className="space-y-8">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Visual Direction</p>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed">{result.optionalEnhancements?.visuals}</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Text Overlays</p>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed">{result.optionalEnhancements?.textOnScreen}</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Emotional Tone</p>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{result.optionalEnhancements?.tone}</p>
                          </div>
                       </div>
                    </section>
                 </div>

                 {/* Video Flow Map */}
                 <section className="space-y-8 border-t border-slate-100 pt-12">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Master Video Flow
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       <div className="p-8 bg-slate-900 text-white rounded-[2rem] space-y-4 shadow-xl">
                          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">0–3s: Hook</span>
                          <p className="text-sm font-bold leading-relaxed">{result.videoFlow.hook}</p>
                       </div>
                       <div className="p-8 bg-white border border-slate-200 rounded-[2rem] space-y-4 shadow-sm">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">3–10s: Context</span>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">{result.videoFlow.context}</p>
                       </div>
                       <div className="p-8 bg-white border border-slate-200 rounded-[2rem] space-y-4 shadow-sm">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">10–50s: Main</span>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">{result.videoFlow.mainContent}</p>
                       </div>
                       <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4 shadow-sm">
                          <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">End: Payoff</span>
                          <p className="text-sm font-bold text-indigo-900 leading-relaxed">{result.videoFlow.ending}</p>
                       </div>
                    </div>
                 </section>
              </div>
            </div>
          ) : (
            <div className="h-[800px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 gap-8 animate-fadeIn">
               {isProcessing ? (
                 <div className="text-center space-y-8">
                    <div className="relative">
                       <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <ICONS.Studio className="w-8 h-8 text-indigo-200 animate-pulse" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Mapping Narrative Nodes...</p>
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Applying audience psychology filters</p>
                    </div>
                 </div>
               ) : (
                 <>
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-50">
                        <ICONS.Sparkles className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-3 px-10">
                        <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Awaiting Signal</p>
                        <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Define your topic and platform in the control panel to generate a high-retention production strategy.
                        </p>
                    </div>
                 </>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
