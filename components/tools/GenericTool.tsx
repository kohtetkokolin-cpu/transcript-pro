
import React from 'react';
import { ICONS } from '../../constants';

interface GenericToolProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onBack: () => void;
}

export const GenericTool: React.FC<GenericToolProps> = ({ title, description, icon, onBack }) => {
  return (
    <div className="animate-slideUp max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <ICONS.Link className="w-5 h-5 rotate-180" />
        </button>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] p-16 border border-slate-200 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner">
           {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black">{title} Engine</h3>
          <p className="text-slate-500 font-medium max-w-md">{description}</p>
        </div>
        <div className="px-6 py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
           Integration Pending
        </div>
        <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">Return to Dashboard</button>
      </div>
    </div>
  );
};
