
import React, { useState, useEffect, useRef } from 'react';
import { ICONS, SUPPORTED_LANGUAGES } from '../../constants';
import { analyzeYouTubeVideo, summarizeMedia, generateVideoAsset } from '../../services/geminiService';
import { fileToBase64 } from '../../utils/helpers';
import { Tooltip } from '../Tooltip';

interface TimelineSegment {
  timestamp: string;
  visual: string;
  voiceover: string;
  subtitle?: string;
  motion?: string;
}

interface VideoSettings {
  aspectRatio: string;
  frameRate: string;
  language: string;
  watermark?: {
    image: string;
    position: string;
    opacity: number;
  };
}

interface RecapResult {
  title: string;
  summary: string;
  keyPoints: string[];
  videoSettings: VideoSettings;
  timeline: TimelineSegment[];
  originalTitle?: string;
  thumbnailUrl?: string;
}

const RENDERING_MESSAGES = [
  "Gemini Veo is processing neural clusters...",
  "Rendering cinematic frames...",
  "Optimizing lighting and motion paths...",
  "Applying custom watermark overlays...",
  "Synchronizing temporal recap brief...",
  "Finalizing master container...",
  "Encoding bitstreams for production..."
];

type ExportFormat = 'MP4' | 'MOV';
type ExportQuality = '720p' | '1080p';
type WatermarkPosition = 'Top Left' | 'Top Right' | 'Bottom Left' | 'Bottom Right' | 'Center';

