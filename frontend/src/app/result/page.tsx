"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Sparkles, ClipboardList, ArrowLeft, Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { summarizeDocument } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const DEPTH_OPTIONS = [
  { key: "concise", label: "Concise", desc: "3–5 key bullets" },
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

  // Track which depth is currently active
  const [activeDepth, setActiveDepth] = useState<Depth>((initialDepth as Depth) || "medium");
  const [generatingDepth, setGeneratingDepth] = useState<Depth | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "text">("summary");
  const [isCopied, setIsCopied] = useState(false);

  const generateSummary = useCallback(async (depth: Depth) => {
    if (!currentDocumentId || !currentText) return;
    if (summaries[depth]) return; // Already cached
    setGeneratingDepth(depth);
    try {
      const data = await summarizeDocument(currentDocumentId, currentText, depth);
      setSummaryForDepth(depth, data.summary);
    } catch {
      // Silently fail — user can retry by clicking again
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

  // Trigger generation on first load if depth is not cached
  useEffect(() => {
    if (initialDepth && !summaries[initialDepth]) {
      generateSummary(initialDepth as Depth);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSummary = summaries[activeDepth] || null;
  const isGenerating = generatingDepth === activeDepth;

  return (
    <main
      className="min-h-screen py-6 md:py-10 px-4"
      style={{ background: "linear-gradient(145deg, #FDF4D2 0%, #f5efd0 40%, #ede8d8 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #B0CDE6, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #A290B7, transparent)" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 mb-6 transition-all group"
          style={{ color: "#a08888" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#946D6D"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#a08888"}
        >
          <div className="p-2 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(176,205,230,0.4)" }}>
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-medium">Upload Another Document</span>
        </button>

        {!currentText && Object.keys(summaries).length === 0 ? (
          <div className="rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-500"
            style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(176,205,230,0.4)" }}>
            <ClipboardList size={48} className="mx-auto mb-4" style={{ color: "#c4b8d0" }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#946D6D" }}>No Document Found</h2>
            <p className="text-sm mb-6" style={{ color: "#a08888" }}>You haven&apos;t extracted or summarized any text yet.</p>
            <button onClick={() => router.push("/")}
              className="text-white text-sm font-medium py-2 px-6 rounded-lg"
              style={{ background: "linear-gradient(135deg, #A290B7, #8e7ba8)" }}>
              Go to Upload Page
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-600"
            style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(176,205,230,0.4)", boxShadow: "0 8px 32px rgba(148,109,109,0.08)" }}>
            
            {/* Main Tab Bar */}
            <div className="flex" style={{ borderBottom: "1.5px solid rgba(176,205,230,0.35)", background: "rgba(253,244,210,0.6)" }}>
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
                  color: activeTab === "text" ? "#7aaac8" : "#b09898",
                  borderBottom: activeTab === "text" ? "2px solid #7aaac8" : "2px solid transparent",
                  background: activeTab === "text" ? "rgba(176,205,230,0.1)" : "transparent",
                }}
              >
                <ClipboardList size={15} />
                Extracted Text
              </button>
            </div>

            {/* AI Summary Tab Content */}
            {activeTab === "summary" && (
              <div>
                {/* Depth Sub-Tabs */}
                <div
                  className="flex items-center gap-2 px-6 py-3"
                  style={{ borderBottom: "1px solid rgba(176,205,230,0.3)", background: "rgba(255,255,255,0.4)" }}
                >
                  <span className="text-xs font-medium mr-1" style={{ color: "#b09898" }}>Depth:</span>
                  {DEPTH_OPTIONS.map((opt) => {
                    const isCached = !!summaries[opt.key];
                    const isActive = activeDepth === opt.key;
                    const isLoading = generatingDepth === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleDepthChange(opt.key as Depth)}
                        title={opt.desc}
                        className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: isActive
                            ? "linear-gradient(135deg, #A290B7, #8e7ba8)"
                            : "rgba(255,255,255,0.8)",
                          color: isActive ? "#fff" : "#946D6D",
                          border: isActive
                            ? "1.5px solid transparent"
                            : "1.5px solid rgba(176,205,230,0.5)",
                          boxShadow: isActive ? "0 2px 10px rgba(162,144,183,0.4)" : "none",
                        }}
                      >
                        {isLoading ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : isCached && !isActive ? (
                          <CheckCircle2 size={11} style={{ color: "#A290B7" }} />
                        ) : null}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Document Editor Area */}
                <div className="p-6 md:p-8">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full animate-spin"
                          style={{ border: "3px solid rgba(162,144,183,0.2)", borderTopColor: "#A290B7" }} />
                        <Sparkles size={16} className="absolute inset-0 m-auto" style={{ color: "#A290B7" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#a08888" }}>Generating {activeDepth} summary…</p>
                      <p className="text-xs" style={{ color: "#c4a8a8" }}>This usually takes 5–10 seconds</p>
                    </div>
                  ) : activeSummary ? (
                    <div
                      className="min-h-[400px] rounded-xl p-6 md:p-8"
                      style={{
                        background: "rgba(255,255,255,0.8)",
                        border: "1px solid rgba(176,205,230,0.3)",
                        boxShadow: "0 2px 12px rgba(148,109,109,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                      }}
                    >
                      {/* Editor Header */}
                      <div className="flex items-center gap-3 mb-6 pb-4"
                        style={{ borderBottom: "1px solid rgba(176,205,230,0.3)" }}>
                        <div className="p-2 rounded-lg"
                          style={{ background: "rgba(162,144,183,0.15)" }}>
                          <Sparkles size={16} style={{ color: "#A290B7" }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#A290B7" }}>
                            AI Generated · {activeDepth.charAt(0).toUpperCase() + activeDepth.slice(1)} Summary
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#c4a8a8" }}>
                            {activeSummary.split(" ").length} words
                          </p>
                        </div>
                      </div>

                      {/* Rich Document Content */}
                      <div className="document-editor">
                        <style>{`
                          .document-editor h1 {
                            font-size: 1.5rem;
                            font-weight: 700;
                            color: #946D6D;
                            margin: 1.5rem 0 0.75rem;
                            padding-bottom: 0.5rem;
                            border-bottom: 2px solid rgba(162,144,183,0.25);
                            line-height: 1.3;
                          }
                          .document-editor h2 {
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
                          .document-editor ol {
                            padding-left: 1.5rem;
                            margin: 0.5rem 0;
                          }
                          .document-editor ol li {
                            color: #6a5252;
                            line-height: 1.75;
                            font-size: 0.9375rem;
                            padding: 0.15rem 0;
                          }
                          .document-editor ol li::marker {
                            color: #A290B7;
                            font-weight: 600;
                          }
                          .document-editor strong {
                            color: #946D6D;
                            font-weight: 700;
                          }
                          .document-editor em {
                            color: #8a6060;
                            font-style: italic;
                          }
                          .document-editor code {
                            background: rgba(176,205,230,0.25);
                            color: #4a7a96;
                            padding: 2px 7px;
                            border-radius: 5px;
                            font-size: 0.85em;
                            font-family: 'GeistMono', monospace;
                            border: 1px solid rgba(176,205,230,0.4);
                          }
                          .document-editor pre {
                            background: rgba(176,205,230,0.12);
                            border: 1px solid rgba(176,205,230,0.4);
                            border-radius: 10px;
                            padding: 1rem 1.25rem;
                            overflow-x: auto;
                            margin: 1rem 0;
                          }
                          .document-editor blockquote {
                            border-left: 4px solid #A290B7;
                            margin: 1rem 0;
                            padding: 0.5rem 1.25rem;
                            background: rgba(162,144,183,0.08);
                            border-radius: 0 8px 8px 0;
                          }
                          .document-editor blockquote p {
                            color: #7a6070;
                            font-style: italic;
                          }
                          .document-editor hr {
                            border: none;
                            border-top: 1.5px solid rgba(176,205,230,0.35);
                            margin: 1.5rem 0;
                          }
                          .document-editor a {
                            color: #A290B7;
                            text-decoration: underline;
                            text-underline-offset: 3px;
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
              <div className="p-6 md:p-8">
                {currentText ? (
                  <div
                    className="min-h-[400px] rounded-xl p-6 md:p-8"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(176,205,230,0.3)",
                      boxShadow: "0 2px 12px rgba(148,109,109,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    {/* Editor Header */}
                    <div className="flex items-center justify-between mb-6 pb-4"
                      style={{ borderBottom: "1px solid rgba(176,205,230,0.3)" }}>
                      <div className="p-2 rounded-lg" style={{ background: "rgba(176,205,230,0.2)" }}>
                        <ClipboardList size={16} style={{ color: "#7aaac8" }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7aaac8" }}>
                          Extracted Content · Raw Text
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#c4a8a8" }}>
                          {currentText.split(" ").length} words
                        </p>
                      </div>
                    </div>
                    <div className="document-editor">
                      <style>{`
                        .document-editor p { color: #6a5252; line-height: 1.8; margin: 0.6rem 0; font-size: 0.9375rem; }
                        .document-editor strong { color: #946D6D; font-weight: 700; }
                        .document-editor h1, .document-editor h2, .document-editor h3 { color: #946D6D; font-weight: 700; margin: 1rem 0 0.5rem; }
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
        )}
      </div>
    </main>
  );
}
