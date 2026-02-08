
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { generateThumbnailImage, generateThumbnailStrategy } from '../../services/geminiService';
import { downloadFile } from '../../utils/helpers';
import { ArchiveService } from '../../services/ArchiveService';
import { ThumbnailPackage, ThumbnailDesignSpec, ArchiveEntry } from '../../types';
import { Tooltip } from '../Tooltip';

const ASPECT_RATIOS = [
  { id: '16:9', key: 'landscape', label: '16:9 - Landscape (YT/FB)', icon: '📺' },
  { id: '9:16', key: 'vertical', label: '9:16 - Vertical (Shorts/TikTok)', icon: '📱' },
  { id: '1:1', key: 'square', label: '1:1 - Square (Insta)', icon: '📸' },
] as const;

export const ThumbnailTool: React.FC<{ 
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}> = ({ onBack, initialAsset }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'landscape' | 'vertical' | 'square'>('landscape');
  const [strategy, setStrategy] = useState<ThumbnailPackage | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState('');
  const [quotaError, setQuotaError] = useState(false);

  useEffect(() => {
    if (initialAsset && initialAsset.type === 'Thumbnail') {
      const data = initialAsset.content as { strategy: ThumbnailPackage; images: Record<string, string> };
      setStrategy(data.strategy);
      setGeneratedImages(data.images);
      setInput(initialAsset.metadata?.sourceText || '');
    }
  }, [initialAsset]);

  const handleOpenKeyDialog = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setQuotaError(false);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setError(null);
    setQuotaError(false);
    setStrategy(null);
    setGeneratedImages({});

    try {
      setGenerationStep('Analyzing narrative psychology...');
      const packageData = await generateThumbnailStrategy(input);
      setStrategy(packageData);

      const images: Record<string, string> = {};
      
      // Generate each image
      for (const ratio of ASPECT_RATIOS) {
        setGenerationStep(`Synthesizing ${ratio.id} design...`);
        const spec = packageData[ratio.key as keyof ThumbnailPackage];
        const imageUrl = await generateThumbnailImage(spec.aiImagePrompt, ratio.id);
        images[ratio.key] = imageUrl;
        setGeneratedImages(prev => ({ ...prev, [ratio.key]: imageUrl }));
      }

      // Save to archive
      ArchiveService.saveAsset({
        type: 'Thumbnail',
        title: input.substring(0, 30) + '...',
        content: { strategy: packageData, images },
        language: 'Multilingual',
        toolId: 'thumbnail',
        metadata: { sourceText: input }
      });

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("QUOTA") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        setQuotaError(true);
        setError("QUOTA_EXHAUSTED: High-fidelity design requires a paid API key.");
      } else {
        setError(err.message || "Synthesis engine fault.");
      }
    } finally {
      setIsProcessing(false);
      setGenerationStep('');
    }
  };

  const handleDownload = (ratioKey: string) => {
    const url = generatedImages[ratioKey];
    if (!url) return;
    downloadFile(url, `THUMB_${ratioKey}_${Date.now()}.png`, 'image/png');
  };

  const SpecSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{label}</p>
      <div className="text-sm font-medium text-slate-700 leading-relaxed">{children}</div>
    </div>
  );

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all shadow-sm active:scale-90">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Design Strategist</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-500 mt-4">Professional CTR Optimization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-2xl space-y-10">
            <div className="space-y-6">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Narrative / Story Script</label>
              <textarea 
                className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:outline-none focus:border-indigo-500 font-bold text-lg h-64 resize-none transition-all shadow-inner"
                placeholder="Paste story script or narrative here..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={!input.trim() || isProcessing}
              className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isProcessing ? 'Strategizing...' : 'Generate Design Pack'}
              {!isProcessing && <ICONS.Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
            </button>

            {error && (
              <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-[2rem] text-xs font-bold animate-fadeIn space-y-4">
                <p>{error}</p>
                {quotaError && (
                  <button onClick={handleOpenKeyDialog} className="w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700">Connect Paid Key</button>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><ICONS.Sparkles className="w-5 h-5" /></div>
               <h4 className="text-lg font-black uppercase tracking-widest">CTR Intelligence</h4>
             </div>
             <p className="text-xs text-slate-400 font-medium leading-relaxed">
               MediaFlow Pro analyzes your narrative to find the psychological peak. Our synthesis engine optimizes for curiosity gaps and visual weight.
             </p>
          </div>
        </div>

        <div className="xl:col-span-8">
          {isProcessing ? (
             <div className="h-[800px] bg-slate-50 border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center gap-10 animate-pulse">
                <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-4">
                   <p className="text-3xl font-black uppercase tracking-[0.4em] text-indigo-600">{generationStep}</p>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synthesizing professional assets...</p>
                </div>
             </div>
          ) : !strategy ? (
             <div className="h-[800px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 gap-8">
                <div className="w-24 h-24 bg-white rounded-[3rem] flex items-center justify-center shadow-inner"><ICONS.Image className="w-12 h-12 opacity-20" /></div>
                <div className="text-center space-y-3">
                  <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Studio Awaiting Script</p>
                  <p className="text-sm font-medium text-slate-400 max-w-md mx-auto leading-relaxed">Input your narrative to generate detailed design specs and AI-synthesized thumbnails for all major platforms.</p>
                </div>
             </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
               <div className="bg-white p-4 rounded-[3rem] border border-slate-200 shadow-xl flex items-center gap-2">
                 {ASPECT_RATIOS.map(ratio => (
                   <button 
                    key={ratio.key} 
                    onClick={() => setActiveTab(ratio.key)}
                    className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === ratio.key ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                   >
                     <span className="text-lg">{ratio.icon}</span>
                     {ratio.label}
                   </button>
                 ))}
               </div>

               {ASPECT_RATIOS.map(ratio => ratio.key === activeTab && (
                 <div key={ratio.key} className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
                    <div className="lg:col-span-7 space-y-8">
                       <div className="bg-white rounded-[4rem] border-8 border-white shadow-2xl overflow-hidden group relative aspect-video" style={{ aspectRatio: ratio.id }}>
                          {generatedImages[ratio.key] ? (
                            <img src={generatedImages[ratio.key]} className="w-full h-full object-cover" alt={ratio.label} />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button onClick={() => handleDownload(ratio.key)} className="p-8 bg-white text-slate-900 rounded-full shadow-2xl hover:scale-110 transition-all"><ICONS.Download className="w-10 h-10" /></button>
                          </div>
                          <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">Neural Synthesis</div>
                       </div>

                       <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white space-y-10 shadow-2xl border border-white/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                          <div className="relative z-10 space-y-10">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Image Generation Prompt</p>
                               <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] font-mono text-xs text-slate-300 leading-relaxed">
                                 {strategy[ratio.key as keyof ThumbnailPackage].aiImagePrompt}
                               </div>
                            </div>
                            <button 
                              onClick={() => navigator.clipboard.writeText(strategy[ratio.key as keyof ThumbnailPackage].aiImagePrompt)}
                              className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95 flex items-center gap-3"
                            >
                              <ICONS.Pencil className="w-4 h-4" /> Copy Prompt
                            </button>
                          </div>
                       </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                       <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-xl space-y-12">
                          <div className="space-y-4">
                             <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{strategy[ratio.key as keyof ThumbnailPackage].concept}</h3>
                             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Professional Design Specification</p>
                          </div>

                          <div className="space-y-8">
                             <SpecSection label="Visual Composition">
                                <p>• <strong>Focal:</strong> {strategy[ratio.key as keyof ThumbnailPackage].visualComposition.mainFocalPoint}</p>
                                <p>• <strong>BG:</strong> {strategy[ratio.key as keyof ThumbnailPackage].visualComposition.background}</p>
                                <p>• <strong>Layout:</strong> {strategy[ratio.key as keyof ThumbnailPackage].visualComposition.layout}</p>
                                <p>• <strong>Depth:</strong> {strategy[ratio.key as keyof ThumbnailPackage].visualComposition.depth}</p>
                             </SpecSection>

                             <SpecSection label="Typography">
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                                   <div className="space-y-1">
                                      <p className="text-[9px] font-black text-slate-400 uppercase">Main Overlay</p>
                                      <p className="text-xl font-black text-slate-900">"{strategy[ratio.key as keyof ThumbnailPackage].typography.mainText.text}"</p>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-500">
                                      <p>Font: {strategy[ratio.key as keyof ThumbnailPackage].typography.mainText.fontStyle}</p>
                                      <p>Pos: {strategy[ratio.key as keyof ThumbnailPackage].typography.mainText.position}</p>
                                   </div>
                                </div>
                             </SpecSection>

                             <SpecSection label="Color Strategy">
                                <div className="flex gap-4 items-center">
                                   <div className="flex-1 space-y-1">
                                      <p className="text-[9px] font-black text-slate-400 uppercase">Palette</p>
                                      <p className="text-xs font-bold text-slate-700">{strategy[ratio.key as keyof ThumbnailPackage].colorPalette.primary} / {strategy[ratio.key as keyof ThumbnailPackage].colorPalette.secondary}</p>
                                   </div>
                                   <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{strategy[ratio.key as keyof ThumbnailPackage].colorPalette.contrastLevel} Contrast</div>
                                </div>
                             </SpecSection>

                             <SpecSection label="Click Triggers">
                                <div className="space-y-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                      <span className="font-black text-slate-900">{strategy[ratio.key as keyof ThumbnailPackage].emotionalTriggers.primaryEmotion}</span>
                                   </div>
                                   <p className="italic text-slate-500 text-xs leading-relaxed">"{strategy[ratio.key as keyof ThumbnailPackage].emotionalTriggers.visualHooks}"</p>
                                </div>
                             </SpecSection>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
