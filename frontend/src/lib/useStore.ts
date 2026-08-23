import { create } from 'zustand';

interface DocumentState {
    currentDocumentId: number | null;
    currentText: string | null;
    currentSummary: string | null;
    isUploading: boolean;
    isSummarizing: boolean;
    error: string | null;

    setDocumentData: (id: number, text: string) => void;
    setSummary: (summary: string) => void;
    setIsUploading: (isLoading: boolean) => void;
    setIsSummarizing: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useStore = create<DocumentState>((set) => ({
    currentDocumentId: null,
    currentText: null,
    currentSummary: null,
    isUploading: false,
    isSummarizing: false,
    error: null,

    setDocumentData: (id, text) => set({ currentDocumentId: id, currentText: text, error: null }),
    setSummary: (summary) => set({ currentSummary: summary, error: null }),
    setIsUploading: (isUploading) => set({ isUploading }),
    setIsSummarizing: (isSummarizing) => set({ isSummarizing }),
    setError: (error) => set({ error, isUploading: false, isSummarizing: false }),
}));
