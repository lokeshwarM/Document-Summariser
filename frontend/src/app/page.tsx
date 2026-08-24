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
    setIsSelectingDepth(false); // Reset depth selection when a new file is uploaded
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      handleFile(dropped);
    }
  };

  const handleExtractText = async () => {
    if (!file) return;
    // If text is already extracted for this document, just switch to the tab
    if (currentDocumentId && currentText) {
      router.push('/result');
      return;
    }
    setIsUploading(true);
    try {
      const data = await uploadDocument(file);
      setDocumentData(data.document_id, data.text);
      router.push('/result');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail || "Upload failed. Please try again."; setError(msg); toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarizeClick = () => {
    setIsSelectingDepth(true);
  };

  const executeSummarize = async (depth: string) => {
    if (!file && !currentDocumentId) return;
    
    let docId = currentDocumentId;
    let docText = currentText;

    // Auto-extract if not already done
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
        const msg = e.response?.data?.detail || "Upload failed. Please try again."; setError(msg); toast.error(msg);
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
      setIsSelectingDepth(false); // Hide the depth selector after success
      router.push('/result');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail || "Summarization failed. Please try again."; setError(msg); toast.error(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-6">
            <Sparkles size={14} />
            <span>Powered by Gemini 2.0 Flash Lite</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent mb-4">
            Document Summary Assistant
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto px-4">
            Upload any PDF or image. Extract text instantly. Generate AI-powered summaries at any depth.
          </p>
        </header>



        {/* Input Panel */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 md:p-5 md:p-8 mb-8 hover:border-indigo-500/40 transition-colors shadow-xl">
          
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 md:p-10 text-center cursor-pointer transition-all mb-6 ${
              isDragging
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-white/20 hover:border-indigo-500/50 hover:bg-white/5"
            }`}
          >
            <FileText className="mx-auto mb-3 text-slate-400" size={36} />
            {file ? (
              <div>
                <p className="font-medium text-indigo-300 text-base">{file.name}</p>
                <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-300 text-base font-medium">Click or drop your file here</p>
                <p className="text-slate-500 text-sm mt-2">PDF or Image (PNG, JPG)</p>
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
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              
              {!isSelectingDepth ? (
                /* Primary Actions: Extract & Summarize */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleExtractText}
                    disabled={isUploading || isSummarizing || (!!currentText && !!currentDocumentId)}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:bg-slate-800 disabled:border-transparent disabled:text-slate-500 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {isUploading ? "Extracting..." : (currentText && currentDocumentId) ? "Text Extracted" : "Extract Text"}
                  </button>
                  <button
                    onClick={handleSummarizeClick}
                    disabled={isUploading || isSummarizing}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} />
                    Summarize
                  </button>
                </div>
              ) : (
                /* Depth Selection Options */
                <div className="bg-black/20 rounded-xl p-6 border border-white/5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-300">Select Summary Depth:</h3>
                    <button 
                      onClick={() => setIsSelectingDepth(false)}
                      className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {isSummarizing || isUploading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <Loader2 size={28} className="animate-spin text-violet-500" />
                      <span className="text-slate-400 text-sm">{isUploading ? "Extracting Text..." : "Generating Summary..."}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "short", label: "Short", desc: "3-5 bullets" },
                        { key: "medium", label: "Medium", desc: "Comprehensive" },
                        { key: "long", label: "Detailed", desc: "Section-by-section" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => executeSummarize(opt.key)}
                          className="bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 text-slate-300 py-4 rounded-xl transition-all text-center flex flex-col items-center justify-center gap-1 group"
                        >
                          <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">{opt.label}</span>
                          <span className="text-xs text-slate-500 group-hover:text-violet-400/70">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

              </div>
    </main>
  );
}
