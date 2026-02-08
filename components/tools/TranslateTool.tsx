
import React, { useState, useEffect } from 'react';
import { ICONS, SUPPORTED_LANGUAGES } from '../../constants';
import { translateText } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';
import { ArchiveEntry } from '../../types';
import { Tooltip } from '../Tooltip';

const TONE_PROFILES = [
  { id: 'Formal', label: 'Professional / Formal', description: 'Mastered business and technical etiquette.' },
  { id: 'MovieRecap', label: 'Movie Recap Narrator', description: 'Story-faithful narration with clear rhythm and storytelling flow.' },
  { id: 'MyanmarDhamma', label: 'Myanmar Dhamma Style', description: 'Meditative, calm, and natural Burmese storytelling without literal translation artifacts.' },
  { id: 'Casual', label: 'Conversational', description: 'Natural, friendly, and approachable flow.' },
  { id: 'Creative', label: 'Cinematic / Creative', description: 'Rich metaphors and emotional weight.' },
  { id: 'Slang', label: 'Slang-Heavy', description: 'Optimized for social media and youth culture.' }
];

const NEURAL_STATUS = [
  "Mapping cultural semantics...",
  "Applying performance-tone rhythm...",
  "Optimizing industry jargon...",
  "Cross-referencing narrative flow...",
  "Finalizing production-ready master..."
];

export const TranslateTool: React.FC<{ 
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}> = ({ onBack, initialAsset }) => {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [tone, setTone] = useState('MovieRecap');
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [history, setHistory] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    if (initialAsset) {
      setText(initialAsset.metadata?.sourceText || initialAsset.content);
      setResult(initialAsset.content);
      setTargetLang(initialAsset.language);
      setTone(initialAsset.metadata?.tone || 'Formal');
    }
    refreshHistory();
  }, [initialAsset]);

  const refreshHistory = () => {
    setHistory(ArchiveService.listAll().filter(a => a.type === 'Translation').slice(0, 20));
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setResult('');
    
    const interval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % NEURAL_STATUS.length);
    }, 2000);

    try {
      const translated = await translateText(text, targetLang, { tone, context });
      setResult(translated);
      
      ArchiveService.saveAsset({
        type: 'Translation',
        title: text.substring(0, 30) + '...',
        content: translated,
        language: targetLang,
        toolId: 'translate',
        metadata: { sourceText: text, tone }
      });
      refreshHistory();
    } catch (err: any) {
      setResult("SYSTEM ERROR: " + err.message);
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const loadFromHistory = (item: ArchiveEntry) => {
    setText(item.metadata?.sourceText || '');
    setResult(item.content);
    setTargetLang(item.language);
    setTone(item.metadata?.tone || 'Formal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyResult = () => {
    if (result) navigator.clipboard.writeText(result);
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-[1.25rem] hover:border-emerald-500 hover:shadow-xl transition-all active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Localization Lab</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 mt-3">Neural Translation Suite</p>
          </div>
        </div>
        
        {result && (
          <div className="flex items-center gap-3">
             <button onClick={copyResult} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-2">
                <ICONS.Pencil className="w-4 h-4" /> Copy Master
             </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-8">
              <div className="space-y-6">
                 <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Target Language</label>
                 <select 
                   className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-bold text-lg focus:border-emerald-500 transition-all"
                   value={targetLang}
                   onChange={(e) => setTargetLang(e.target.value)}
                 >
                   {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.name}>{lang.name}</option>)}
                 </select>
              </div>

              <div className="space-y-4">
                 <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Narrative Tone</label>
                 <div className="grid grid-cols-1 gap-2">
                    {TONE_PROFILES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${tone === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'}`}
                      >
                         <p className={`font-black text-xs ${tone === t.id ? 'text-emerald-600' : 'text-slate-700'}`}>{t.label}</p>
                      </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={handleTranslate}
                disabled={!text.trim() || isProcessing}
                className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-lg hover:bg-slate-900 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-4"
              >
                {isProcessing ? 'Synthesizing...' : 'Begin Localization'}
              </button>
           </div>

           <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[400px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Archives</h3>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                {history.map(item => (
                  <div key={item.id} onClick={() => loadFromHistory(item)} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:border-emerald-200 cursor-pointer group transition-all">
                    <p className="text-[11px] font-black text-slate-700 line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">{item.language}</span>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="xl:col-span-8">
           <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[700px] flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full flex-1">
                 <div className="p-10 md:p-14 space-y-6 border-r border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Source Manuscript</h4>
                    <textarea 
                      className="w-full h-full min-h-[500px] bg-transparent outline-none font-medium text-lg leading-relaxed text-slate-700 resize-none custom-scrollbar"
                      placeholder="Paste your script to translate..."
                      value={text}
                      onChange={e => setText(e.target.value)}
                    />
                 </div>
                 <div className="p-10 md:p-14 space-y-6 bg-emerald-50/20 relative">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Narrative Result</h4>
                    <div className="h-full min-h-[500px] font-black text-xl leading-relaxed text-emerald-900">
                      {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                           <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">{NEURAL_STATUS[statusIdx]}</p>
                        </div>
                      ) : result ? (
                        <div className="animate-fadeIn whitespace-pre-wrap">{result}</div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-200"><ICONS.Sparkles className="w-20 h-20" /></div>
                      )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
