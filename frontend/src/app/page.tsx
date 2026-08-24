'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useStore } from '@/store/useStore';
import { uploadDocument, summarizeDocument } from '@/lib/api';
import { FileText, Upload, Sparkles, Loader2, LayoutDashboard } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectingDepth, setIsSelectingDepth] = useState(false);

  const {
    currentDocumentId,
    currentText,
    isUploading,
    isSummarizing,
    setDocumentData,
    setSummaryForDepth,
    setInitialDepth,
    clearSummaries,
    setIsUploading,
    setIsSummarizing,
    setError,
  } = useStore();

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('image')) {
      toast.error("Please upload a PDF or Image file.");
      return;
    }
    // Reset all prior document state so old summaries never bleed through
    clearSummaries();
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail || "Upload failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarizeClick = () => {
    setIsSelectingDepth(true);
  };

  const executeSummarize = async (depth: string) => {
    let docId = currentDocumentId;
    let docText = currentText;
    setIsSummarizing(true);

    if (!docId || !docText) {
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
    try {
      const data = await summarizeDocument(docId, docText, depth);
      setSummaryForDepth(depth, data.summary);
      setInitialDepth(depth);
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
    <main className="min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />

      {/* Auth Nav Bar */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        {isSignedIn ? (
          <>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#222222] bg-[#F5E7C6] text-[#222222] hover:-translate-y-0.5 transition-transform"
              style={{ boxShadow: '2px 2px 0px #222222' }}
            >
              <LayoutDashboard size={14} /> History
            </button>
            <UserButton />
          </>
        ) : (
          <SignInButton mode="modal">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#222222] bg-[#FF6D1F] text-[#222222] hover:-translate-y-0.5 transition-transform"
              style={{ boxShadow: '2px 2px 0px #222222' }}>
              Sign In
            </button>
          </SignInButton>
        )}
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        
        <header className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full mb-6 font-medium text-xs border-2 border-[#222222] text-[#222222] bg-[#F5E7C6]">
            <Sparkles size={13} />
            <span>Powered by Gemini 3.5 Flash Lite</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight tracking-tight text-[#222222]">
            Document Summary<br/>
            <span className="text-[#FF6D1F]">Assistant</span>
          </h1>
          <p className="text-base md:text-lg font-medium opacity-80 text-[#222222]">
            Upload a PDF or image. Extract text instantly.<br/>Generate AI-powered summaries at any depth.
          </p>
          {isSignedIn && (
            <p className="text-xs font-bold mt-3 text-[#FF6D1F]">
              &#x2713; Your document history is being saved, {user?.firstName}!
            </p>
          )}
        </header>

        <div className="w-full rounded-2xl p-6 mb-4 transition-all border-4 border-[#222222] bg-[#F5E7C6]"
             style={{ boxShadow: '6px 6px 0px #222222' }}>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer transition-all mb-6 border-2 border-dashed"
            style={{ 
              borderColor: isDragging ? '#FF6D1F' : '#222222', 
              background: isDragging ? 'rgba(255, 109, 31, 0.1)' : '#FAF3E1' 
            }}
          >
            <div className="inline-flex p-3 rounded-xl mb-4 border-2 border-[#222222] bg-[#F5E7C6]">
              <FileText size={28} className="text-[#FF6D1F]" />
            </div>
            {file ? (
              <div>
                <p className="font-bold text-lg text-[#222222]">{file.name}</p>
                <p className="text-sm font-medium opacity-70 text-[#222222]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-lg text-[#222222]">Click or drop your file here</p>
                <p className="text-sm font-medium opacity-70 mt-1 text-[#222222]">PDF or Image (PNG, JPG)</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="file-upload-input" />
          </div>

          {(file || currentText) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-400">
              {!isSelectingDepth ? (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleExtractText} disabled={isUploading || isSummarizing || (!!currentText && !!currentDocumentId)}
                    className="w-full font-bold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border-2 hover:-translate-y-1 active:translate-y-0 border-[#222222] text-[#222222]"
                    style={{
                      background: (!!currentText && !!currentDocumentId) ? '#F5E7C6' : '#FAF3E1',
                      boxShadow: (!!currentText && !!currentDocumentId) ? 'none' : '3px 3px 0px #222222',
                      opacity: (isUploading || isSummarizing) ? 0.6 : 1,
                      cursor: (!!currentText && !!currentDocumentId) ? 'default' : 'pointer'
                    }}>
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploading ? "Extracting..." : (currentText && currentDocumentId) ? "Text Extracted \u2713" : "Extract Text"}
                  </button>
                  <button onClick={handleSummarizeClick} disabled={isUploading || isSummarizing}
                    className="w-full font-bold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border-2 hover:-translate-y-1 active:translate-y-0 border-[#222222] bg-[#FF6D1F] text-[#222222]"
                    style={{ boxShadow: '3px 3px 0px #222222', opacity: (isUploading || isSummarizing) ? 0.6 : 1 }}>
                    <Sparkles size={16} /> Summarize
                  </button>
                </div>
              ) : (
                <div className="rounded-xl p-5 border-2 animate-in zoom-in-95 duration-200 border-[#222222] bg-[#FAF3E1]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#222222]">Select Depth</h3>
                    <button onClick={() => setIsSelectingDepth(false)} className="text-xs font-bold underline underline-offset-2 hover:text-[#FF6D1F] transition-colors text-[#222222]">
                      Cancel
                    </button>
                  </div>
                  {(isSummarizing || isUploading) ? (
                    <div className="py-6 flex flex-col items-center gap-3">
                      <Loader2 size={26} className="animate-spin text-[#FF6D1F]" />
                      <span className="text-sm font-bold text-[#222222]">
                        {isUploading ? "Extracting Text..." : "Generating Summary..."}
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[ 
                        { key: "concise", label: "Concise", desc: "3-5 bullets" },
                        { key: "medium", label: "Medium", desc: "Comprehensive" },
                        { key: "detailed", label: "Detailed", desc: "Section-by-section" }
                      ].map((opt) => (
                        <button key={opt.key} onClick={() => executeSummarize(opt.key)}
                          className="rounded-xl py-3 px-2 text-center flex flex-col items-center gap-1 transition-all border-2 hover:-translate-y-1 active:translate-y-0 border-[#222222] bg-[#F5E7C6]"
                          style={{ boxShadow: '2px 2px 0px #222222' }}>
                          <span className="font-bold text-sm text-[#222222]">{opt.label}</span>
                          <span className="text-xs font-medium opacity-80 text-[#222222]">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-center text-xs font-medium opacity-60 text-[#222222]">
          {isSignedIn ? 'Documents saved to your account.' : 'Sign in to save your document history across sessions.'}
        </p>
      </div>
    </main>
  );
}
