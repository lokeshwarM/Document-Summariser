"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Sparkles, ClipboardList, ArrowLeft, Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { summarizeDocument } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const DEPTH_OPTIONS = [
  { key: "concise", label: "Concise", desc: "3-5 key bullets" },
  { key: "medium", label: "Medium", desc: "Balanced overview" },
  { key: "detailed", label: "Detailed", desc: "Section-by-section" },
] as const;

type Depth = "concise" | "medium" | "detailed";

export default function ResultPage() {
  const router = useRouter();
  const {
    currentText,
    currentDocumentId,
    summaries,
    initialDepth,
    setSummaryForDepth,
  } = useStore();

  const [activeDepth, setActiveDepth] = useState<Depth>((initialDepth as Depth) || "medium");
  const [generatingDepth, setGeneratingDepth] = useState<Depth | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "text">("summary");
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
    const textToCopy = activeTab === "summary" ? summaries[activeDepth] : currentText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDepthChange = (depth: Depth) => {
    setActiveDepth(depth);
    if (!summaries[depth]) {
      generateSummary(depth);
    }
  };

  useEffect(() => {
    if (initialDepth && !summaries[initialDepth]) {
      generateSummary(initialDepth as Depth);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSummary = summaries[activeDepth];

  return (
    <main className="min-h-screen p-2 sm:p-4 md:p-8 flex flex-col items-center" style={{ background: "linear-gradient(135deg, #FDF4D2 0%, #fcf7e6 100%)" }}>
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70 px-4 py-2 rounded-full"
          style={{ color: "#946D6D", background: "rgba(255,255,255,0.5)" }}
        >
          <ArrowLeft size={16} />
          Upload Another Document
        </button>
      </div>

      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-xl"
        style={{ background: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)" }}>
        
        {/* Main Tabs */}
        <div className="flex border-b" style={{ borderColor: "rgba(162,144,183,0.3)" }}>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${
              activeTab === "summary" ? "border-b-2" : "opacity-60 hover:opacity-100"
            }`}
            style={{ 
              color: activeTab === "summary" ? "#946D6D" : "#A290B7",
              borderColor: activeTab === "summary" ? "#946D6D" : "transparent",
              background: activeTab === "summary" ? "rgba(255,255,255,0.5)" : "transparent"
            }}
          >
            <Sparkles size={18} />
            AI Summary
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${
              activeTab === "text" ? "border-b-2" : "opacity-60 hover:opacity-100"
            }`}
            style={{ 
              color: activeTab === "text" ? "#946D6D" : "#A290B7",
              borderColor: activeTab === "text" ? "#946D6D" : "transparent",
              background: activeTab === "text" ? "rgba(255,255,255,0.5)" : "transparent"
            }}
          >
            <ClipboardList size={18} />
            Extracted Text
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "summary" && (
          <div className="flex flex-col">
            {/* Depth Sub-navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 md:px-8 border-b" style={{ borderColor: "rgba(255,255,255,0.5)", background: "rgba(253,244,210,0.3)" }}>
              <span className="text-sm font-medium" style={{ color: "#a89494" }}>Depth:</span>
              <div className="flex flex-wrap gap-2">
                {DEPTH_OPTIONS.map((opt) => {
                  const isGenerating = generatingDepth === opt.key;
                  const isCached = !!summaries[opt.key];
                  const isActive = activeDepth === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleDepthChange(opt.key)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive ? "shadow-sm" : "hover:bg-white/40"
                      }`}
                      style={{
                        background: isActive ? "#A290B7" : "transparent",
                        color: isActive ? "#ffffff" : "#A290B7",
                        border: isActive ? "1px solid transparent" : "1px solid rgba(162,144,183,0.3)"
                      }}
                    >
                      {isGenerating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isCached && !isActive ? (
                        <CheckCircle2 size={14} style={{ opacity: 0.6 }} />
                      ) : null}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 sm:p-5 md:p-8">
              {activeSummary ? (
                <div 
                  className="min-h-[400px] rounded-xl p-4 sm:p-6 md:p-8 relative"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(162,144,183,0.2)",
                    boxShadow: "0 4px 20px rgba(162,144,183,0.08), inset 0 1px 0 rgba(255,255,255,1)",
                  }}
                >
                  <div className="flex items-center justify-between mb-6 pb-4"
                    style={{ borderBottom: "1px solid rgba(162,144,183,0.2)" }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: "rgba(162,144,183,0.15)" }}>
                        <Sparkles size={16} style={{ color: "#A290B7" }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#A290B7" }}>
                          AI Generated &middot; {activeDepth.charAt(0).toUpperCase() + activeDepth.slice(1)} Summary
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#c4a8a8" }}>
                          {activeSummary.split(" ").length} words
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: isCopied ? "rgba(151,202,176,0.2)" : "rgba(162,144,183,0.1)",
                        color: isCopied ? "#5a8c73" : "#A290B7",
                        border: isCopied ? "1px solid rgba(151,202,176,0.4)" : "1px solid rgba(162,144,183,0.2)"
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="document-editor">
                    <style>{`
                      .document-editor h1, .document-editor h2 {
                        font-size: 1.15rem;
                        font-weight: 700;
                        color: #8a6060;
                        margin: 1.25rem 0 0.5rem;
                      }
                      .document-editor h3 {
                        font-size: 1rem;
                        font-weight: 600;
                        color: #A290B7;
                        margin: 1rem 0 0.4rem;
                      }
                      .document-editor p {
                        color: #6a5252;
                        line-height: 1.8;
                        margin: 0.6rem 0;
                        font-size: 0.9375rem;
                      }
                      .document-editor ul {
                        margin: 0.5rem 0 0.5rem 0.25rem;
                        list-style: none;
                        padding: 0;
                      }
                      .document-editor ul li {
                        color: #6a5252;
                        line-height: 1.75;
                        font-size: 0.9375rem;
                        padding: 0.2rem 0 0.2rem 1.4rem;
                        position: relative;
                      }
                      .document-editor ul li::before {
                        content: "";
                        position: absolute;
                        left: 0;
                        top: 0.7rem;
                        width: 7px;
                        height: 7px;
                        border-radius: 50%;
                        background: #A290B7;
                      }
                      .document-editor strong {
                        color: #946D6D;
                        font-weight: 700;
                      }
                      .document-editor em {
                        color: #8a6060;
                        font-style: italic;
                      }
                    `}</style>
                    <ReactMarkdown>{activeSummary}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="p-4 rounded-full mb-4" style={{ background: "rgba(162,144,183,0.1)" }}>
                    <Sparkles size={28} style={{ color: "#c4b8d0" }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#b09898" }}>No summary yet</p>
                  <p className="text-xs mt-1" style={{ color: "#c4a8a8" }}>
                    Click a depth above to generate
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extracted Text Tab Content */}
        {activeTab === "text" && (
          <div className="p-3 sm:p-5 md:p-8">
            {currentText ? (
              <div
                className="min-h-[400px] rounded-xl p-4 sm:p-6 md:p-8"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(176,205,230,0.3)",
                  boxShadow: "0 2px 12px rgba(148,109,109,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <div className="flex items-center justify-between mb-6 pb-4"
                  style={{ borderBottom: "1px solid rgba(176,205,230,0.3)" }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(176,205,230,0.2)" }}>
                      <ClipboardList size={16} style={{ color: "#7aaac8" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7aaac8" }}>
                        Extracted Content &middot; Raw Text
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#c4a8a8" }}>
                        {currentText.split(" ").length} words
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: isCopied ? "rgba(151,202,176,0.2)" : "rgba(176,205,230,0.15)",
                      color: isCopied ? "#5a8c73" : "#7aaac8",
                      border: isCopied ? "1px solid rgba(151,202,176,0.4)" : "1px solid rgba(176,205,230,0.3)"
                    }}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="document-editor">
                  <style>{`
                    .document-editor p { color: #6a5252; line-height: 1.8; margin: 0.6rem 0; font-size: 0.9375rem; }
                    .document-editor strong { color: #946D6D; font-weight: 700; }
                  `}</style>
                  <ReactMarkdown>{currentText}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 rounded-full mb-4" style={{ background: "rgba(176,205,230,0.15)" }}>
                  <ClipboardList size={28} style={{ color: "#b8ccd8" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#b09898" }}>No text extracted yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
