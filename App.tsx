import React, { useState, useEffect } from 'react';
import { TranscriptionResult, ArchiveEntry } from './types';
import { ICONS } from './constants';
import { Dashboard } from './components/Dashboard';
import { FileTranscribeTool } from './components/tools/FileTranscribeTool';
import { YoutubeTranscribeTool } from './components/tools/YoutubeTranscribeTool';
import { TranslateTool } from './components/tools/TranslateTool';
import { SubtitleTool } from './components/tools/SubtitleTool';
import { VoiceTool } from './components/tools/VoiceTool';
import { RecapTool } from './components/tools/RecapTool';
import { ProfessionalRecapTool } from './components/tools/ProfessionalRecapTool';
import { ContentCreatorTool } from './components/tools/ContentCreatorTool';
import { StoryCreatorTool } from './components/tools/StoryCreatorTool';
import { ThumbnailTool } from './components/tools/ThumbnailTool';
import { DownloaderTool } from './components/tools/DownloaderTool';
import { ArchiveTool } from './components/tools/ArchiveTool';
import { VideoGenTool } from './components/tools/VideoGenTool';

const isProd = import.meta.env.MODE === "production";

export type AppView =
  | 'dashboard'
  | 'transcribe_file'
  | 'transcribe_youtube'
  | 'translate'
  | 'subtitles'
  | 'voice'
  | 'recap'
  | 'professional_recap'
  | 'content'
  | 'story'
  | 'thumbnail'
  | 'downloader'
  | 'archive'
  | 'video_gen';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeAsset, setActiveAsset] = useState<ArchiveEntry | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
    window.addEventListener('focus', checkKey);
    return () => window.removeEventListener('focus', checkKey);
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleResume = (tool: AppView, entry: ArchiveEntry) => {
    setActiveAsset(entry);
    setCurrentView(tool);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onSelectTool={setCurrentView} />;
      case 'archive': return <ArchiveTool onBack={() => setCurrentView('dashboard')} onResume={handleResume} />;
      case 'transcribe_file': return <FileTranscribeTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      case 'transcribe_youtube': return <YoutubeTranscribeTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      case 'translate': return <TranslateTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      case 'subtitles': return <SubtitleTool onBack={() => setCurrentView('dashboard')} />;
      case 'voice': return <VoiceTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      case 'recap': return <RecapTool onBack={() => setCurrentView('dashboard')} />;
      case 'professional_recap': return <ProfessionalRecapTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      case 'content': return <ContentCreatorTool onBack={() => setCurrentView('dashboard')} />;
      case 'story': return <StoryCreatorTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      case 'thumbnail': return <ThumbnailTool onBack={() => setCurrentView('dashboard')} />;
      case 'downloader': return <DownloaderTool onBack={() => setCurrentView('dashboard')} />;
      case 'video_gen': return <VideoGenTool onBack={() => { setCurrentView('dashboard'); setActiveAsset(null); }} initialAsset={activeAsset} />;
      default: return <Dashboard onSelectTool={setCurrentView} />;
    }
  };

  return (
    <>
      {/* 🔒 Production demo banner */}
      {isProd && (
        <div
          style={{
            padding: "10px",
            background: "#fff3cd",
            color: "#856404",
            borderRadius: "8px",
            margin: "12px"
          }}
        >
          🔒 Demo mode only. Full features coming soon.
        </div>
      )}

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 transition-transform group-hover:scale-110">
                <ICONS.Studio className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Transcript Pro</h1>
                <p className="text-3xl font-black uppercase tracking-[0.6em] text-indigo-600 mt-2">PRODUCER</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500">
              <button onClick={() => setCurrentView('dashboard')} className="hover:text-indigo-600">Tools</button>
              <button onClick={() => setCurrentView('archive')} className="hover:text-indigo-600">Archive</button>

              <div className="flex items-center gap-3">
                {hasApiKey && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    Key Active
                  </div>
                )}
                <button
                  onClick={handleOpenKey}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    hasApiKey
                      ? 'bg-white border text-slate-600'
                      : 'bg-amber-500 text-white animate-pulse'
                  }`}
                >
                  <ICONS.Sparkles className="w-4 h-4" />
                  {hasApiKey ? 'Switch Project Key' : 'Connect Project Key'}
                </button>
              </div>

              <button className="px-6 py-3 bg-slate-900 text-white rounded-xl">Get Pro</button>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          {renderView()}
        </main>

        <footer className="max-w-7xl mx-auto px-6 py-12 border-t text-center text-sm text-slate-400">
          © 2024 Transcript Pro. Powered by Gemini.
        </footer>
      </div>
    </>
  );
};

export default App;
