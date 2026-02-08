
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../constants';
import { ProfessionalRecapResult, ArchiveEntry } from '../../types';
import { fileToBase64, downloadFile } from '../../utils/helpers';
import { generateProfessionalRecap } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';
import { Tooltip } from '../Tooltip';

const LOADING_PHASES = [
  "Expert Editor initializing: Probing full context...",
  "Identifying key story beats & emotional peaks...",
  "Mapping detailed edit timeline...",
  "Crafting retention-focused hook strategies...",
  "Synthesizing copyright-safe audio plan...",
  "Finalizing visual direction & overlays...",
  "Polishing production-ready blueprint..."
];

export const ProfessionalRecapTool: React.FC<{ 
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}> = ({ onBack, initialAsset }) => {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProfessionalRecapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'timeline' | 'audio' | 'metadata'>('blueprint');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAsset) {
      setResult(initialAsset.content);
      setUrl(initialAsset.metadata?.sourceUrl || '');
    }
  }, [initialAsset]);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_PHASES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleGenerate = async () => {
    if (!url.trim() && !file) return;
    setIsProcessing(true);
    setResult(null);
    setError(null);

    try {
      const input = url.trim() 
        ? { url } 
        : { fileBase64: await fileToBase64(file!), mimeType: file!.type };
      
      const data = await generateProfessionalRecap(input);
      setResult(data);

      ArchiveService.saveAsset({
        type: 'Recap',
        title: data.analysis.originalTitle || 'New Recap Blueprint',
        content: data,
        language: 'Multilingual',
        toolId: 'professional_recap',
        metadata: { sourceUrl: url }
      });
    } catch (err: any) {
      setError(err.message || "Narrative synthesis fault.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = JSON.stringify(result, null, 2);
    downloadFile(content, `Recap_Blueprint_${result.analysis.originalTitle.replace(/\s+/g, '_')}.json`, "application/json");
  };

  const SectionHeading = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
      {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
      <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">{children}</h4>
    </div>
  );

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all active:scale-95 shadow-sm">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">Recap Producer</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 mt-3">Advanced Editor Blueprint Mode</p>
          </div>
        </div>
        {result && (
          <button onClick={handleDownload} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg active:scale-95">
            <ICONS.Download className="w-4 h-4" /> Export JSON Blueprint
          </button>
        )}
      </div>

      {!result ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-5 space-y-8">
            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-xl space-y-10">
               <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Production Link</label>
                    <input 
                      type="text" 
                      placeholder="Paste YouTube URL..." 
                      className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:outline-none focus:border-indigo-500 font-bold transition-all shadow-inner"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-slate-200"><div className="h-[1px] flex-1 bg-slate-100" /><span className="text-[9px] font-black">OR</span><div className="h-[1px] flex-1 bg-slate-100" /></div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Local Master</label>
                    <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[2.5rem] p-8 text-center cursor-pointer transition-all ${file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                      <p className="font-black truncate text-slate-700">{file ? file.name : 'Drop Footage Asset'}</p>
                    </div>
                  </div>
               </div>
               <button 
                  onClick={handleGenerate} 
                  disabled={isProcessing} 
                  className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                 {isProcessing ? 'Synthesizing...' : 'Generate Editor Blueprint'}
               </button>
               {isProcessing && <p className="text-center text-[10px] font-black uppercase text-indigo-600 animate-pulse tracking-widest leading-relaxed px-4">{LOADING_PHASES[loadingMsgIdx]}</p>}
               {error && <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl text-xs font-bold animate-fadeIn">{error}</div>}
            </div>
          </div>
          <div className="xl:col-span-7 flex flex-col items-center justify-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 h-[600px] text-center p-20 gap-8">
             <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-inner text-slate-200"><ICONS.Studio className="w-12 h-12" /></div>
             <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Theater Empty</h3>
                <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Provide an asset link or file to initiate an expert-grade professional recap blueprint.</p>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[900px] animate-fadeIn">
           <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400">Master Production Blueprint</span>
                <h3 className="text-3xl font-black truncate max-w-xl">{result.analysis.originalTitle}</h3>
              </div>
              <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                {(['blueprint', 'timeline', 'audio', 'metadata'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
                ))}
              </div>
           </div>
           
           <div className="p-12 md:p-20 flex-1 overflow-y-auto max-h-[1000px] custom-scrollbar">
              {activeTab === 'blueprint' && (
                <div className="space-y-20 animate-fadeIn">
                   {/* Analysis Section */}
                   <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      <div className="space-y-10">
                        <SectionHeading icon={ICONS.List}>Core Analysis</SectionHeading>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Duration</p>
                             <p className="text-xl font-black text-slate-800">{result.analysis.duration}</p>
                           </div>
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Target Recap</p>
                             <p className="text-xl font-black text-slate-800">{result.analysis.targetLength}</p>
                           </div>
                        </div>
                        <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[3rem] space-y-4">
                           <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Master Concept</h5>
                           <p className="text-2xl font-medium leading-relaxed text-indigo-900 italic">"{result.analysis.coreMessage}"</p>
                        </div>
                      </div>

                      <div className="space-y-10">
                        <SectionHeading icon={ICONS.Sparkles}>Hook Strategy</SectionHeading>
                        <div className="space-y-6">
                          {result.hookStrategy.options.map((hook, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm hover:shadow-lg transition-all group">
                               <div className="flex justify-between items-center">
                                  <span className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{hook.type}</span>
                                  <span className="text-[9px] font-black text-indigo-500 uppercase">Option 0{i+1}</span>
                               </div>
                               <div className="space-y-4">
                                  <p className="text-sm font-bold text-slate-800 leading-relaxed border-l-4 border-indigo-100 pl-4">{hook.voScript}</p>
                                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                                     <div>
                                        <p className="text-slate-400 font-black uppercase mb-1">Visual</p>
                                        <p className="text-slate-600 font-bold">{hook.visual}</p>
                                     </div>
                                     <div>
                                        <p className="text-slate-400 font-black uppercase mb-1">Overlay</p>
                                        <p className="text-indigo-600 font-black">"{hook.textOverlay}"</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                   </section>

                   {/* Techniques Section */}
                   <section className="space-y-10">
                      <SectionHeading icon={ICONS.Image}>Visual Production Techniques</SectionHeading>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Graphic Overlays</h5>
                            <div className="space-y-2">
                              {result.visualTechniques.graphicReplacements.map((g, i) => (
                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">{g}</div>
                              ))}
                            </div>
                         </div>
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Retention Boosters</h5>
                            <div className="space-y-2">
                              {result.visualTechniques.engagementBoosters.map((e, i) => (
                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">{e}</div>
                              ))}
                            </div>
                         </div>
                         <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Color Grading</h5>
                            <div className="p-6 bg-slate-900 text-indigo-400 rounded-3xl border border-white/5 font-bold text-sm italic">
                              {result.visualTechniques.colorGrading}
                            </div>
                         </div>
                      </div>
                   </section>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-12 animate-fadeIn">
                   <SectionHeading icon={ICONS.Link}>Master Edit Timeline</SectionHeading>
                   <div className="space-y-16">
                      {result.editTimeline.map((section, idx) => (
                        <div key={idx} className="relative pl-12 border-l-2 border-slate-100">
                           <div className="absolute left-[-11px] top-0 w-5 h-5 bg-white border-2 border-indigo-500 rounded-full" />
                           <div className="space-y-6">
                              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                 <div>
                                    <h5 className="text-2xl font-black text-slate-900 tracking-tight">{section.segmentTitle}</h5>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{section.timeRange}</p>
                                 </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                 {section.beats.map((beat, bIdx) => (
                                   <div key={bIdx} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row gap-8 hover:bg-white hover:border-indigo-200 transition-all group">
                                      <div className="md:w-1/4">
                                         <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Editor Note</p>
                                         <p className="text-xs font-bold text-slate-800 leading-relaxed">{beat.description}</p>
                                      </div>
                                      <div className="md:w-3/4 bg-white p-6 rounded-2xl shadow-inner border border-slate-50">
                                         <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Directing Instruction</p>
                                         <p className="text-sm font-medium text-slate-600 leading-relaxed">{beat.instruction}</p>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   <div className="pt-20">
                      <SectionHeading icon={ICONS.Sparkles}>Mid-Roll Retention Map</SectionHeading>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {result.retentionHooks.map((h, i) => (
                           <div key={i} className="p-8 bg-indigo-900 text-white rounded-[2.5rem] space-y-4 shadow-xl">
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">@{h.timestamp}</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest">{h.type}</span>
                              </div>
                              <p className="text-lg font-black leading-tight">"{h.text}"</p>
                              <p className="text-[11px] font-medium text-indigo-200 leading-relaxed opacity-60">{h.visual}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="space-y-16 animate-fadeIn max-w-4xl mx-auto">
                   <SectionHeading icon={ICONS.Studio}>Audio Production Strategy</SectionHeading>
                   <div className="grid grid-cols-1 gap-10">
                      <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                         <div className="relative z-10 space-y-12">
                            <div className="space-y-4">
                               <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Master Voiceover Manuscript</h5>
                               <div className="text-2xl font-medium leading-[2] text-slate-200 italic font-serif border-l-4 border-indigo-600 pl-10 whitespace-pre-wrap">
                                 {result.audioPlan.voScript}
                               </div>
                            </div>
                            <button 
                              onClick={() => navigator.clipboard.writeText(result.audioPlan.voScript)}
                              className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95 flex items-center gap-3"
                            >
                              <ICONS.Pencil className="w-4 h-4" /> Copy Manuscript
                            </button>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-10 bg-white border border-slate-200 rounded-[3rem] shadow-sm space-y-4">
                            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Music Licensing Strategy</h5>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{result.audioPlan.musicStrategy}</p>
                         </div>
                         <div className="p-10 bg-white border border-slate-200 rounded-[3rem] shadow-sm space-y-4">
                            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dialogue Mastering</h5>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{result.audioPlan.originalAudioHandling}</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'metadata' && (
                <div className="space-y-20 animate-fadeIn">
                   <section className="space-y-10">
                      <SectionHeading icon={ICONS.List}>SEO & Packaging</SectionHeading>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                         <div className="space-y-10">
                            <div className="space-y-6">
                               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">High-CTR Titles</h5>
                               <div className="space-y-3">
                                  {result.metadataStrategy.titles.map((t, i) => (
                                    <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 hover:bg-white hover:border-indigo-200 transition-all flex justify-between items-center group">
                                       <span>{t}</span>
                                       <button onClick={() => navigator.clipboard.writeText(t)} className="opacity-0 group-hover:opacity-100 text-indigo-600"><ICONS.Pencil className="w-4 h-4" /></button>
                                    </div>
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-6">
                               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Keywords / Tags</h5>
                               <div className="flex flex-wrap gap-2">
                                  {result.metadataStrategy.tags.map((tag, i) => (
                                    <span key={i} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase">#{tag}</span>
                                  ))}
                               </div>
                            </div>
                         </div>

                         <div className="space-y-10">
                            <div className="space-y-6">
                               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Master Description</h5>
                               <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-medium text-sm text-slate-600 leading-relaxed shadow-inner whitespace-pre-wrap">
                                  {result.metadataStrategy.description}
                               </div>
                            </div>
                            <div className="space-y-6">
                               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Thumbnail Overlays</h5>
                               <div className="grid grid-cols-1 gap-2">
                                  {result.metadataStrategy.thumbnailText.map((txt, i) => (
                                    <div key={i} className="p-5 bg-indigo-600 text-white rounded-2xl font-black text-center shadow-lg transform hover:scale-105 transition-all cursor-default">
                                      {txt}
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </section>

                   <section className="p-16 bg-slate-900 rounded-[4rem] text-white space-y-10 shadow-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center"><ICONS.Download className="w-6 h-6" /></div>
                         <h5 className="text-2xl font-black tracking-tight">Final Export Configuration</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Visual</p>
                            <p className="text-sm font-bold text-slate-300 leading-relaxed">{result.exportSettings.video}</p>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Audio</p>
                            <p className="text-sm font-bold text-slate-300 leading-relaxed">{result.exportSettings.audio}</p>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Optimization</p>
                            <p className="text-sm font-bold text-slate-300 leading-relaxed">{result.exportSettings.platformNotes}</p>
                         </div>
                      </div>
                   </section>

                   <section className="space-y-6">
                      <SectionHeading icon={ICONS.Studio}>Copyright & Fair Use Checklist</SectionHeading>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {result.copyrightChecklist.map((item, i) => (
                           <div key={i} className="flex items-center gap-4 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span className="text-xs font-black text-emerald-900 uppercase tracking-widest">{item}</span>
                           </div>
                         ))}
                      </div>
                   </section>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
