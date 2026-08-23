"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uploadDocument, summarizeDocument } from "@/lib/api";

export default function Home() {
  const { currentText, currentSummary, isLoading, error, setText, setSummary, setLoading, setError } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<string>("medium");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await uploadDocument(file);
      setText(data.text);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!currentText) return;
    setLoading(true);
    try {
      const data = await summarizeDocument(currentText, summaryLength);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto font-[family-name:var(--font-geist-sans)]">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Document Summary Assistant</h1>
        <p className="text-gray-600">Upload a PDF or Image, extract text, and generate AI summaries instantly.</p>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <section className="border p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">1. Upload Document</h2>
          <input 
            type="file" 
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4 block w-full border border-gray-200 p-2 rounded-md"
          />
          <button 
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
          >
            {isLoading ? "Processing..." : "Extract Text"}
          </button>
        </section>

        {/* Summarize Section */}
        <section className="border p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">2. Generate Summary</h2>
          <select 
            value={summaryLength}
            onChange={(e) => setSummaryLength(e.target.value)}
            className="mb-4 block w-full border border-gray-200 p-2 rounded-md bg-white"
          >
            <option value="short">Short (3-5 bullets)</option>
            <option value="medium">Medium (Comprehensive)</option>
            <option value="long">Long (Detailed Section-by-Section)</option>
          </select>
          <button 
            onClick={handleSummarize}
            disabled={!currentText || isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
          >
            {isLoading ? "Processing..." : "Summarize Document"}
          </button>
        </section>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border p-6 rounded-xl shadow-sm bg-gray-50 h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Extracted Text:</h3>
          <p className="text-sm whitespace-pre-wrap">{currentText || "No text extracted yet."}</p>
        </div>
        <div className="border p-6 rounded-xl shadow-sm bg-blue-50 h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">AI Summary:</h3>
          <p className="text-sm whitespace-pre-wrap">{currentSummary || "No summary generated yet."}</p>
        </div>
      </div>
    </main>
  );
}
