
import React, { useState, useEffect, useRef } from 'react';
import { ICONS, AI_VOICES } from '../../constants';
import { pcmToWav, downloadFile, fileToBase64 } from '../../utils/helpers';
import { generateVoiceover, refineVoiceoverScript, analyzeVoiceSample } from '../../services/geminiService';
import { ArchiveService } from '../../services/ArchiveService';
import { ArchiveEntry } from '../../types';
import { Tooltip } from '../Tooltip';

export const VoiceTool: React.FC<{ 
  onBack: () => void;
  initialAsset?: ArchiveEntry | null;
}> = ({ onBack, initialAsset }) => {
  const [text, setText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementStyle, setRefinementStyle] = useState<'Standard' | 'Cinematic'>('Standard');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ArchiveEntry[]>([]);

  // Cloning States
  const [cloningMode, setCloningMode] = useState(false);
  const [cloningFile, setCloningFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  const selectedVoice = cloningMode && analysisResult 
    ? { 
        id: analysisResult.bestMatchPresetId, 
        name: `Cloned (${analysisResult.bestMatchPresetId})`, 
        style: 'Custom Clone',
        description: analysisResult.analysisSummary || 'Custom cloned profile via neural extraction.'
      }
    : AI_VOICES[selectedIndex];

  useEffect(() => {
    if (initialAsset) {
      setText(initialAsset.content);
      const voiceId = initialAsset.metadata?.voiceId;
      if (voiceId) {
        const idx = AI_VOICES.findIndex(v => v.id === voiceId);
        if (idx !== -1) setSelectedIndex(idx);
      }
    }
    refreshHistory();
  }, [initialAsset]);

  const refreshHistory = () => {
    setHistory(ArchiveService.listAll().filter(a => a.type === 'Voice').slice(0, 20));
  };

  const handleRefineScript = async (mode: 'Standard' | 'Cinematic') => {
    if (!text.trim()) return;
    setIsRefining(true);
    setRefinementStyle(mode);
    setError(null);
    try {
      let style: 'Recap' | 'Audiobook' | 'Myanmar' | 'MyanmarDhamma' | 'Cinematic' = mode === 'Cinematic' ? 'Cinematic' : 'Recap';
      
      if (mode === 'Standard') {
        if (selectedVoice.name.toLowerCase().includes('audiobook')) style = 'Audiobook';
        if (selectedVoice.name.toLowerCase().includes('myanmar')) style = 'Myanmar';
        if (selectedVoice.name.toLowerCase().includes('dhamma')) style = 'MyanmarDhamma';
      }
      
      const refined = await refineVoiceoverScript(text, style);
      setText(refined);
    } catch (err: any) {
      setError("Script refinement fault: " + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAnalyzeSample = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCloningFile(file);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeVoiceSample(base64, file.type);
      
      if (!result || !result.bestMatchPresetId) {
        throw new Error("Cloning engine could not identify a clear voice profile. Ensure the clip has clear speech.");
      }

      setAnalysisResult(result);
      
      const matchedIdx = AI_VOICES.findIndex(v => v.id === result.bestMatchPresetId);
      if (matchedIdx !== -1) setSelectedIndex(matchedIdx);
      
    } catch (err: any) {
      setError("Cloning Analysis Failed: " + (err.message || "Could not process audio sample."));
      setCloningFile(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearCloning = () => {
    setCloningFile(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleGenerateVoice = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    
    try {
      const base64Audio = await generateVoiceover(text, selectedVoice.id);
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const wavBlob = pcmToWav(byteArray, 24000);
      
      setAudioBlob(wavBlob);
      setAudioUrl(URL.createObjectURL(wavBlob));

      ArchiveService.saveAsset({
        type: 'Voice',
        title: text.substring(0, 30) + '...',
        content: text,
        language: 'English',
        toolId: 'voice',
        metadata: { voiceId: selectedVoice.id, voiceName: selectedVoice.name }
      });
      refreshHistory();
    } catch (err: any) {
      setError(err.message || "Neural synthesis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    const fileName = `Master-${selectedVoice.name.replace(/\s+/g, '-')}-${Date.now()}.wav`;
    downloadFile(audioBlob, fileName, 'audio/wav');
  };

  const loadFromHistory = (item: ArchiveEntry) => {
    setText(item.content);
    const voiceId = item.metadata?.voiceId;
    if (voiceId) {
      const idx = AI_VOICES.findIndex(v => v.id === voiceId);
      if (idx !== -1) setSelectedIndex(idx);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 transition-all shadow-sm active:scale-95">
            <ICONS.Link className="w-6 h-6 rotate-180 text-slate-400" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Voiceover Studio</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500 mt-3">Neural Synthesis Lab</p>
          </div>
        </div>
        
        {audioUrl && (
          <button onClick={handleDownload} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center gap-3 animate-fadeIn">
            <ICONS.Download className="w-4 h-4" /> Download .WAV Master
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-8">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
                <button onClick={() => setCloningMode(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!cloningMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Presets</button>
                <button onClick={() => setCloningMode(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cloningMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Voice Clone</button>
            </div>

            {!cloningMode ? (
              <div className="space-y-4 animate-fadeIn">
                 <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2">Voice Persona</label>
                 <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={selectedIndex} onChange={(e) => setSelectedIndex(parseInt(e.target.value))}>
                   {AI_VOICES.map((v, i) => <option key={i} value={i}>{v.name} ({v.style})</option>)}
                 </select>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {!cloningFile ? (
                   <div onClick={() => !isAnalyzing && cloneInputRef.current?.click()} className={`border-4 border-dashed rounded-[2.5rem] p-10 text-center cursor-pointer transition-all border-slate-100 bg-slate-50 hover:border-indigo-200 group`}>
                      <input type="file" ref={cloneInputRef} className="hidden" accept="audio/*" onChange={handleAnalyzeSample} />
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <ICONS.Studio className="w-8 h-8 text-indigo-600" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">Upload 15s Sample</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-2">MP3, WAV, or M4A supported</p>
                   </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl space-y-6">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Neural DNA Extraction</span>
                         <button onClick={clearCloning} className="text-[9px] font-black uppercase text-rose-500 hover:underline">Discard Sample</button>
                       </div>
                       
                       {isAnalyzing ? (
                         <div className="space-y-4 pt-2">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase text-indigo-400">
                             <span>Analyzing Vocal Nodes...</span>
                             <span className="animate-pulse">Active</span>
                           </div>
                           <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 animate-[shimmer_2s_infinite]" style={{ width: '70%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                           </div>
                         </div>
                       ) : analysisResult && (
                         <div className="space-y-6 animate-fadeIn">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded-xl border border-indigo-50">
                                 <p className="text-[8px] font-black text-indigo-300 uppercase">Age / Gender</p>
                                 <p className="text-[10px] font-bold text-slate-700">{analysisResult.age} / {analysisResult.gender}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-indigo-50">
                                 <p className="text-[8px] font-black text-indigo-300 uppercase">Pacing</p>
                                 <p className="text-[10px] font-bold text-slate-700">{analysisResult.pacing}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-indigo-50 col-span-2">
                                 <p className="text-[8px] font-black text-indigo-300 uppercase">Tone Profile</p>
                                 <p className="text-[10px] font-bold text-slate-700">{analysisResult.tone}</p>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black uppercase text-indigo-400">
                                 <span>Cloning Confidence</span>
                                 <span>{Math.round(analysisResult.cloningSuccessConfidence * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${analysisResult.cloningSuccessConfidence * 100}%` }}></div>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Vocal Textures</span>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.uniqueCharacteristics?.map((trait: string) => (
                                  <span key={trait} className="px-2 py-1 bg-white border border-indigo-100 rounded-lg text-[8px] font-black uppercase text-indigo-600">{trait}</span>
                                ))}
                              </div>
                           </div>

                           <div className="p-4 bg-white/50 rounded-2xl border border-indigo-50">
                              <p className="text-[9px] font-black text-indigo-600 uppercase">Preset Mapping</p>
                              <p className="text-[11px] font-bold text-slate-600 mt-1">Locked to: <span className="text-slate-900">{analysisResult.bestMatchPresetId}</span></p>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button onClick={handleGenerateVoice} disabled={!text.trim() || isGenerating || isRefining || (cloningMode && !analysisResult)} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-4 active:scale-95 group">
                {isGenerating ? 'Synthesizing...' : 'Begin Synthesis'}
                {!isGenerating && <ICONS.Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRefineScript('Standard')} 
                  disabled={!text.trim() || isGenerating || isRefining} 
                  className="flex-1 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isRefining && refinementStyle === 'Standard' ? 'Refining...' : 'Refine'}
                </button>
                <button 
                  onClick={() => handleRefineScript('Cinematic')} 
                  disabled={!text.trim() || isGenerating || isRefining} 
                  className="flex-1 py-4 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95 group/cine"
                >
                  {isRefining && refinementStyle === 'Cinematic' ? 'Directing...' : (
                    <>
                      <ICONS.Sparkles className="w-3 h-3 group-hover/cine:rotate-12 transition-transform" />
                      Cinematic
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-[2rem] text-xs font-bold animate-fadeIn">
                {error}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col min-h-[400px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 px-2">Voice History</h3>
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {history.map(item => (
                <div key={item.id} onClick={() => loadFromHistory(item)} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-200 cursor-pointer group transition-all">
                  <p className="text-[11px] font-black text-slate-700 line-clamp-2">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
           <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden p-10 md:p-14 space-y-10">
              <div className="relative">
                <textarea 
                  className={`w-full h-80 border-2 rounded-[3rem] p-10 focus:outline-none focus:bg-white transition-all font-medium text-xl leading-relaxed text-slate-700 resize-none custom-scrollbar shadow-inner ${isRefining && refinementStyle === 'Cinematic' ? 'bg-indigo-50/30 border-indigo-200 animate-pulse' : 'bg-slate-50 border-slate-50 focus:border-indigo-100'}`} 
                  placeholder="Enter narration script to synthesize..." 
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  disabled={isRefining} 
                />
                {isRefining && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-[3rem]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        {refinementStyle === 'Cinematic' ? 'Injecting Emotional Cues...' : 'Refining Script Logic...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {audioUrl && (
                <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-8 animate-slideUp shadow-2xl border border-white/5">
                   <div className="flex items-center justify-between">
                     <h4 className="text-3xl font-black">{selectedVoice.name}</h4>
                     <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedVoice.style}</span>
                   </div>
                   <audio controls src={audioUrl} className="w-full brightness-0 invert opacity-80" />
                   <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                      <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                        {selectedVoice.description}
                      </p>
                   </div>
                </div>
              )}

              {!audioUrl && !isGenerating && (
                 <div className="p-20 text-center opacity-10 flex flex-col items-center gap-6">
                    <ICONS.Studio className="w-32 h-32" />
                    <p className="text-2xl font-black uppercase tracking-widest">Master Studio Idle</p>
                 </div>
              )}
              
              {isGenerating && (
                <div className="p-20 flex flex-col items-center gap-8 animate-pulse">
                   <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Synthesizing Neural Stream...</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
