
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../constants';
import { ArchiveEntry, ChatMessage } from '../../types';
import { startArchiveChat } from '../../services/geminiService';
import { GenerateContentResponse } from "@google/genai";

interface ArchiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ArchiveEntry[];
}

export const ArchiveAssistant: React.FC<ArchiveAssistantProps> = ({ isOpen, onClose, entries }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      const summary = entries.map(e => `[${e.fileId}] ${e.type}: ${e.title} (${e.language})`).join('\n');
      chatRef.current = startArchiveChat([], summary);
    }
  }, [isOpen, entries]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        const summary = entries.map(e => `[${e.fileId}] ${e.type}: ${e.title} (${e.language})`).join('\n');
        chatRef.current = startArchiveChat([], summary);
      }

      const streamResponse = await chatRef.current.sendMessageStream({ message: input });
      
      let assistantText = '';
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        assistantText += c.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: assistantText }] };
          return newMessages;
        });
      }
    } catch (err: any) {
      console.error("Assistant error:", err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Fault in neural link. Please check your API key and project settings." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-slideUp">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <ICONS.Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">MediaFlow Assistant</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Contextual Memory Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 px-10">
            <ICONS.Sparkles className="w-16 h-16 text-indigo-600" />
            <div className="space-y-2">
              <p className="text-xl font-black uppercase tracking-widest">Neural Link Ready</p>
              <p className="text-xs font-medium leading-relaxed">Ask me about your {entries.length} archived assets, or request a new transcription/translation strategy.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full pt-4">
               <button onClick={() => setInput("What stories did I write about Bagan?")} className="text-[10px] font-black uppercase tracking-widest bg-white py-3 border border-slate-200 rounded-xl hover:border-indigo-400">"What stories did I write?"</button>
               <button onClick={() => setInput("How many recaps are in my archive?")} className="text-[10px] font-black uppercase tracking-widest bg-white py-3 border border-slate-200 rounded-xl hover:border-indigo-400">"Summary of recaps?"</button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm font-medium'}`}>
              <div className="whitespace-pre-wrap">{m.parts[0].text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-tl-sm flex gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-slate-100 bg-white">
        <div className="flex gap-4 items-center">
          <input 
            type="text" 
            placeholder="Type your message..."
            className="flex-1 px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold transition-all shadow-inner"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-slate-900 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
        <p className="text-[8px] font-black uppercase text-center text-slate-300 mt-4 tracking-[0.4em]">Gemini 3 Pro Intelligence</p>
      </div>
    </div>
  );
};
