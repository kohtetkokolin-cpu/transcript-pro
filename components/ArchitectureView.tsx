
import React from 'react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text">System Architecture</h2>
        <p className="text-slate-400 mt-2">Transcript Pro Enterprise Design</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-effect p-6 rounded-2xl">
          <div className="h-12 w-12 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
            <span className="text-sky-400 font-bold">FE</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Frontend Layer</h3>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• React 18+ Single Page App</li>
            <li>• Tailwind CSS for UI System</li>
            <li>• Web Audio API for PCM playback</li>
            <li>• Client-side File Processing</li>
          </ul>
        </div>

        <div className="glass-effect p-6 rounded-2xl border-sky-500/30">
          <div className="h-12 w-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
            <span className="text-indigo-400 font-bold">AI</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Intelligence Engine</h3>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• Google Gemini Multimodal API</li>
            <li>• Flash 2.5 for Ultra-low Latency</li>
            <li>• Native TTS Model (Gemini 2.5)</li>
            <li>• Structured JSON Schema Output</li>
          </ul>
        </div>

        <div className="glass-effect p-6 rounded-2xl">
          <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
            <span className="text-purple-400 font-bold">IO</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Output Systems</h3>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• Subtitle Engine (SRT/VTT)</li>
            <li>• Multi-format Exporters</li>
            <li>• Local Storage for Sessions</li>
            <li>• Cloud Integration Prepared</li>
          </ul>
        </div>
      </div>

      <div className="glass-effect p-8 rounded-3xl mt-8">
        <h3 className="text-xl font-bold mb-4">Data Flow Overview</h3>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 text-xs font-mono text-sky-400">INPUT</div>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-sky-500"></div>
            </div>
            <div className="text-xs text-slate-500">Video/Audio File (Base64)</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-24 text-xs font-mono text-indigo-400">PROCESS</div>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="w-2/4 h-full bg-indigo-500"></div>
            </div>
            <div className="text-xs text-slate-500">Gemini LLM Inference</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-24 text-xs font-mono text-emerald-400">OUTPUT</div>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="w-full h-full bg-emerald-500"></div>
            </div>
            <div className="text-xs text-slate-500">Text + Timestamps + SRT</div>
          </div>
        </div>
      </div>
    </div>
  );
};
