'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Copy, Check, Sparkles, Loader2, FileText, SendHorizontal, Bot, User } from 'lucide-react';
import { summarizeDocument, askDocumentQuestion } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

type Depth = 'concise' | 'medium' | 'detailed';

export default function Result() {
  const router = useRouter();
  const {
    currentDocumentId,
    currentText,
    summaries,
    initialDepth,
    setSummaryForDepth,
    chatHistory,
    addChatMessage,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'text'>('summary');
  const [activeDepth, setActiveDepth] = useState<Depth>('medium');
  const [generatingDepth, setGeneratingDepth] = useState<Depth | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const generateSummary = useCallback(async (depth: Depth) => {
    if (!currentDocumentId || !currentText) return;
    if (summaries[depth]) return;
    setGeneratingDepth(depth);
    try {
      const data = await summarizeDocument(currentDocumentId, currentText, depth);
      setSummaryForDepth(depth, data.summary);
    } catch {
      // Silently fail
    } finally {
      setGeneratingDepth(null);
    }
  }, [currentDocumentId, currentText, summaries, setSummaryForDepth]);

  const handleCopy = () => {
    const textToCopy = activeTab === 'summary' ? summaries[activeDepth] : currentText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentDocumentId || isChatting) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsChatting(true);

    try {
      const data = await askDocumentQuestion(currentDocumentId, userMessage, chatHistory);
      addChatMessage({ role: 'model', content: data.response });
    } catch (err) {
      addChatMessage({ role: 'model', content: "Sorry, I encountered an error processing your question." });
    } finally {
      setIsChatting(false);
    }
  };

  useEffect(() => {
    if (!currentDocumentId) {
      router.push('/');
    }
  }, [currentDocumentId, router]);

  useEffect(() => {
    if (initialDepth && !summaries[initialDepth]) {
      generateSummary(initialDepth as Depth);
    }
    if (initialDepth) {
      setActiveDepth(initialDepth as Depth);
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatting]);

  if (!currentDocumentId) return null;

  const currentSummary = summaries[activeDepth];
  const isGenerating = generatingDepth === activeDepth;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-transform hover:-translate-y-1 active:translate-y-0 border-[#222222] bg-[#F5E7C6] text-[#222222]"
            style={{ boxShadow: '2px 2px 0px #222222' }}>
            <ArrowLeft size={16} /> Upload Another Document
          </button>
        </div>

        <div className="w-full rounded-2xl overflow-hidden border-4 flex flex-col border-[#222222] bg-[#FAF3E1]"
             style={{ boxShadow: '6px 6px 0px #222222', minHeight: '600px', height: '80vh', maxHeight: '900px' }}>
          
          <div className="flex border-b-4 border-[#222222] flex-shrink-0">
            <button onClick={() => setActiveTab('summary')}
              className="flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors border-r-4 border-[#222222]"
              style={{
                background: activeTab === 'summary' ? '#FAF3E1' : '#F5E7C6',
                color: '#222222'
              }}>
              <Sparkles size={18} className={activeTab === 'summary' ? "text-[#FF6D1F]" : "text-[#222222]"} />
              AI Summary
            </button>
            <button onClick={() => setActiveTab('text')}
              className="flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors"
              style={{
                background: activeTab === 'text' ? '#FAF3E1' : '#F5E7C6',
                color: '#222222'
              }}>
              <FileText size={18} className={activeTab === 'text' ? "text-[#FF6D1F]" : "text-[#222222]"} />
              Extracted Text
            </button>
          </div>

          {activeTab === 'summary' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 border-b-4 flex flex-wrap items-center gap-3 border-[#222222] bg-[#F5E7C6] flex-shrink-0">
                <span className="text-sm font-bold ml-2 text-[#222222]">Depth:</span>
                {['concise', 'medium', 'detailed'].map((d) => (
                  <button key={d} onClick={() => { setActiveDepth(d as Depth); generateSummary(d as Depth); }}
                    className="px-4 py-1.5 rounded-xl text-sm font-bold border-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 border-[#222222]"
                    style={{
                      background: activeDepth === d ? '#FF6D1F' : '#FAF3E1',
                      color: '#222222',
                      boxShadow: activeDepth === d ? '2px 2px 0px #222222' : 'none'
                    }}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
                <button onClick={handleCopy}
                  className="absolute top-4 right-4 p-2 rounded-xl border-2 transition-all hover:-translate-y-1 active:translate-y-0 border-[#222222] bg-[#F5E7C6] text-[#222222]"
                  style={{ boxShadow: '2px 2px 0px #222222' }}
                  title="Copy to clipboard">
                  {isCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
                
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                    <Loader2 size={40} className="animate-spin text-[#FF6D1F]" />
                    <p className="font-bold text-[#222222]">Generating {activeDepth} summary...</p>
                  </div>
                ) : currentSummary ? (
                  <div className="prose prose-orange max-w-none prose-headings:text-[#222222] prose-p:text-[#222222] prose-strong:text-[#222222] prose-li:text-[#222222] pb-10">
                    <ReactMarkdown>{currentSummary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 py-20 opacity-50">
                    <Sparkles size={40} className="text-[#222222]" />
                    <p className="font-bold text-[#222222]">No summary yet. Click a depth above to generate.</p>
                  </div>
                )}
                
                {/* Chat History Container (Inline below summary) */}
                {chatHistory.length > 0 && (
                  <div className="mt-8 border-t-2 border-dashed border-[#222222] pt-8 flex flex-col gap-4">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-8 h-8 rounded-full border-2 border-[#222222] flex items-center justify-center flex-shrink-0"
                             style={{ background: msg.role === 'user' ? '#FF6D1F' : '#F5E7C6' }}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-3 rounded-xl border-2 border-[#222222] max-w-[85%] ${msg.role === 'user' ? 'bg-[#FF6D1F] text-[#222222]' : 'bg-[#F5E7C6] text-[#222222]'}`}
                             style={{ boxShadow: '2px 2px 0px #222222' }}>
                          <div className="prose prose-sm prose-p:m-0 prose-p:leading-snug"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex gap-3 flex-row">
                        <div className="w-8 h-8 rounded-full border-2 border-[#222222] bg-[#F5E7C6] flex items-center justify-center flex-shrink-0">
                          <Bot size={16} />
                        </div>
                        <div className="p-3 rounded-xl border-2 border-[#222222] bg-[#F5E7C6] flex items-center gap-2" style={{ boxShadow: '2px 2px 0px #222222' }}>
                          <Loader2 size={16} className="animate-spin text-[#FF6D1F]" />
                          <span className="text-sm font-bold">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input Box */}
              <div className="p-4 border-t-4 border-[#222222] bg-[#F5E7C6] flex-shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything about this document..."
                    disabled={isChatting || !currentSummary}
                    className="w-full py-3 pl-4 pr-12 rounded-xl border-2 border-[#222222] bg-[#FAF3E1] text-[#222222] font-medium outline-none focus:ring-2 focus:ring-[#FF6D1F]"
                    style={{ boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.05)' }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatting || !currentSummary}
                    className="absolute right-2 p-1.5 rounded-lg bg-[#FF6D1F] border-2 border-[#222222] text-[#222222] disabled:opacity-50 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <SendHorizontal size={18} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {activeTab === 'text' && (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
              <button onClick={handleCopy}
                className="absolute top-4 right-4 p-2 rounded-xl border-2 transition-all hover:-translate-y-1 active:translate-y-0 border-[#222222] bg-[#F5E7C6] text-[#222222]"
                style={{ boxShadow: '2px 2px 0px #222222' }}
                title="Copy to clipboard">
                {isCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
              <div className="prose max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap text-[#222222]">
                {currentText || "No text available."}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
