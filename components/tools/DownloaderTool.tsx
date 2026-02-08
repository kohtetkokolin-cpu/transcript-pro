
import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { analyzeYouTubeVideo } from '../../services/geminiService';

export const DownloaderTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      // Fix: Pass an options object instead of a string to satisfy analyzeYouTubeVideo's type requirements
      const data = await analyzeYouTubeVideo(url, {
        length: 'short',
        lang: 'English',
        frameRate: '30fps',
        aspectRatio: '16:9'
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-slideUp max-w-4xl mx-auto space-y-10">
      <div className="flex items-center gap-5">
        <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-[1.25rem] hover:border-indigo-500 transition-all">
          <ICONS.Link className="w-6 h-6 rotate-180" />
        </button>
        <h2 className="text-3xl font-black text-slate-900">Downloader</h2>
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-2xl space-y-12">
        <div className="space-y-4">
          <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Media URL</label>
          <div className="relative group">
            <input 
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-10 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:outline-none font-bold text-xl transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button 
              onClick={handleFetch}
              disabled={!url.trim() || isProcessing}
              className="absolute right-4 top-4 bottom-4 px-10 bg-cyan-500 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-cyan-600 disabled:opacity-50 transition-all shadow-lg"
            >
              {isProcessing ? 'Probing...' : 'Fetch Asset'}
            </button>
          </div>
        </div>

        {result && (
          <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] flex flex-col md:flex-row gap-10 items-center">
            {result.thumbnailUrl && <img src={result.thumbnailUrl} className="w-64 rounded-2xl shadow-xl" alt="Source" />}
            <div className="flex-1 space-y-4">
              <h4 className="text-2xl font-black text-slate-900">{result.originalTitle || 'Unknown Asset'}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {result.summary ? (result.summary.length > 150 ? `${result.summary.substring(0, 150)}...` : result.summary) : 'No summary available for this asset.'}
              </p>
              <div className="flex gap-4">
                 <button className="px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic House opacity-50 cursor-not-allowed">
                    Direct Download Proxy Restricted
                 </button>
              </div>
            </div>
          </div>
        )}
        {error && <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl font-bold">{error}</div>}
      </div>
    </div>
  );
};
