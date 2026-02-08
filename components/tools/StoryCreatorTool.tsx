
import React, { useState, useEffect } from 'react';
import { ICONS, SUPPORTED_LANGUAGES } from '../../constants';
import { generateStoryArc, generateAudiobookNarration } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';
import { downloadFile } from '../../utils/helpers';
import { ArchiveEntry } from '../../types';
import { Tooltip } from '../Tooltip';

export const StoryCreatorTool: React.FC<{ 
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}> = ({ onBack, initialAsset }) => {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [lang, setLang] = useState('English');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [narrationContent, setNarrationContent] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [canContinueNarration, setCanContinueNarration] = useState(false);
  const [viewMode, setViewMode] = useState<'manuscript' | 'narration'>('manuscript');
  const [localHistory, setLocalHistory] = useState<ArchiveEntry[]>([]);

  // Initialize with initialAsset if provided (Resume from Archive)
  useEffect(() => {
    if (initialAsset) {
      if (initialAsset.type === 'Story') {
        setStoryContent(initialAsset.content);
        setTopic(initialAsset.title);
        setCurrentTitle(initialAsset.title);
        setLang(initialAsset.language);
        setCanContinue(checkContinuation(initialAsset.content));
        setViewMode('manuscript');
      } else if (initialAsset.type === 'Audiobook') {
        setNarrationContent(initialAsset.content);
        setStoryContent(initialAsset.metadata?.story || '');
        setTopic(initialAsset.title);
        setCurrentTitle(initialAsset.title);
        setLang(initialAsset.language);
        setCanContinueNarration(checkNarrationContinuation(initialAsset.content));
        setViewMode('narration');
      }
    }
    refreshHistory();
  }, [initialAsset]);

  const refreshHistory = () => {
    setLocalHistory(ArchiveService.listAll().filter(a => a.type === 'Story' || a.type === 'Audiobook').slice(0, 10));
  };

  const checkContinuation = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('ဆက်ရေးမလား') || lower.includes('continue?') || lower.includes('to be continued');
  };

  const checkNarrationContinuation = (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('ဆက်လက်ဖတ်ကြားပေးရမလား') || lower.includes('continue narration?') || lower.includes('to be continued');
  };

  const handleGenerate = async (isContinuation = false) => {
    if (!topic.trim()) return;
    setIsProcessing(true);
    if (!isContinuation) {
        setStoryContent('');
        setNarrationContent('');
        setCurrentTitle('');
        setViewMode('manuscript');
    }
    setError(null);
    try {
      const data = await generateStoryArc({ 
        topic, 
        context, 
        lang, 
        history: isContinuation ? storyContent : undefined 
      });
      
      const newContent = isContinuation ? `${storyContent.replace('ဆက်ရေးမလား?', '')}\n\n${data.story}` : data.story;
      setStoryContent(newContent);
      setCanContinue(checkContinuation(data.story));

      let title = currentTitle;
      if (!isContinuation) {
          const firstLine = data.story.split('\n')[0].replace(/[#*]/g, '').trim();
          title = firstLine || topic;
          setCurrentTitle(title);
      }
      
      ArchiveService.saveAsset({
        type: 'Story',
        title: title,
        content: newContent,
        language: lang,
        toolId: 'story',
        metadata: { wordCount: newContent.split(/\s+/).length }
      });
      refreshHistory();
    } catch (err: any) {
      setError(err.message || "Narrative synthesis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNarrate = async (isContinuation = false) => {
    if (!storyContent) return;
    setIsNarrating(true);
    setError(null);
    if (!isContinuation) {
        setNarrationContent('');
    }
    
    try {
      const data = await generateAudiobookNarration({
        text: storyContent,
        lang,
        history: isContinuation ? narrationContent : undefined
      });
      
      const newNarration = isContinuation ? `${narrationContent}\n\n${data.narration}` : data.narration;
      setNarrationContent(newNarration);
      setCanContinueNarration(checkNarrationContinuation(data.narration));
      setViewMode('narration');
      
      ArchiveService.saveAsset({
        type: 'Audiobook',
        title: currentTitle,
        content: newNarration,
        language: lang,
        toolId: 'story',
        metadata: { story: storyContent, wordCount: newNarration.split(/\s+/).length }
      });
      refreshHistory();
    } catch (err: any) {
      setError(err.message || "Narration synthesis failed.");
    } finally {
      setIsNarrating(false);
    }
  };

  const loadFromLocal = (item: ArchiveEntry) => {
    if (item.type === 'Story') {
      setStoryContent(item.content);
      setNarrationContent('');
      setViewMode('manuscript');
    } else {
      setNarrationContent(item.content);
      setStoryContent(item.metadata?.story || '');
      setViewMode('narration');
    }
    setCurrentTitle(item.title);
    setTopic(item.title);
    setLang(item.language);
    setCanContinue(item.type === 'Story' ? checkContinuation(item.content) : false);
    setCanContinueNarration(item.type === 'Audiobook' ? checkNarrationContinuation(item.content) : false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = () => {
    const text = viewMode === 'manuscript' ? storyContent : narrationContent;
    if (text) navigator.clipboard.writeText(text);
  };

  const downloadAsTxt = () => {
    const text = viewMode === 'manuscript' ? storyContent : narrationContent;
    if (text) {
      const suffix = viewMode === 'manuscript' ? '_Manuscript' : '_Narration';
      const safeTitle = (currentTitle || "Novel").substring(0, 30).replace(/[^a-z0-9]/gi, '_');
      downloadFile(text, `${safeTitle}${suffix}.txt`, 'text/plain');
    }
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all shadow-sm active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Story Architect</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-2">Literary Manuscript Lab</p>
          </div>
        </div>

        {storyContent && (
            <div className="flex items-center gap-3 animate-fadeIn">
                <button onClick={copyToClipboard} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2">
                    <ICONS.Pencil className="w-4 h-4" /> Copy {viewMode === 'manuscript' ? 'Manuscript' : 'Narration'}
                </button>
                <button onClick={downloadAsTxt} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2">
                    <ICONS.Download className="w-4 h-4" /> Export .TXT
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-8">
             <div className="space-y-6">
                <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Novel Title / Seed</label>
                    <textarea 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none h-32 resize-none custom-scrollbar shadow-inner" 
                        placeholder="e.g. The Last Whisper of Bagan..."
                        value={topic} 
                        onChange={e => setTopic(e.target.value)} 
                    />
                </div>
                <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">World & Tonality</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-500 font-bold outline-none" placeholder="Atmosphere..." value={context} onChange={e => setContext(e.target.value)} />
                </div>
                <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Language Mode</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={lang} onChange={(e) => setLang(e.target.value)}>
                        {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>
                </div>
             </div>

             <div className="space-y-3">
                <button onClick={() => handleGenerate(false)} disabled={!topic.trim() || isProcessing || isNarrating} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-4 active:scale-95 group">
                    {isProcessing ? 'Synthesizing...' : 'Initiate Novel'}
                    {!isProcessing && <ICONS.Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                </button>
                {storyContent && (
                    <button onClick={() => handleNarrate(false)} disabled={isProcessing || isNarrating} className="w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95">
                        {isNarrating ? 'Tuning Narrator...' : 'Convert to Audiobook Script'}
                    </button>
                )}
             </div>

             {canContinue && viewMode === 'manuscript' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center animate-pulse">Story Signal: ဆက်ရေးမလား?</p>
                    <button onClick={() => handleGenerate(true)} disabled={isProcessing || isNarrating} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-4 active:scale-95">
                        Continue Writing
                    </button>
                </div>
             )}

             {canContinueNarration && viewMode === 'narration' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center animate-pulse">Narration Signal: ဆက်လက်ဖတ်ကြားပေးရမလား?</p>
                    <button onClick={() => handleNarrate(true)} disabled={isProcessing || isNarrating} className="w-full py-5 bg-amber-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg flex items-center justify-center gap-4 active:scale-95">
                        Continue Narration
                    </button>
                </div>
             )}

             {error && <div className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-fadeIn">{error}</div>}
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[400px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Local Archives</h3>
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {localHistory.map(item => (
                <div key={item.id} onClick={() => loadFromLocal(item)} className={`group p-5 rounded-2xl border transition-all cursor-pointer ${currentTitle === item.title ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${currentTitle === item.title ? 'text-indigo-600' : 'text-slate-700'}`}>{item.fileId}: {item.title}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{item.type}</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">•</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">v{item.version}</span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          {(storyContent || narrationContent) ? (
            <div className="bg-[#fffdfa] rounded-[4rem] p-12 md:p-24 shadow-2xl border border-[#ede3d1] animate-fadeIn space-y-16 relative overflow-hidden min-h-[900px]">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[4rem]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>
               <div className="relative z-10 space-y-16 max-w-3xl mx-auto">
                  <header className="space-y-8 text-center">
                     <div className="flex justify-center mb-8">
                        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner border border-slate-200">
                           <button onClick={() => setViewMode('manuscript')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'manuscript' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Manuscript</button>
                           <button onClick={() => setViewMode('narration')} disabled={!narrationContent} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'narration' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-30`}>Narration Script</button>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-[#b4a48a]">{viewMode === 'manuscript' ? 'Novel Manuscript' : 'Audiobook Performance Script'}</p>
                        <h3 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter">{currentTitle}</h3>
                     </div>
                  </header>
                  <article className={`text-xl md:text-2xl text-slate-800 leading-[2.6] font-serif whitespace-pre-wrap ${viewMode === 'narration' ? 'text-[#3d3d3d] border-l-4 border-amber-200 pl-8' : ''}`}>
                    {viewMode === 'manuscript' ? storyContent : (narrationContent || 'Narration not yet generated.')}
                  </article>
                  {(isProcessing || isNarrating) && (
                    <div className="py-20 flex flex-col items-center gap-6 opacity-40">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expanding Universe...</p>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="h-[900px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 gap-8 animate-fadeIn">
               <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-50"><ICONS.Pencil className="w-12 h-12" /></div>
               <div className="text-center space-y-4 px-10">
                  <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Awaiting Muse</p>
                  <p className="text-sm font-medium text-slate-400 max-w-md mx-auto leading-relaxed">Input a title or a spark of an idea to synthesize a deep novel manuscript and professional audiobook narration script.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
