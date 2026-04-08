import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Workflow } from 'lucide-react';
import { sendMessageToAssistant } from '../services/mcpService';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: [{ type: 'text', text: "Hi! I'm HireAI, powered by Google Gemini. Ask me about jobs, resumes, interview tips, or career advice! 🚀" }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newHistory = [...messages, userMessage];
    
    // We only pass text content back to the API for history
    const apiHistory = newHistory.map(msg => ({
      role: msg.role,
      content: msg.role === 'user' ? msg.content : (Array.isArray(msg.content) ? msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n') : msg.content)
    }));

    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    const response = await sendMessageToAssistant(apiHistory);
    
    setIsLoading(false);
    if (response && response.content) {
      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: [{ type: 'text', text: "Sorry, I had trouble reaching my neural pathways. Try again later!" }] }]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigoPrimary text-white rounded-full shadow-[0_0_20px_rgba(79,110,247,0.5)] hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageSquare size={26} />
      </button>

      <div className={`fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[85vh] bg-navy border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigoPrimary flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-bold font-syne text-sm text-white">HireAI Assistant</h3>
              <p className="text-xs text-green-400">Online • Powered by Gemini</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigoPrimary text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm'}`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="space-y-2">
                    {Array.isArray(msg.content) ? msg.content.map((block, bIdx) => {
                       if (block.type === 'text') return <div key={bIdx}>{block.text}</div>;
                       if (block.type === 'mcp_tool_use') return (
                         <div key={bIdx} className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 p-2 rounded border border-amber-400/20 mt-2">
                            <Workflow size={12} /> Syncing with Stitch... ({block.name})
                         </div>
                       );
                       if (block.type === 'mcp_tool_result') return (
                         <div key={bIdx} className="text-xs text-green-400 italic">✓ {block.outcome}</div>
                       );
                       return null;
                    }) : msg.content}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-xl rounded-tl-sm p-4 flex gap-1 items-center">
                 <Loader2 size={16} className="animate-spin text-indigo-400" />
                 <span className="text-xs text-gray-400 ml-1">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 rounded-b-2xl">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about salary data or resume tips..." 
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigoPrimary focus:ring-1 focus:ring-indigoPrimary text-white placeholder-gray-500"
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white disabled:opacity-50 transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
