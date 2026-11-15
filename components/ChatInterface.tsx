import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, string[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const toggleSource = (messageId: string, docName: string) => {
    setExpandedSources(prev => {
      const current = prev[messageId] ?? [];
      const next = current.includes(docName)
        ? current.filter(name => name !== docName)
        : [...current, docName];

      return {
        ...prev,
        [messageId]: next,
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Assistant Lumina</h2>
            <div className="flex items-center gap-1.5">
              <span className="block w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <p className="text-[10px] text-slate-400 font-medium">Ready to analyze</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar pb-32"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-2">
              <i className="fas fa-comments text-3xl text-slate-700"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Ask anything about your docs</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload your files in the sidebar and I'll use them to answer your questions with precise citations and context.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {["Summarize the main points", "Find specific details", "Compare documents", "Draft an overview"].map((hint, i) => (
                <button 
                  key={i}
                  onClick={() => onSendMessage(hint)}
                  className="px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all text-left"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}
              `}>
                <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-magic'} text-xs text-white`}></i>
              </div>
              
              <div className="space-y-2">
                <div className={`
                  p-4 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'bg-slate-900 text-slate-200 border border-slate-800'}
                `}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(msg.sources.map(s => s.docName))).map((docName, idx) => {
                        const relatedSources = msg.sources.filter(source => source.docName === docName);
                        const isExpanded = (expandedSources[msg.id] ?? []).includes(docName);

                        return (
                          <div key={`${msg.id}-${docName}`} className="w-full">
                            <button
                              type="button"
                              onClick={() => toggleSource(msg.id, docName)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[8px]`}></i>
                              {docName}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 space-y-3">
                                {relatedSources.map((source, sourceIdx) => (
                                  <div key={`${docName}-${sourceIdx}`} className="rounded-lg bg-slate-800/40 border border-slate-800 p-2">
                                    <p className="mb-1 text-[9px] uppercase tracking-wide text-slate-400">
                                      Source excerpt
                                    </p>
                                    <p className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                                      {source.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 font-medium px-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mt-1">
                <i className="fas fa-magic text-xs text-blue-400"></i>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Lumina is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search knowledge or ask a question..."
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`
              absolute right-2 top-2 bottom-2 w-12 rounded-xl flex items-center justify-center transition-all
              ${input.trim() && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-slate-600'}
            `}
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-3 font-medium">
          Lumina can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
