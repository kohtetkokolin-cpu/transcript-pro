import React, { useState, useEffect } from 'react';
import { ArchiveEntry } from './types';
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

const isProd = import.meta.env.MODE === 'production';

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
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (
          typeof window !== 'undefined' &&
          window.aistudio &&
          typeof window.aistudio.hasSelectedApiKey === 'function'
        ) {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        }
      } catch {
        setHasApiKey(false);
      }
    };

    checkKey();
    window.addEventListener('focus', checkKey);
    return () => window.removeEventListener('focus', checkKey);
  }, []);

  const handleOpenKey = async () => {
    if (
      window.aistudio &&
      typeof window.aistudio.openSelectKey === 'function'
    ) {
      await window.aistudio.openSelectKey();
      const selected = await window.aistudio.hasSelectedApiKey?.();
      setHasApiKey(!!selected);
    }
  };

  const handleResume = (tool: AppView, entry: ArchiveEntry) => {
    setActiveAsset(entry);
    setCurrentView(tool);
  };

  const goDashboard = () => {
    setCurrentView('dashboard');
    setActiveAsset(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectTool={setCurrentView} />;

      case 'archive':
        return (
          <ArchiveTool
            onBack={goDashboard}
            onResume={handleResume}
          />
        );

      case 'transcribe_file':
        return (
          <FileTranscribeTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      case 'transcribe_youtube':
        return (
          <YoutubeTranscribeTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      case 'translate':
        return (
          <TranslateTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      case 'subtitles':
        return <SubtitleTool onBack={goDashboard} />;

      case 'voice':
        return (
          <VoiceTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      case 'recap':
        return <RecapTool onBack={goDashboard} />;

      case 'professional_recap':
        return (
          <ProfessionalRecapTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      case 'content':
        return <ContentCreatorTool onBack={goDashboard} />;

      case 'story':
        return (
          <StoryCreatorTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      case 'thumbnail':
        return <ThumbnailTool onBack={goDashboard} />;

      case 'downloader':
        return <DownloaderTool onBack={goDashboard} />;

      case 'video_gen':
        return (
          <VideoGenTool
            onBack={goDashboard}
            initialAsset={activeAsset}
          />
        );

      default:
        return <Dashboard onSelectTool={setCurrentView} />;
    }
  };

  return (
    <>
      {isProd && (
        <div
          style={{
            padding: '10px',
            background: '#fff3cd',
            color: '#856404',
            borderRadius: '8px',
            margin: '12px',
          }}
        >
          🔒 Demo mode only. Full features coming soon.
        </div>
      )}

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={goDashboard}
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                <ICONS.Studio className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black">Transcript Pro</h1>
                <p className="text-xs font-black tracking-widest text-indigo-600">
                  PRODUCER
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {hasApiKey && (
                <span className="text-emerald-600 text-xs font-bold">
                  ● Key Active
                </span>
              )}

              <button
                onClick={handleOpenKey}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${
                  hasApiKey
                    ? 'border'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}
              >
                {hasApiKey ? 'Switch Key' : 'Connect Key'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          {renderView()}
        </main>

        <footer className="text-center text-sm text-slate-400 py-10 border-t">
          © 2024 Transcript Pro. Powered by Gemini.
        </footer>
      </div>
    </>
  );
};

export default App;
