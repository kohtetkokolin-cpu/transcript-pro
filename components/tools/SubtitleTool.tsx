
import React, { useState, useRef, useEffect } from 'react';
import { ICONS, SUPPORTED_LANGUAGES } from '../../constants';
import { TranscriptionSegment } from '../../types';
import { downloadFile, generateSRT, parseSRT } from '../../utils/helpers';
import { translateSegments, transcribeYouTube } from '../../services/geminiService';
import { Tooltip } from '../Tooltip';

type InputMode = 'file' | 'url';

const LOADING_MESSAGES = [
  "Gemini is probing the video stream...",
  "Extracting high-fidelity audio data...",
  "Analyzing speech patterns and rhythm...",
  "Generating time-coded neural nodes...",
  "Applying smart grammar cleaning...",
  "Finalizing production-ready SRT..."
];

const TONE_PROFILES = [
  { id: 'Neutral', label: 'Standard / Neutral' },
  { id: 'MovieRecap', label: 'Movie Recap Style' },
  { id: 'MyanmarDhamma', label: 'Myanmar Dhamma Style' },
  { id: 'Creative', label: 'Creative / Cinematic' }
];

export const SubtitleTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [translatedSegments, setTranslatedSegments] = useState<TranscriptionSegment[]>([]);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [selectedTone, setSelectedTone] = useState('Neutral');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [includeSpeakerLabels, setIncludeSpeakerLabels] = useState(false);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if any speaker data exists in the current segments
  const hasSpeakerData = segments.some(s => s.speaker && s.speaker.trim().length > 0) || 
                         translatedSegments.some(s => s.speaker && s.speaker.trim().length > 0);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSRT(content);
      if (parsed.length === 0) {
        setError("Could not parse valid segments from this file.");
      } else {
        setSegments(parsed);
        setTranslatedSegments([]);
        setGroundingSources([]);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleYoutubeExtract = async () => {
    if (!youtubeUrl.trim()) return;
    setIsProcessing(true);
    setError(null);
    setSegments([]);
    setTranslatedSegments([]);
    setGroundingSources([]);
    
    try {
      const result = await transcribeYouTube(youtubeUrl, { 
        clean: true, 
        includeTimestamps: true 
      });
      
      if (result.segments && result.segments.length > 0) {
        setSegments(result.segments);
        setGroundingSources(result.sources || []);
        setFileName(`YT_${youtubeUrl.split('v=')[1]?.substring(0, 8) || 'Export'}`);
        
        if (autoTranslate) {
          await runTranslation(result.segments);
        }
      } else {
        throw new Error("No speech segments identified in this asset. Ensure it's not a private video.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to extract subtitles. Video might be restricted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runTranslation = async (sourceSegments: TranscriptionSegment[]) => {
    setIsTranslating(true);
    setTranslationProgress(0);
    setError(null);
    try {
      const chunkSize = 12; 
      const chunks = [];
      for (let i = 0; i < sourceSegments.length; i += chunkSize) {
        chunks.push(sourceSegments.slice(i, i + chunkSize));
      }

      const results: TranscriptionSegment[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const translatedChunk = await translateSegments(chunks[i], targetLang, selectedTone);
        results.push(...translatedChunk);
        setTranslationProgress(Math.round(((i + 1) / chunks.length) * 100));
      }
      setTranslatedSegments(results);
    } catch (err: any) {
      setError("Translation failed: " + err.message);
    } finally {
      setIsTranslating(false);
      setTranslationProgress(0);
    }
  };

  const handleTranslateClick = () => {
    if (segments.length === 0) return;
    runTranslation(segments);
  };

  const handleDownload = () => {
    const dataToExport = translatedSegments.length > 0 ? translatedSegments : segments;
    if (dataToExport.length === 0) return;
    
    const srt = generateSRT(dataToExport, includeSpeakerLabels);
    const suffix = translatedSegments.length > 0 ? `_${targetLang}` : '_Neural';
    const name = fileName ? fileName.split('.')[0] : 'subtitles';
    downloadFile(srt, `${name}${suffix}.srt`, 'text/plain');
  };

  return (
    <div className="animate-slideUp max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all shadow-sm active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Subtitle Studio</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-3">Neural Localization Lab</p>
          </div>
        </div>

        {segments.length > 0 && (
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm items-center gap-2">
                <Tooltip content="Adjust metadata and formatting for export.">
                  <button 
                    onClick={() => setShowExportSettings(!showExportSettings)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showExportSettings ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <ICONS.List className="w-4 h-4" />
                    Export Options
                  </button>
                </Tooltip>
                
                <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

                <div className="flex flex-col px-3 border-r border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Locale</span>
                  <select 
                    className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none focus:text-indigo-600 transition-colors"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    disabled={isTranslating}
                  >
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col px-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tone Profile</span>
                  <select 
                    className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none focus:text-indigo-600 transition-colors"
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    disabled={isTranslating}
                  >
                    {TONE_PROFILES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>

                <Tooltip content="Translate all active segments to the target locale.">
                  <button 
                    onClick={handleTranslateClick}
                    disabled={isTranslating}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTranslating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        {translationProgress}%
                      </>
                    ) : 'Localize'}
                  </button>
                </Tooltip>
             </div>
          </div>
        )}
      </div>

      {segments.length > 0 && showExportSettings && (
        <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white animate-slideUp shadow-2xl space-y-8 relative overflow-hidden border border-indigo-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-md">
              <h3 className="text-xl font-black uppercase tracking-widest">Master Production Settings</h3>
              <p className="text-sm font-medium text-indigo-200 leading-relaxed">
                Configure formatting and metadata for your subtitle export.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-8 items-center bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
              {hasSpeakerData ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Speaker Labels</span>
                    <p className="text-[9px] text-white/40 font-bold">Prefix segments with [Name]</p>
                  </div>
                  <Tooltip content="Includes speaker names in the final SRT file.">
                    <button 
                      onClick={() => setIncludeSpeakerLabels(!includeSpeakerLabels)}
                      className={`w-12 h-6 rounded-full transition-all relative ${includeSpeakerLabels ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${includeSpeakerLabels ? 'right-1' : 'left-1'}`} />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">No Speaker Data Detected</div>
              )}
              
              <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Export Asset</span>
                  <p className="text-[9px] text-white/40 font-bold">{translatedSegments.length > 0 ? `${targetLang} (Translated)` : 'Source (Original)'}</p>
                </div>
                <button 
                  onClick={handleDownload}
                  className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Download .SRT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {segments.length === 0 ? (
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-8 md:p-12 border-b border-slate-100 flex justify-center bg-slate-50/50">
             <div className="bg-slate-200 p-1.5 rounded-2xl flex items-center shadow-inner">
                <button 
                  onClick={() => setInputMode('file')}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'file' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Import .SRT
                </button>
                <button 
                  onClick={() => setInputMode('url')}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'url' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  YouTube Extraction
                </button>
             </div>
          </div>

          <div className="p-12 md:p-20 text-center space-y-12">
            {inputMode === 'file' ? (
              <div className="space-y-10">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto cursor-pointer hover:scale-110 transition-transform shadow-inner group"
                >
                  <ICONS.Studio className="w-16 h-16 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900">Upload Subtitle Master</h3>
                  <p className="text-slate-500 max-w-md mx-auto font-medium">Import your existing <strong>.SRT</strong> files to begin high-fidelity translation or timing refinement.</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".srt" onChange={handleFileUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-12 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
                >
                  Import Asset
                </button>
              </div>
            ) : (
              <div className="space-y-10 max-w-3xl mx-auto">
                <div className="w-32 h-32 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                  <ICONS.Link className="w-16 h-16" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900">Combined Extraction & Localization</h3>
                  <p className="text-slate-500 max-w-md mx-auto font-medium">Extract neural subtitles from YouTube and optionally localize them in one continuous workflow.</p>
                </div>
                
                <div className="space-y-6 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="https://youtube.com/watch?v=..." 
                      className="w-full px-10 py-8 bg-white border-2 border-slate-100 rounded-[2rem] focus:outline-none focus:border-red-500 font-bold text-xl transition-all shadow-inner"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="autoTranslate" 
                        className="w-5 h-5 accent-indigo-600"
                        checked={autoTranslate}
                        onChange={(e) => setAutoTranslate(e.target.checked)}
                      />
                      <label htmlFor="autoTranslate" className="text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer">Auto-localize to:</label>
                    </div>
                    <select 
                      className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 shadow-sm disabled:opacity-50"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      disabled={!autoTranslate || isProcessing}
                    >
                      {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.name}</option>)}
                    </select>

                    <select 
                      className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 shadow-sm disabled:opacity-50"
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      disabled={!autoTranslate || isProcessing}
                    >
                      {TONE_PROFILES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={handleYoutubeExtract}
                    disabled={!youtubeUrl.trim() || isProcessing}
                    className="w-full py-8 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest hover:bg-slate-900 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? 'Probing Assets...' : 'Generate Grounded Subtitles'}
                  </button>
                </div>

                {isProcessing && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">
                      {isTranslating ? `Localizing into ${targetLang} (${translationProgress}%)...` : LOADING_MESSAGES[loadingMsgIndex]}
                    </p>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: isTranslating ? `${translationProgress}%` : '50%' }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold animate-fadeIn">
                     {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-[3rem] shadow-xl overflow-hidden">
            <div className="p-8 md:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${inputMode === 'url' ? 'bg-red-600' : 'bg-indigo-600'}`}>
                    {inputMode === 'url' ? <ICONS.Link className="w-6 h-6" /> : <ICONS.Studio className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Production Preview</h4>
                    <p className="text-lg font-black text-slate-900 mt-1">{fileName || 'Active Session'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setSegments([]); setTranslatedSegments([]); setFileName(null); setYoutubeUrl(''); setGroundingSources([]); setError(null); }}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Discard Asset
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    <ICONS.Download className="w-4 h-4" />
                    Download {translatedSegments.length > 0 ? targetLang : '.SRT'}
                  </button>
               </div>
            </div>

            {isTranslating && (
              <div className="bg-indigo-600 px-8 py-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white animate-pulse">Neural Localization in Progress...</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{translationProgress}% Complete</span>
              </div>
            )}

            {groundingSources.length > 0 && (
              <div className="px-8 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-4 overflow-x-auto whitespace-nowrap custom-scrollbar">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 shrink-0">Grounded via:</span>
                {groundingSources.map((chunk, idx) => (
                   chunk.web && (
                     <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1.5">
                       <ICONS.Link className="w-3 h-3" /> {chunk.web.title || 'Search Citation'}
                     </a>
                   )
                ))}
              </div>
            )}

            <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-slate-100">
                {segments.map((seg, i) => (
                  <div key={i} className="flex flex-col lg:flex-row hover:bg-slate-50 transition-colors group">
                    <div className="lg:w-1/2 p-8 lg:border-r border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-indigo-600 tabular-nums shadow-sm">
                            {seg.startTime} → {seg.endTime}
                         </span>
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Neural Source</span>
                      </div>
                      <div className="space-y-2">
                        {seg.speaker && <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md">{seg.speaker}</span>}
                        <p className="text-base font-medium text-slate-600 leading-relaxed">{seg.text}</p>
                      </div>
                    </div>
                    <div className="lg:w-1/2 p-8 bg-indigo-50/20 group-hover:bg-indigo-50/40 transition-colors space-y-4">
                      <div className="flex items-center justify-end">
                         <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{translatedSegments.length > 0 ? `${targetLang} Master` : 'Localization Pending'}</span>
                      </div>
                      {isTranslating && !translatedSegments[i] ? (
                        <div className="space-y-3">
                          <div className="h-3 w-full bg-indigo-100 rounded-full animate-pulse"></div>
                          <div className="h-3 w-2/3 bg-indigo-100 rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {translatedSegments[i]?.speaker && <span className="text-[9px] font-black uppercase text-indigo-100 px-2 py-0.5 rounded-md">{translatedSegments[i].speaker}</span>}
                          <p className="text-base font-black text-indigo-900 leading-relaxed">
                            {translatedSegments[i]?.text || <span className="text-indigo-300 italic opacity-50 text-sm">Select language & click 'Localize' to translate...</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-8 bg-rose-50 border border-rose-100 text-rose-600 rounded-[2.5rem] font-bold animate-fadeIn">
               {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
