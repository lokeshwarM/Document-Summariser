"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Sparkles, ClipboardList, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ResultPage() {
  const router = useRouter();
  const { currentText, currentSummary } = useStore();
  
  // If the user lands here directly without a document, default to summary tab but they'll see the empty state.
  const [activeTab, setActiveTab] = useState<'summary' | 'text'>('summary');

  const handleBack = () => {
    // Optionally clear state if you want a fresh start, or keep it so they can summarize the same doc.
    // For now, we'll keep it so they can summarize at a different depth from the home page.
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-8 md:py-16">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header / Back Button */}
        <button 
          onClick={handleBack}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <div className="p-2 bg-white/5 group-hover:bg-white/10 rounded-full transition-colors border border-white/10">
            <ArrowLeft size={16} />
          </div>
          <span className="font-medium text-sm">Upload Another Document</span>
        </button>

        {!currentText && !currentSummary ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-500">
             <ClipboardList size={48} className="mx-auto text-slate-600 mb-4" />
             <h2 className="text-xl font-semibold text-white mb-2">No Document Found</h2>
             <p className="text-slate-400 mb-6">You haven&apos;t extracted or summarized any text yet.</p>
             <button onClick={handleBack} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-colors">
               Go to Upload Page
             </button>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Tab Bar */}
            <div className="flex border-b border-white/10 bg-black/20">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'summary' 
                    ? 'text-violet-300 border-b-2 border-violet-500 bg-white/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Sparkles size={16} className={activeTab === 'summary' ? 'text-violet-400' : ''} />
                AI Summary
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'text' 
                    ? 'text-indigo-300 border-b-2 border-indigo-500 bg-white/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <ClipboardList size={16} className={activeTab === 'text' ? 'text-indigo-400' : ''} />
                Extracted Text
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-5 md:p-8">
              {activeTab === 'summary' && (
                <div className="min-h-[500px]">
                  {currentSummary ? (
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-headings:text-slate-200">
                      <ReactMarkdown>{currentSummary}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 italic">
                      <Sparkles size={32} className="mb-4 opacity-20" />
                      No summary generated yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <div className="min-h-[500px]">
                  {currentText ? (
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed">
                      <ReactMarkdown>{currentText}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 italic">
                      <ClipboardList size={32} className="mb-4 opacity-20" />
                      No text extracted yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
