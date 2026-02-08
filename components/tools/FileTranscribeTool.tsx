
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../constants';
import { TranscriptionResult, ArchiveEntry } from '../../types';
import { downloadFile, generateSRT, fileToBase64 } from '../../utils/helpers';
import { transcribeMedia, transcribeYouTube } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';
import { Tooltip } from '../Tooltip';

interface FileTranscribeToolProps {
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}

type OutputFormat = 'text' | 'srt' | 'json';
type InputMode = 'local' | 'youtube';

const STATUS_MESSAGES = [
  "Writer initializing: Observing visual timeline...",
  "Analyzing character actions and pacing...",
  "Extracting narrative beats from multimodal streams...",
  "Drafting engaging, story-faithful narration...",
  "Applying human-rhythm storytelling filters...",
  "Finalizing master script manuscript...",
  "Ensuring 100% story accuracy..."
];

const EXPORT_PHASES = [
  "Compiling manuscript nodes...",
  "Synchronizing temporal flow...",
  "Validating narrative integrity...",
  "Injecting production metadata...",
  "Finalizing Master Script...",
  "Asset Dispatched."
];

export const FileTranscribeTool: React.FC<FileTranscribeToolProps> = ({ onBack, initialAsset }) => {
  const [inputMode, setInputMode] = useState<InputMode>('youtube');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusIdx, setExportStatusIdx] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<ArchiveEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [isSmartClean, setIsSmartClean] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('srt');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAsset) {
      setResult(initialAsset.content);
      setCurrentFileName(initialAsset.title);
      if (initialAsset.metadata?.sourceUrl) {
        setYoutubeUrl(initialAsset.metadata.sourceUrl);
        setInputMode('youtube');
      }
    }
    refreshHistory();
  }, [initialAsset]);

  const refreshHistory = () => {
    setHistory(ArchiveService.listAll().filter(a => a.type === 'Transcript').slice(0, 20));
  };

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const loadFromHistory = (item: ArchiveEntry) => {
    setResult(item.content);
    setCurrentFileName(item.title);
    setFile(null);
    setYoutubeUrl(item.metadata?.sourceUrl || '');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (inputMode === 'youtube' && !youtubeUrl.trim()) {
      setError("Please enter a valid YouTube URL.");
      return;
    }
    if (inputMode === 'local' && !file) {
      setError("Please select a media file to begin.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setResult(null);
    setExportSuccess(false);
    
    try {
      let data: TranscriptionResult;
      let identifier: string;

      if (inputMode === 'youtube') {
        data = await transcribeYouTube(youtubeUrl, { clean: isSmartClean, includeTimestamps });
        identifier = `SCR_YT_${youtubeUrl.split('v=')[1]?.substring(0, 8) || Date.now().toString().slice(-4)}`;
      } else {
        const base64 = await fileToBase64(file!);
        data = await transcribeMedia(base64, file!.type, { clean: isSmartClean, includeTimestamps });
        identifier = file!.name;
      }

      setResult(data);
      setCurrentFileName(identifier);
      
      ArchiveService.saveAsset({
        type: 'Transcript',
        title: identifier,
        content: data,
        language: data.language || 'English',
        toolId: 'transcribe_file',
        metadata: { sourceUrl: inputMode === 'youtube' ? youtubeUrl : undefined }
      });
      refreshHistory();
    } catch (err: any) {
      setError("Transcription Fault: " + (err.message || "Unknown error."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result || !result.segments) return;
    setIsExporting(true);
    setExportSuccess(false);
    setExportProgress(0);

    const stepDelay = Math.min(60, (result.segments.length || 0) / 2) + 10;
    for (let i = 0; i <= 100; i++) {
        await new Promise(r => setTimeout(r, stepDelay));
        setExportProgress(i);
        if (i % 20 === 0) setExportStatusIdx(Math.min(5, i / 20));
    }

    try {
      let content = '';
      let mimeType = 'text/plain';
      let extension = 'txt';
      switch(outputFormat) {
        case 'text': content = result.fullText || ''; break;
        case 'json': content = JSON.stringify(result, null, 2); mimeType = 'application/json'; extension = 'json'; break;
        case 'srt': default: content = generateSRT(result.segments || []); extension = 'srt'; break;
      }
      downloadFile(content, `${currentFileName?.split('.')[0] || 'script'}.${extension}`, mimeType);
      setExportSuccess(true);
    } catch (err) {
      setError("Export system fault.");
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20 relative">
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center animate-fadeIn">
          <div className="text-center space-y-12 max-w-md w-full px-8">
            <div className="relative inline-block">
              <svg className="w-64 h-64 transform -rotate-90">
                <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={691.15} strokeDashoffset={691.15 - (exportProgress / 100) * 691.15} strokeLinecap="round" className="text-indigo-500 transition-all duration-300" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-6xl font-black">{exportProgress}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest mt-4">Compiling Master</span>
              </div>
            </div>
            <p className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-500/5 py-2 px-4 rounded-lg border border-indigo-500/10 inline-block animate-pulse">
              {EXPORT_PHASES[exportStatusIdx]}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all shadow-sm active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Script Writer Studio</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 mt-3">High-Engagement Narrator Mode</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-8">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
              <button 
                onClick={() => setInputMode('youtube')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'youtube' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                YouTube URL
              </button>
              <button 
                onClick={() => setInputMode('local')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'local' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Local File
              </button>
            </div>

            <div className="space-y-6">
              {inputMode === 'youtube' ? (
                <div className="space-y-4 animate-fadeIn">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Production Asset URL</label>
                  <input 
                    type="text" 
                    placeholder="Paste link..." 
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:outline-none focus:border-indigo-500 font-bold transition-all shadow-inner"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Footage Asset</label>
                  <div 
                    onClick={() => !isProcessing && fileInputRef.current?.click()} 
                    className={`border-4 border-dashed rounded-[2.5rem] p-8 text-center cursor-pointer transition-all ${file ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <p className="font-black truncate text-slate-700">{file ? file.name : 'Drop Asset Here'}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={handleGenerate} 
                disabled={isProcessing} 
                className="w-full py-7 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-slate-900 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Thinking...' : 'Synthesize Script'}
              </button>
              
              {isProcessing && (
                <p className="text-center text-[9px] font-black uppercase text-indigo-500 animate-pulse tracking-widest leading-relaxed px-4">
                  {STATUS_MESSAGES[loadingMsgIndex]}
                </p>
              )}

              {error && (
                <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl text-xs font-bold animate-fadeIn">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[300px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Local Library</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => loadFromHistory(item)} 
                  className={`p-5 bg-slate-50/50 border rounded-2xl cursor-pointer transition-all group relative ${currentFileName === item.title ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-300'}`}
                >
                  <p className="text-[11px] font-black text-slate-700 truncate">{item.title || 'Untitled'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
              {history.length === 0 && (
                <div className="py-20 text-center opacity-20 grayscale flex flex-col items-center">
                  <ICONS.Studio className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Library Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          {result ? (
            <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[800px] animate-fadeIn">
              <div className="bg-slate-900 p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Master Manuscript</span>
                  <h3 className="text-3xl font-black truncate max-w-xl">{currentFileName}</h3>
                </div>
                <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                   <button onClick={handleDownload} className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all shadow-lg active:scale-95 flex items-center gap-3">
                      <ICONS.Download className="w-4 h-4" /> Export Master
                   </button>
                </div>
              </div>
              
              <div className="p-12 md:p-16 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
                <div className="space-y-8">
                  {result.segments.map((seg, i) => (
                    <div key={i} className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] hover:bg-white hover:border-indigo-100 transition-all shadow-sm group">
                       <div className="flex justify-between items-center mb-6">
                          <span className="px-5 py-2 bg-white rounded-2xl text-[10px] font-black text-indigo-600 tabular-nums shadow-sm">
                            {seg.startTime} → {seg.endTime}
                          </span>
                          {seg.speaker && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-3 py-1 rounded-lg">
                              {seg.speaker}
                            </span>
                          )}
                       </div>
                       <p className="text-xl font-medium text-slate-800 leading-relaxed italic border-l-4 border-indigo-100 pl-8 group-hover:border-indigo-500 transition-colors">
                         {seg.text}
                       </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[800px] border-4 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-200 gap-8 animate-fadeIn">
               <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-50"><ICONS.Studio className="w-12 h-12" /></div>
               <div className="text-center space-y-4 px-10">
                  <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Awaiting Assets</p>
                  <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Provide a YouTube link or local footage to synthesize a professional transcription manuscript.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
