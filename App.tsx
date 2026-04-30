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

// ── API Key Management ────────────────────────────────────────────────────
const API_KEY_STORAGE = 'transcript_pro_api_key';

const getStoredApiKey = (): string => {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
};

// Inject the API key into import.meta.env at runtime for geminiService
const injectApiKey = (key: string) => {
  try {
    if (key) {
      (import.meta as any).env = (import.meta as any).env || {};
      (import.meta as any).env.VITE_GEMINI_API_KEY = key;
    }
  } catch (e) {
    console.warn('Could not inject API key:', e);
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeAsset, setActiveAsset] = useState<ArchiveEntry | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    // Load key from localStorage or from build-time env
    const stored = getStoredApiKey();
    const buildKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const activeKey = stored || buildKey;
    if (activeKey) {
      setApiKey(activeKey);
      injectApiKey(activeKey);
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed.startsWith('AIza') || trimmed.length < 30) {
      setKeyError('Invalid API key format. Gemini keys start with "AIza".');
      return;
    }
    localStorage.setItem(API_KEY_STORAGE, trimmed);
    setApiKey(trimmed);
    injectApiKey(trimmed);
    setShowKeyModal(false);
    setKeyInput('');
    setKeyError('');
  };

  const handleRemoveKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setShowKeyModal(false);
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
        return <ArchiveTool onBack={goDashboard} onResume={handleResume} />;
      case 'transcribe_file':
        return <FileTranscribeTool onBack={goDashboard} initialAsset={activeAsset} />;
      case 'transcribe_youtube':
        return <YoutubeTranscribeTool onBack={goDashboard} initialAsset={activeAsset} />;
      case 'translate':
        return <TranslateTool onBack={goDashboard} initialAsset={activeAsset} />;
      case 'subtitles':
        return <SubtitleTool onBack={goDashboard} />;
      case 'voice':
        return <VoiceTool onBack={goDashboard} initialAsset={activeAsset} />;
      case 'recap':
        return <RecapTool onBack={goDashboard} />;
      case 'professional_recap':
        return <ProfessionalRecapTool onBack={goDashboard} initialAsset={activeAsset} />;
      case 'content':
        return <ContentCreatorTool onBack={goDashboard} />;
      case 'story':
        return <StoryCreatorTool onBack={goDashboard} initialAsset={activeAsset} />;
      case 'thumbnail':
        return <ThumbnailTool onBack={goDashboard} />;
      case 'downloader':
        return <DownloaderTool onBack={goDashboard} />;
      case 'video_gen':
        return <VideoGenTool onBack={goDashboard} initialAsset={activeAsset} />;
      default:
        return <Dashboard onSelectTool={setCurrentView} />;
    }
  };

  const hasKey = !!apiKey;

  return (
    <>
      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                {hasKey ? '🔑 Manage API Key' : '🔑 Connect Gemini API Key'}
              </h2>
              <p className="text-slate-500 text-sm">
                Get your free API key from{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline font-semibold"
                >
                  aistudio.google.com/apikey
                </a>
              </p>
            </div>

            {hasKey && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <span className="text-emerald-600 text-xl">✓</span>
                <div>
                  <p className="font-bold text-emerald-800 text-sm">Key Active</p>
                  <p className="text-emerald-600 text-xs font-mono">{apiKey.slice(0, 8)}...{apiKey.slice(-4)}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                {hasKey ? 'Enter New Key to Replace' : 'Paste Your Gemini API Key'}
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setKeyError(''); }}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-sm focus:outline-none focus:border-indigo-400"
              />
              {keyError && (
                <p className="text-red-500 text-xs font-semibold">{keyError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-40 transition-all"
              >
                Save & Connect
              </button>
              {hasKey && (
                <button
                  onClick={handleRemoveKey}
                  className="px-4 py-3 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition-all text-sm"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => { setShowKeyModal(false); setKeyInput(''); setKeyError(''); }}
                className="px-4 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div
              className="flex items-center gap-4 cursor-pointer select-none"
              onClick={goDashboard}
            >
              <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <ICONS.Studio className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-none">Transcript Pro</h1>
                <p className="text-[10px] font-black tracking-[0.3em] text-indigo-500 mt-0.5">AI MEDIA SUITE</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasKey && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  API Active
                </span>
              )}

              <button
                onClick={() => setShowKeyModal(true)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  hasKey
                    ? 'border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200 animate-pulse'
                }`}
              >
                {hasKey ? '🔑 Switch Key' : '⚡ Connect Key'}
              </button>
            </div>
          </div>
        </header>

        {/* No API Key Banner */}
        {!hasKey && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
              <span className="text-amber-600 text-lg">⚡</span>
              <p className="text-amber-800 text-sm font-semibold">
                Connect your Gemini API key to unlock all AI features.{' '}
                <button onClick={() => setShowKeyModal(true)} className="underline font-black text-amber-900">
                  Connect now (free)
                </button>
              </p>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-6 py-10">
          {renderView()}
        </main>

        <footer className="text-center text-sm text-slate-400 py-8 border-t border-slate-100">
          <p className="font-semibold">© 2025 Transcript Pro · Powered by Google Gemini AI</p>
          <p className="text-xs mt-1 text-slate-300">Your API key is stored locally in your browser only</p>
        </footer>
      </div>
    </>
  );
};

export default App;
