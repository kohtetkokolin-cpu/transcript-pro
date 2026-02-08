
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { ArchiveEntry } from '../../types';
import { analyzeYouTubeVideo } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';

interface YoutubeTranscribeToolProps {
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}

export const YoutubeTranscribeTool: React.FC<YoutubeTranscribeToolProps> = ({ onBack, initialAsset }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    // If we're coming from the archive, load the saved asset immediately
    if (initialAsset) {
      setResult(initialAsset.content);
      setUrl(initialAsset.metadata?.sourceUrl || '');
    }
    refreshHistory();
  }, [initialAsset]);

  const refreshHistory = () => {
    // Specifically filter for recap/youtube transcript tools
    const allHistory = ArchiveService.listAll();
    setHistory(allHistory.filter(a => a.toolId === 'transcribe_youtube' || (a.type === 'Recap' && a.metadata?.sourceUrl)).slice(0, 20));
  };

  const getFriendlyErrorMessage = (err: string) => {
    const msg = err.toUpperCase();
    if (msg.includes('PRIVATE')) return "🔒 Private Video Detected: Engine cannot access content restricted to private audiences.";
    if (msg.includes('AGE')) return "🔞 Age Restriction Alert: Content is protected by YouTube's age-gate.";
    if (msg.includes('UNAVAILABLE')) return "⚠️ Media Not Found: Provided URL appears to be broken or removed.";
    return "🛠️ Production Synthesis Fault: " + (err || "Verify URL or try another source.");
  };

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeYouTubeVideo(url, {
        length: 'detailed',
        lang: 'English',
        frameRate: '30fps',
        aspectRatio: '16:9'
      });
      setResult(data);
      
      // Save this new analysis to the Archive Master
      ArchiveService.saveAsset({
        type: 'Recap',
        title: data.originalTitle || 'YouTube Insight Report',
        content: data,
        language: 'English',
        toolId: 'transcribe_youtube',
        metadata: { sourceUrl: url }
      });
      refreshHistory();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const loadFromHistory = (item: ArchiveEntry) => {
    setResult(item.content);
    setUrl(item.metadata?.sourceUrl || '');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex items-center gap-5">
        <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-red-500 transition-all shadow-sm active:scale-95">
          <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
        </button>
        <div>
          <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">YouTube Pro</h2>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-600 mt-3">Advanced Insight & Production Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Control Column */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-2xl space-y-8">
            <div className="space-y-6">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Production Link</label>
              <input 
                type="text" 
                placeholder="Paste YouTube URL..." 
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:outline-none focus:border-red-500 font-bold transition-all shadow-inner"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
              />
              <button 
                onClick={handleGenerate}
                disabled={!url.trim() || isProcessing}
                className="w-full py-6 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {isProcessing ? 'Analyzing Content...' : 'Extract Intelligence'}
              </button>
            </div>
            {error && <div className="p-6 bg-red-50 text-red-700 rounded-2xl text-[10px] font-bold border border-red-100 animate-fadeIn">{error}</div>}
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[300px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Project History</h3>
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {history.map(item => (
                <div key={item.id} onClick={() => loadFromHistory(item)} className={`p-5 rounded-2xl border cursor-pointer transition-all group ${result?.originalTitle === item.title ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-100 hover:border-red-300'}`}>
                  <p className={`text-xs font-black truncate ${result?.originalTitle === item.title ? 'text-red-600' : 'text-slate-700'}`}>{item.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                  <ICONS.Link className="w-10 h-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Projects Found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Result Column */}
        <div className="xl:col-span-8">
          {!result ? (
            <div className="h-[750px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 gap-8 animate-fadeIn">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-40">
                <ICONS.Link className="w-12 h-12" />
              </div>
              <div className="text-center space-y-4 px-10">
                <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Awaiting Assets</p>
                <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Provide a video URL to generate a comprehensive production report including grounded insights and executive summaries.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[750px] animate-fadeIn">
              <div className="bg-slate-900 p-12 md:p-16 text-white flex flex-col md:flex-row items-center gap-12">
                {result.thumbnailUrl && (
                  <div className="relative shrink-0">
                    <img src={result.thumbnailUrl} className="w-full md:w-80 rounded-[2.5rem] shadow-2xl border-4 border-white/10" alt="Thumb" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-[2.5rem]" />
                  </div>
                )}
                <div className="space-y-6 flex-1 text-center md:text-left">
                  <span className="px-5 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Grounded Production Report</span>
                  <h3 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">{result.originalTitle}</h3>
                </div>
              </div>
              
              <div className="p-12 md:p-20 space-y-12 bg-slate-50/50 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                <div className="space-y-8">
                  <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-red-500">Executive Summary</h4>
                  <div className="p-10 md:p-14 bg-white rounded-[3.5rem] text-2xl font-medium leading-[2] border border-slate-100 italic text-slate-700 shadow-xl shadow-slate-200/50 relative">
                    <div className="absolute top-0 left-10 w-12 h-1 bg-red-500/20" />
                    "{result.summary}"
                  </div>
                </div>

                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div className="space-y-8 pt-8">
                    <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-red-500">Production Benchmarks</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.keyPoints.map((point: string, i: number) => (
                        <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-start gap-6 hover:shadow-lg transition-all group">
                          <span className="text-3xl font-black text-red-100 group-hover:text-red-500 transition-colors">0{i+1}</span>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
