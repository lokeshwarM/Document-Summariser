'use client';

import React, { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getUserDocuments } from '@/lib/api';
import { Sparkles, FileText, ArrowLeft, Loader2, Clock } from 'lucide-react';

interface DocumentRecord {
  id: number;
  filename: string;
  file_type: string;
  created_at: string;
  summaries: { summary_length: string; content: string }[];
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { setDocumentData, setSummaryForDepth, setInitialDepth } = useStore();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    getUserDocuments(user.id)
      .then((data) => setDocuments(data.documents || []))
      .catch(() => setError('Failed to load document history.'))
      .finally(() => setIsLoading(false));
  }, [isLoaded, user]);

  const handleReopen = (doc: DocumentRecord) => {
    const firstSummary = doc.summaries?.[0];
    if (firstSummary) {
      setDocumentData(doc.id, '');
      setSummaryForDepth(firstSummary.summary_length, firstSummary.content);
      setInitialDepth(firstSummary.summary_length);
      router.push('/result');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#FAF3E1' }}>
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border-2 border-[#222222] bg-[#F5E7C6] text-[#222222] hover:-translate-y-1 transition-transform"
            style={{ boxShadow: '2px 2px 0px #222222' }}
          >
            <ArrowLeft size={16} /> New Document
          </button>
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#222222] text-sm hidden sm:block">
              Welcome, {user?.firstName || 'there'}!
            </span>
            <UserButton />
          </div>
        </div>

        {/* Title */}
        <div className="rounded-2xl border-4 border-[#222222] bg-[#FF6D1F] p-5 md:p-8"
             style={{ boxShadow: '6px 6px 0px #222222' }}>
          <h1 className="text-2xl md:text-3xl font-black text-[#222222]">Document History</h1>
          <p className="text-sm font-medium mt-1 text-[#222222] opacity-80">
            All your previously processed documents, saved and ready to re-read.
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border-4 border-[#222222] bg-[#FAF3E1] overflow-hidden"
             style={{ boxShadow: '6px 6px 0px #222222' }}>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 p-16">
              <Loader2 size={32} className="animate-spin text-[#FF6D1F]" />
              <span className="font-bold text-[#222222]">Loading history...</span>
            </div>
          ) : error ? (
            <div className="p-10 text-center font-bold text-red-600">{error}</div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 opacity-50">
              <FileText size={48} className="text-[#222222]" />
              <p className="font-bold text-[#222222]">No documents yet. Upload your first one!</p>
            </div>
          ) : (
            <div className="divide-y-4 divide-[#222222]">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-4 p-4 md:p-5 hover:bg-[#F5E7C6] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl border-2 border-[#222222] bg-[#F5E7C6] flex-shrink-0">
                      <FileText size={20} className="text-[#FF6D1F]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#222222] truncate text-sm">{doc.filename}</p>
                      <p className="flex items-center gap-1 text-xs font-medium opacity-60 text-[#222222] mt-0.5">
                        <Clock size={11} />
                        {new Date(doc.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReopen(doc)}
                    disabled={!doc.summaries?.length}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#222222] bg-[#FF6D1F] text-[#222222] disabled:opacity-40 hover:-translate-y-0.5 transition-transform"
                    style={{ boxShadow: '2px 2px 0px #222222' }}
                  >
                    <Sparkles size={14} /> View Summary
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
