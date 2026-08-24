"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Sparkles, ClipboardList, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ResultPage() {
  const router = useRouter();
  const { currentText, currentSummary } = useStore();
  const [activeTab, setActiveTab] = useState<"summary" | "text">("summary");

  const handleBack = () => router.push("/");

  return (
    <main
      className="min-h-screen py-6 md:py-10 px-4"
      style={{ background: "linear-gradient(145deg, #FDF4D2 0%, #f5efd0 40%, #ede8d8 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #B0CDE6, transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #A290B7, transparent)" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 mb-6 transition-all"
          style={{ color: "#a08888" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#946D6D"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#a08888"}
        >
          <div
            className="p-2 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(176,205,230,0.4)" }}
          >
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-medium">Upload Another Document</span>
        </button>

        {!currentText && !currentSummary ? (
          <div
            className="rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-500"
            style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(176,205,230,0.4)",
            }}
          >
            <ClipboardList size={48} className="mx-auto mb-4" style={{ color: "#c4b8d0" }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#946D6D" }}>No Document Found</h2>
            <p className="text-sm mb-6" style={{ color: "#a08888" }}>You haven&apos;t extracted or summarized any text yet.</p>
            <button
              onClick={handleBack}
              className="text-white text-sm font-medium py-2 px-6 rounded-lg transition-all"
              style={{ background: "linear-gradient(135deg, #A290B7 0%, #8e7ba8 100%)" }}
            >
              Go to Upload Page
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-600"
            style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(176,205,230,0.4)",
              boxShadow: "0 8px 32px rgba(148,109,109,0.08)",
            }}
          >
            {/* Tab Bar */}
            <div
              className="flex"
              style={{ borderBottom: "1.5px solid rgba(176,205,230,0.35)", background: "rgba(253,244,210,0.5)" }}
            >
              <button
                onClick={() => setActiveTab("summary")}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all"
                style={{
                  color: activeTab === "summary" ? "#A290B7" : "#b09898",
                  borderBottom: activeTab === "summary" ? "2px solid #A290B7" : "2px solid transparent",
                  background: activeTab === "summary" ? "rgba(162,144,183,0.08)" : "transparent",
                }}
              >
                <Sparkles size={15} />
                AI Summary
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all"
                style={{
                  color: activeTab === "text" ? "#B0CDE6" : "#b09898",
                  borderBottom: activeTab === "text" ? "2px solid #7aaac8" : "2px solid transparent",
                  background: activeTab === "text" ? "rgba(176,205,230,0.1)" : "transparent",
                }}
              >
                <ClipboardList size={15} />
                Extracted Text
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {activeTab === "summary" && (
                <div className="min-h-[400px]">
                  {currentSummary ? (
                    <div
                      className="prose max-w-none"
                      style={{ color: "#6a5252" }}
                    >
                      <style>{`
                        .result-prose h1, .result-prose h2, .result-prose h3 { color: #946D6D; }
                        .result-prose strong { color: #946D6D; }
                        .result-prose a { color: #A290B7; }
                        .result-prose code { background: rgba(176,205,230,0.2); color: #5a7a96; padding: 2px 6px; border-radius: 4px; }
                        .result-prose ul li::marker { color: #A290B7; }
                        .result-prose p { color: #6a5252; line-height: 1.75; }
                        .result-prose hr { border-color: rgba(176,205,230,0.4); }
                      `}</style>
                      <div className="result-prose">
                        <ReactMarkdown>{currentSummary}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                      <Sparkles size={32} className="mb-4 opacity-25" style={{ color: "#A290B7" }} />
                      <p className="text-sm italic" style={{ color: "#b09898" }}>No summary generated yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "text" && (
                <div className="min-h-[400px]">
                  {currentText ? (
                    <div
                      className="prose max-w-none"
                      style={{ color: "#6a5252" }}
                    >
                      <style>{`
                        .result-prose-text p { color: #6a5252; line-height: 1.75; }
                        .result-prose-text strong { color: #946D6D; }
                      `}</style>
                      <div className="result-prose-text">
                        <ReactMarkdown>{currentText}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                      <ClipboardList size={32} className="mb-4 opacity-25" style={{ color: "#B0CDE6" }} />
                      <p className="text-sm italic" style={{ color: "#b09898" }}>No text extracted yet.</p>
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
