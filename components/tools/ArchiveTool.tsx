
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { ArchiveService } from '../../services/ArchiveService';
import { ArchiveEntry, AppView, ArchiveType } from '../../types';
import { ArchiveAssistant } from './ArchiveAssistant';

// Use React.ComponentType to allow passing common props like className
const TYPE_CONFIG: Record<ArchiveType, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  Story: { icon: ICONS.Pencil, color: 'text-orange-600', bg: 'bg-orange-50' },
  Recap: { icon: ICONS.Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  Transcript: { icon: ICONS.Studio, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  Audiobook: { icon: ICONS.Studio, color: 'text-purple-600', bg: 'bg-purple-50' },
  Translation: { icon: ICONS.Pencil, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Voice: { icon: ICONS.Studio, color: 'text-purple-600', bg: 'bg-purple-50' },
  Thumbnail: { icon: ICONS.Image, color: 'text-rose-600', bg: 'bg-rose-50' },
  Content: { icon: ICONS.Studio, color: 'text-pink-600', bg: 'bg-pink-50' },
  Video: { icon: ICONS.Studio, color: 'text-rose-600', bg: 'bg-rose-50' }
};

export const ArchiveTool: React.FC<{ 
  onBack: () => void;
  onResume: (tool: AppView, entry: ArchiveEntry) => void;
}> = ({ onBack, onResume }) => {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    setEntries(ArchiveService.listAll());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Permanently delete this asset from the memory core?")) {
      ArchiveService.deleteAsset(id);
      setEntries(ArchiveService.listAll());
    }
  };

  const filtered = entries.filter(e => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.fileId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: ArchiveType) => {
    const Config = TYPE_CONFIG[type] || TYPE_CONFIG.Content;
    const IconComponent = Config.icon;
    // IconComponent now supports props like className via ComponentType
    return <IconComponent className={`w-6 h-6 ${Config.color}`} />;
  };

  return (
    <div className="animate-slideUp max-w-7xl mx-auto space-y-12 pb-20 relative">
      {/* Archive Assistant Side Panel */}
      <ArchiveAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        entries={entries}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack} 
              className="w-16 h-16 flex items-center justify-center bg-white border border-slate-200 rounded-[1.75rem] hover:border-slate-900 hover:shadow-xl transition-all active:scale-95 group"
            >
              <ICONS.Link className="w-8 h-8 rotate-180 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
            <div className="space-y-1">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Archive Master</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-600 mt-2">Neural Asset Management Core</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAssistantOpen(true)}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95"
          >
            <ICONS.Sparkles className="w-4 h-4" />
            Talk to Assistant
          </button>
          <div className="px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Assets</span>
            <span className="text-xl font-black text-slate-900">{entries.length}</span>
          </div>
          <button 
             onClick={() => { if(confirm("Purge global memory core?")) { ArchiveService.clearAll(); setEntries([]); } }}
             className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
           >
             Purge Core
           </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-[3rem] p-4 border border-slate-200 shadow-2xl flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
        <div className="relative flex-1 group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search by Title, ID or Metadata..."
            className="w-full pl-16 pr-8 py-6 bg-slate-50/50 border border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-200 outline-none font-bold text-lg transition-all shadow-inner"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="h-10 w-[1px] bg-slate-100 hidden xl:block mx-2"></div>

        <div className="flex overflow-x-auto custom-scrollbar gap-2 p-1">
          {['All', 'Story', 'Recap', 'Transcript', 'Translation', 'Voice', 'Thumbnail', 'Content'].map(type => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-500 hover:bg-white hover:border-slate-200 border border-transparent'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-6">
        {filtered.length > 0 ? (
          filtered.map(entry => {
            const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.Content;
            return (
              <div 
                key={entry.id} 
                className="group bg-white border border-slate-200 p-8 rounded-[3.5rem] hover:border-indigo-400 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-10"
              >
                <div className="flex items-center gap-10">
                  {/* File ID Badge */}
                  <div className={`w-24 h-24 ${config.bg} rounded-[2.25rem] flex flex-col items-center justify-center border border-white shadow-sm shrink-0 transition-transform group-hover:scale-105 duration-500`}>
                    <span className={`text-2xl font-black ${config.color}`}>{entry.fileId.split('-')[0] || '??'}</span>
                    <span className="text-[10px] font-black text-slate-400">#{entry.fileId.split('-')[1] || '000'}</span>
                  </div>

                  {/* Main Content Info */}
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center flex-wrap gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 ${config.bg} rounded-lg`}>
                        {getIcon(entry.type)}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>{entry.type}</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Version {entry.version}</span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-3 py-1.5">{new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-2xl">{entry.title}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{entry.language}</span>
                      {entry.metadata?.wordCount && <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{entry.metadata.wordCount} Words</span>}
                      {entry.metadata?.sourceUrl && (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-rose-400">
                          <ICONS.Link className="w-3 h-3" /> YouTube Connected
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onResume(entry.toolId, entry)}
                    className="px-10 py-5 bg-slate-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all flex items-center gap-3 active:scale-95 group/btn"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Resume Production
                  </button>
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    className="w-16 h-16 flex items-center justify-center bg-white border border-slate-100 rounded-[1.75rem] text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all group/del shadow-sm"
                  >
                    <svg className="w-6 h-6 transition-transform group-hover/del:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-40 flex flex-col items-center justify-center text-center space-y-10 animate-fadeIn">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center shadow-inner opacity-20 group">
              <ICONS.List className="w-16 h-16 text-slate-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-slate-300 uppercase tracking-[0.4em]">Memory Void</h3>
              <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">No assets match your current neural filters. Clear your search or initiate a new production sequence.</p>
            </div>
            <button onClick={clearFilters} className="text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:underline">Reset Neural Filters</button>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Archive Engine v2.5 Stable
        </div>
        <div className="flex items-center gap-8">
          <span className="hover:text-indigo-600 cursor-help transition-colors">Data Integrity: 100%</span>
          <span className="hover:text-indigo-600 cursor-help transition-colors">Latency: 12ms</span>
          <span className="hover:text-indigo-600 cursor-help transition-colors">AES-256 Encryption Active</span>
        </div>
      </div>
    </div>
  );

  function clearFilters() {
    setFilterType('All');
    setSearchQuery('');
  }
};
