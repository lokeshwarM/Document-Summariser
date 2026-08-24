'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Copy, Check, Sparkles, Loader2, FileText } from 'lucide-react';
import { summarizeDocument } from '@/lib/api';
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
  } = useStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'text'>('summary');
  const [activeDepth, setActiveDepth] = useState<Depth>('medium');
  const [generatingDepth, setGeneratingDepth] = useState<Depth | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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
             style={{ boxShadow: '6px 6px 0px #222222', minHeight: '600px' }}>
          
          <div className="flex border-b-4 border-[#222222]">
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
            <div className="flex flex-col flex-1">
              <div className="p-4 border-b-4 flex flex-wrap items-center gap-3 border-[#222222] bg-[#F5E7C6]">
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

              <div className="flex-1 p-6 md:p-8 relative">
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
                  <div className="prose prose-orange max-w-none prose-headings:text-[#222222] prose-p:text-[#222222] prose-strong:text-[#222222]">
                    <ReactMarkdown>{currentSummary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 py-20 opacity-50">
                    <Sparkles size={40} className="text-[#222222]" />
                    <p className="font-bold text-[#222222]">No summary yet. Click a depth above to generate.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="flex-1 p-6 md:p-8 relative">
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
