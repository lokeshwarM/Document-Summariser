"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { uploadDocument, summarizeDocument } from "@/lib/api";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const {
    currentDocumentId,
    currentText,
    isUploading,
    isSummarizing,
    setDocumentData,
    setSummary,
    setIsUploading,
    setIsSummarizing,
    setError,
  } = useStore();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectingDepth, setIsSelectingDepth] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsSelectingDepth(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleExtractText = async () => {
    if (!file) return;
    if (currentDocumentId && currentText) {
      router.push("/result");
      return;
    }
    setIsUploading(true);
    try {
      const data = await uploadDocument(file);
      setDocumentData(data.document_id, data.text);
      router.push("/result");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail || "Upload failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarizeClick = () => setIsSelectingDepth(true);

  const executeSummarize = async (depth: string) => {
    if (!file && !currentDocumentId) return;
    let docId = currentDocumentId;
    let docText = currentText;

    if (!docId) {
      if (!file) return;
      setIsUploading(true);
      try {
        const data = await uploadDocument(file);
        setDocumentData(data.document_id, data.text);
        docId = data.document_id;
        docText = data.text;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { detail?: string } } };
        const msg = e.response?.data?.detail || "Upload failed. Please try again.";
        setError(msg);
        toast.error(msg);
        setIsUploading(false);
        setIsSelectingDepth(false);
        return;
      }
      setIsUploading(false);
    }

    if (!docText || !docId) return;
    setIsSummarizing(true);
    try {
      const data = await summarizeDocument(docId, docText, depth);
      setSummary(data.summary);
      setIsSelectingDepth(false);
      router.push("/result");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail || "Summarization failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(145deg, #FDF4D2 0%, #f5efd0 40%, #ede8d8 100%)" }}
    >
      {/* Subtle decorative blobs */}
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

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-5"
            style={{ background: "rgba(162,144,183,0.15)", color: "#7a6a8a", border: "1px solid rgba(162,144,183,0.3)" }}
          >
            <Sparkles size={13} />
            <span>Powered by Gemini 2.0 Flash Lite</span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-3 leading-tight"
            style={{ color: "#946D6D" }}
          >
            Document Summary
            <span style={{ color: "#A290B7" }}> Assistant</span>
          </h1>
          <p className="text-base md:text-lg" style={{ color: "#a08888" }}>
            Upload a PDF or image. Extract text instantly.
            <br />Generate AI-powered summaries at any depth.
          </p>
        </header>

        {/* Upload Card */}
        <div
          className="rounded-2xl p-6 mb-4 transition-all"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid rgba(176,205,230,0.5)",
            boxShadow: "0 8px 32px rgba(148,109,109,0.08), 0 1px 0 rgba(255,255,255,0.8) inset"
          }}
        >
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-6 text-center cursor-pointer transition-all mb-5"
            style={{
              border: `2px dashed ${isDragging ? "#A290B7" : "rgba(176,205,230,0.7)"}`,
              background: isDragging ? "rgba(162,144,183,0.08)" : "rgba(176,205,230,0.08)",
            }}
          >
            <div
              className="inline-flex p-3 rounded-full mb-3"
              style={{ background: "rgba(176,205,230,0.25)" }}
            >
              <FileText size={28} style={{ color: "#A290B7" }} />
            </div>
            {file ? (
              <div>
                <p className="font-semibold text-base" style={{ color: "#946D6D" }}>{file.name}</p>
                <p className="text-sm mt-1" style={{ color: "#b09898" }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-base" style={{ color: "#946D6D" }}>Click or drop your file here</p>
                <p className="text-sm mt-1" style={{ color: "#b09898" }}>PDF or Image (PNG, JPG)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
              id="file-upload-input"
            />
          </div>

          {/* Action Buttons */}
          {(file || currentText) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-400">
              {!isSelectingDepth ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExtractText}
                    disabled={isUploading || isSummarizing || (!!currentText && !!currentDocumentId)}
                    className="w-full font-medium py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: (!!currentText && !!currentDocumentId) ? "rgba(176,205,230,0.3)" : "rgba(176,205,230,0.5)",
                      color: "#5a7a96",
                      border: "1.5px solid rgba(176,205,230,0.6)",
                      opacity: (isUploading || isSummarizing) ? 0.6 : 1,
                      cursor: (!!currentText && !!currentDocumentId) ? "default" : "pointer"
                    }}
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploading ? "Extracting…" : (currentText && currentDocumentId) ? "Text Extracted ✓" : "Extract Text"}
                  </button>
                  <button
                    onClick={handleSummarizeClick}
                    disabled={isUploading || isSummarizing}
                    className="w-full font-semibold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm text-white"
                    style={{
                      background: "linear-gradient(135deg, #A290B7 0%, #8e7ba8 100%)",
                      boxShadow: "0 4px 15px rgba(162,144,183,0.4)",
                      opacity: (isUploading || isSummarizing) ? 0.6 : 1,
                    }}
                  >
                    <Sparkles size={16} />
                    Summarize
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-xl p-5 animate-in zoom-in-95 duration-200"
                  style={{ background: "rgba(176,205,230,0.15)", border: "1.5px solid rgba(176,205,230,0.4)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold" style={{ color: "#946D6D" }}>Select Summary Depth</h3>
                    <button
                      onClick={() => setIsSelectingDepth(false)}
                      className="text-xs underline underline-offset-2 transition-colors"
                      style={{ color: "#b09898" }}
                    >
                      Cancel
                    </button>
                  </div>

                  {isSummarizing || isUploading ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-3">
                      <Loader2 size={26} className="animate-spin" style={{ color: "#A290B7" }} />
                      <span className="text-sm" style={{ color: "#a08888" }}>
                        {isUploading ? "Extracting Text…" : "Generating Summary…"}
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "short", label: "Short", desc: "3–5 bullets" },
                        { key: "medium", label: "Medium", desc: "Comprehensive" },
                        { key: "long", label: "Detailed", desc: "Section-by-section" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => executeSummarize(opt.key)}
                          className="rounded-xl py-3 text-center flex flex-col items-center gap-1 transition-all group"
                          style={{
                            background: "rgba(255,255,255,0.7)",
                            border: "1.5px solid rgba(176,205,230,0.5)",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(162,144,183,0.15)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(162,144,183,0.6)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.7)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(176,205,230,0.5)";
                          }}
                        >
                          <span className="font-semibold text-sm" style={{ color: "#946D6D" }}>{opt.label}</span>
                          <span className="text-xs" style={{ color: "#b09898" }}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs" style={{ color: "#c4a8a8" }}>
          Your document is processed securely and never stored permanently.
        </p>
      </div>
    </main>
  );
}