export const RecapTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [voiceoverFile, setVoiceoverFile] = useState<File | null>(null);
  const [length, setLength] = useState<'short' | 'detailed'>('detailed');
  const [targetLang, setTargetLang] = useState('English');
  
  // Export Settings
  const [exportFormat, setExportFormat] = useState<ExportFormat>('MP4');
  const [exportQuality, setExportQuality] = useState<ExportQuality>('1080p');
  const [exportFileName, setExportFileName] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [renderingMsgIdx, setRenderingMsgIdx] = useState(0);

  // Watermark Settings
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('Bottom Right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [result, setResult] = useState<RecapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderedVideoUri, setRenderedVideoUri] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (isProcessing || isExporting) {
      interval = setInterval(() => {
        setRenderingMsgIdx((prev) => (prev + 1) % RENDERING_MESSAGES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isProcessing, isExporting]);

  useEffect(() => {
    if (result) {
      const baseName = (result.title || 'Recap').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      setExportFileName(`${baseName}_master`);
    }
  }, [result]);

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setWatermarkImage(`data:${file.type};base64,${base64}`);
    }
  };

  const handleGenerateRecap = async () => {
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'file' && !file) return;

    setIsProcessing(true);
    setResult(null);
    setError(null);
    setExportSuccess(false);
    setRenderedVideoUri(null);
    
    try {
      const voiceoverBase64 = voiceoverFile ? await fileToBase64(voiceoverFile) : undefined;
      const options = { 
        length, 
        lang: targetLang, 
        frameRate: '30fps', 
        aspectRatio: '16:9' as any,
        voiceoverBase64 
      };
      
      let data;
      if (mode === 'url') {
        data = await analyzeYouTubeVideo(url, options);
      } else if (file) {
        const base64 = await fileToBase64(file);
        data = await summarizeMedia(base64, file.type, options);
        data.originalTitle = file.name;
      }
      
      if (data && (data.title || data.summary)) {
        setResult(data as RecapResult);
      } else {
        throw new Error("Analysis failed. No production brief returned.");
      }
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProductionExport = async () => {
    if (!result) return;
    
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }

    setIsExporting(true);
    setExportSuccess(false);
    setExportProgress(0);
    setError(null);

    try {
      let watermarkContext = "";
      if (enableWatermark && watermarkImage) {
        watermarkContext = ` Overlay a custom watermark at the ${watermarkPosition} with ${watermarkOpacity}% opacity.`;
      }

      const videoPrompt = `A cinematic video recap of ${result.title}. ${result.summary}.${watermarkContext} Visual style: ${result.timeline[0]?.visual || 'Professional and high-quality'}. Resolution: ${exportQuality}.`;
      
      const progressInt = setInterval(() => {
        setExportProgress(p => p < 90 ? p + 2 : p);
      }, 5000);

      const downloadUri = await generateVideoAsset(videoPrompt, {
        resolution: exportQuality,
        aspectRatio: '16:9'
      });

      clearInterval(progressInt);
      setExportProgress(100);
      setRenderedVideoUri(downloadUri);
      setExportSuccess(true);
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        setError("API Key selection was invalid or expired. Please re-select a paid API key.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setError(err.message || "Video rendering failed. Ensure your selected API key has billing enabled.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadMaster = async () => {
    if (!renderedVideoUri) return;
    
    try {
      const apiKey = process.env.API_KEY;
      const response = await fetch(`${renderedVideoUri}&key=${apiKey}`);
      if (!response.ok) throw new Error("Storage fetch failed.");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${exportFileName}.${exportFormat.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Download failed: " + err.message);
    }
  };

  return (
    <div className="animate-slideUp max-w-6xl mx-auto space-y-10 pb-20 relative">
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl flex items-center justify-center animate-fadeIn">
          <div className="text-center space-y-12 max-w-sm w-full px-6">
            <div className="relative inline-block">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.92} strokeDashoffset={552.92 - (exportProgress / 100) * 552.92} strokeLinecap="round" className="text-indigo-600 transition-all duration-300 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 tabular-nums leading-none">{exportProgress}<span className="text-lg text-slate-400">%</span></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">{exportQuality}</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Neural Rendering</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">{RENDERING_MESSAGES[renderingMsgIdx]}</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-indigo-600 transition-all duration-300 ease-out" style={{ width: `${exportProgress}%` }} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Target: {exportFormat} Master</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="group w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-[1.5rem] hover:border-indigo-500 hover:shadow-xl transition-all active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Recap Director</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 mt-3">Professional Editor Mode</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
        {!result ? (
          <div className="p-10 md:p-20 space-y-14">
            <div className="flex justify-center">
              <div className="bg-slate-100 p-2 rounded-[2.5rem] flex items-center shadow-inner border border-slate-200 h-20 w-full max-w-md">
                <Tooltip content="Analyze a video directly from its URL.">
                  <button onClick={() => setMode('url')} className={`flex-1 h-full rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'url' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ICONS.Link className="w-4 h-4" /> YouTube Link
                  </button>
                </Tooltip>
                <Tooltip content="Upload your own footage for synthesis.">
                  <button onClick={() => setMode('file')} className={`flex-1 h-full rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'file' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ICONS.Studio className="w-4 h-4" /> Upload File
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2 px-2">
                    {mode === 'url' ? 'Paste Video URL' : 'Select Local Media'}
                  </label>
                  {mode === 'url' ? (
                    <input type="text" placeholder="https://youtube.com/watch?v=..." className={`w-full px-10 py-8 bg-slate-50 border-2 rounded-[2.5rem] focus:outline-none focus:bg-white font-bold text-xl shadow-inner transition-all placeholder:text-slate-300 ${error ? 'border-rose-100' : 'border-slate-100 focus:border-indigo-500'}`} value={url} onChange={(e) => { setUrl(e.target.value); if (error) setError(null); }} />
                  ) : (
                    <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all duration-500 group ${file ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-indigo-200'}`}>
                      <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${file ? 'bg-indigo-600 text-white shadow-xl rotate-6' : 'bg-white text-slate-300 border border-slate-100 group-hover:rotate-6'}`}>
                        <ICONS.Download className="w-8 h-8" />
                      </div>
                      <p className="text-xl font-black text-slate-900 line-clamp-1">{file ? file.name : 'Select Footage'}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Recap Depth</label>
                      <Tooltip content="Controls the level of detail in the synthesized summary.">
                        <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-black text-slate-400 cursor-help">?</div>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Tooltip content="Condensed 1-paragraph brief.">
                        <button onClick={() => setLength('short')} className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${length === 'short' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                          <ICONS.List className="w-5 h-5" /> Short
                        </button>
                      </Tooltip>
                      <Tooltip content="Multi-point analytical breakdown.">
                        <button onClick={() => setLength('detailed')} className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${length === 'detailed' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                          <ICONS.Pencil className="w-5 h-5" /> Detailed
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Output Language</label>
                    <select className="w-full px-8 py-8 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-700" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                      {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-center items-center text-center gap-8">
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-indigo-500 shadow-xl border border-slate-100"><ICONS.Sparkles className="w-10 h-10" /></div>
                <h4 className="font-black text-slate-900 text-lg italic">"Turn context into cinema."</h4>
              </div>
            </div>

            {error && <div className="p-8 bg-rose-50 text-rose-700 rounded-[2.5rem] font-bold border-2 border-rose-100 animate-fadeIn">{error}</div>}

            <button onClick={handleGenerateRecap} disabled={isProcessing} className="w-full py-10 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl hover:bg-slate-900 disabled:opacity-50 transition-all shadow-2xl active:scale-95">
              {isProcessing ? 'Probing Assets...' : 'Generate Production Master'}
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn flex flex-col h-full bg-slate-50/50">
            <div className="bg-slate-900 p-12 md:p-16 text-white border-b border-white/10 flex flex-col md:flex-row gap-12 items-center">
              <div className="relative w-full md:w-72 aspect-video rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-slate-800 flex items-center justify-center">
                {result.thumbnailUrl ? <img src={result.thumbnailUrl} className="w-full h-full object-cover" alt="Source" /> : <ICONS.Studio className="w-10 h-10 text-white/20" />}
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">{result.title}</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">{result.originalTitle || 'Generated Recap'}</p>
              </div>
            </div>

            <div className="p-10 md:p-20 space-y-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-12">
                   <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 md:p-16 shadow-xl space-y-10">
                    <div className="space-y-6">
                      <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-indigo-500">Recap Brief</h4>
                      <p className="text-2xl font-medium text-slate-800 leading-relaxed italic border-l-8 border-indigo-100 pl-8">{result.summary}</p>
                    </div>
                  </div>

                  {/* Watermark Studio Section */}
                  <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 md:p-16 shadow-xl space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-indigo-500">Visual Branding</h4>
                        <p className="text-xs text-slate-400 font-bold">Apply a custom watermark to your production</p>
                      </div>
                      <button 
                        onClick={() => setEnableWatermark(!enableWatermark)}
                        className={`w-14 h-7 rounded-full transition-all relative ${enableWatermark ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${enableWatermark ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>

                    {enableWatermark && (
                      <div className="space-y-8 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Logo Asset</label>
                            <div 
                              onClick={() => watermarkInputRef.current?.click()}
                              className={`h-48 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${watermarkImage ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                              <input 
                                type="file" 
                                ref={watermarkInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleWatermarkUpload} 
                              />
                              {watermarkImage ? (
                                <img src={watermarkImage} alt="Watermark" className="h-24 w-auto object-contain drop-shadow-lg" />
                              ) : (
                                <>
                                  <ICONS.Image className="w-10 h-10 text-slate-200" />
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select PNG/JPG</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Anchor Position</label>
                              <div className="grid grid-cols-3 gap-2">
                                {(['Top Left', 'Top Right', 'Center', 'Bottom Left', 'Bottom Right'] as WatermarkPosition[]).map(pos => (
                                  <button
                                    key={pos}
                                    onClick={() => setWatermarkPosition(pos)}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${watermarkPosition === pos ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                  >
                                    {pos}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opacity</label>
                                <span className="text-[10px] font-black text-indigo-600">{watermarkOpacity}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                value={watermarkOpacity} 
                                onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl sticky top-28 border border-white/5">
                    <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-indigo-400">Export Master</h4>
                    
                    <div className="space-y-8">
                      {/* Quality Selector */}
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest px-1">Master Quality</label>
                        <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                          {(['720p', '1080p'] as ExportQuality[]).map((q) => (
                            <Tooltip key={q} content={q === '1080p' ? 'Full HD production master.' : 'Standard HD preview.'}>
                              <button
                                onClick={() => setExportQuality(q)}
                                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${exportQuality === q ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                              >
                                {q}
                              </button>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Format Selector */}
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest px-1">Output Format</label>
                        <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                          {(['MP4', 'MOV'] as ExportFormat[]).map((f) => (
                            <button
                              key={f}
                              onClick={() => setExportFormat(f)}
                              className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${exportFormat === f ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 space-y-4">
                        <button 
                          onClick={handleProductionExport} 
                          disabled={isExporting} 
                          className="w-full py-7 bg-indigo-500 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest hover:bg-white hover:text-indigo-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isExporting ? (
                            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <ICONS.Sparkles className="w-5 h-5" />
                          )}
                          {isExporting ? 'Neural Rendering...' : 'Render Master Asset'}
                        </button>

                        {exportSuccess && (
                          <button 
                            onClick={handleDownloadMaster} 
                            className="w-full py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl animate-fadeIn flex items-center justify-center gap-3 border border-emerald-400/30"
                          >
                            <ICONS.Download className="w-5 h-5" /> Download {exportFormat} File
                          </button>
                        )}

                        <button onClick={() => setResult(null)} className="w-full py-5 bg-white/5 border border-white/10 text-slate-500 rounded-[2rem] font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-colors">Discard Production</button>
                      </div>

                      {error && (
                        <div className="p-4 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-2xl text-[10px] font-bold leading-relaxed animate-fadeIn">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
