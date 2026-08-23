"use client";

import { useState, useRef, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { uploadDocument, summarizeDocument } from "@/lib/api";
import { FileText, Loader2, Sparkles, Upload, ClipboardList, ChevronDown } from "lucide-react";

export default function Home() {
  const {
    currentDocumentId,
    currentText,
    currentSummary,
    isUploading,
    isSummarizing,
    error,
    setDocumentData,
    setSummary,
    setIsUploading,
    setIsSummarizing,
    setError,
  } = useStore();

  const [file, setFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<string>("medium");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
    }
  }, [setError]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const data = await uploadDocument(file);
      setDocumentData(data.document_id, data.text);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarize = async () => {
    if (!currentText || !currentDocumentId) return;
    setIsSummarizing(true);
    try {
      const data = await summarizeDocument(currentDocumentId, currentText, summaryLength);
      setSummary(data.summary);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Summarization failed. Please try again.");
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

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-6">
            <Sparkles size={14} />
            <span>Powered by Gemini 2.0 Flash Lite</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent mb-4">
            Document Summary Assistant
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Upload any PDF or image. Extract text instantly. Generate AI-powered summaries at any depth.
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-300 text-sm flex items-center gap-2">
            <span>&#9888;</span>
            <span>{error}</span>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Panel */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Upload size={16} className="text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold">Upload Document</h2>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-5 ${
                isDragging
                  ? "border-indigo-400 bg-indigo-500/10"
                  : "border-white/20 hover:border-indigo-500/50 hover:bg-white/5"
              }`}
            >
              <FileText className="mx-auto mb-3 text-slate-400" size={32} />
              {file ? (
                <div>
                  <p className="font-medium text-indigo-300 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-300 text-sm font-medium">Drop your file here</p>
                  <p className="text-slate-500 text-xs mt-1">PDF or Image (PNG, JPG)</p>
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

            <button
              id="extract-text-btn"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {isUploading ? "Extracting..." : "Extract Text"}
            </button>
          </div>

          {/* Summarize Panel */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold">Generate Summary</h2>
            </div>

            {/* Length Selector */}
            <div className="mb-5">
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Summary Depth</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "short", label: "Short", desc: "3-5 bullets" },
                  { key: "medium", label: "Medium", desc: "Comprehensive" },
                  { key: "long", label: "Detailed", desc: "Section-by-section" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    id={`summary-length-${opt.key}`}
                    onClick={() => setSummaryLength(opt.key)}
                    className={`rounded-xl py-2.5 px-3 text-center transition-all border ${
                      summaryLength === opt.key
                        ? "bg-violet-600/30 border-violet-500 text-violet-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="summarize-btn"
              onClick={handleSummarize}
              disabled={!currentText || !currentDocumentId || isSummarizing}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isSummarizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isSummarizing ? "Summarizing..." : "Summarize Document"}
            </button>
            {!currentText && (
              <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                <ChevronDown size={12} /> Extract text first to enable summarization
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-slate-400" />
              <h3 className="font-semibold text-slate-200">Extracted Text</h3>
              {currentText && (
                <span className="ml-auto text-xs text-slate-500">{currentText.length.toLocaleString()} chars</span>
              )}
            </div>
            <div className="h-72 overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {currentText || <span className="text-slate-600 italic">No text extracted yet. Upload a document above.</span>}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-violet-400" />
              <h3 className="font-semibold text-slate-200">AI Summary</h3>
              {currentSummary && (
                <span className="ml-auto text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">{summaryLength}</span>
              )}
            </div>
            <div className="h-72 overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {currentSummary || <span className="text-slate-600 italic">No summary generated yet. Generate one above.</span>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
