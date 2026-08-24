import { create } from 'zustand';

interface DocumentState {
    currentDocumentId: number | null;
    currentText: string | null;
    /** Cached summaries keyed by depth: 'concise' | 'medium' | 'detailed' */
    summaries: Record<string, string>;
    /** The depth that was used on the home page (first summary) */
    initialDepth: string;
    isUploading: boolean;
    isSummarizing: boolean;
    error: string | null;

    setDocumentData: (id: number, text: string) => void;
    setSummaryForDepth: (depth: string, summary: string) => void;
    setInitialDepth: (depth: string) => void;
    clearSummaries: () => void;
    setIsUploading: (isLoading: boolean) => void;
    setIsSummarizing: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useStore = create<DocumentState>((set) => ({
    currentDocumentId: null,
    currentText: null,
    summaries: {},
    initialDepth: 'medium',
    isUploading: false,
    isSummarizing: false,
    error: null,

    setDocumentData: (id, text) => set({
        currentDocumentId: id,
        currentText: text,
        summaries: {},
        error: null,
    }),
    setSummaryForDepth: (depth, summary) =>
        set((state) => ({ summaries: { ...state.summaries, [depth]: summary }, error: null })),
    setInitialDepth: (depth) => set({ initialDepth: depth }),
    clearSummaries: () => set({ summaries: {} }),
    setIsUploading: (isUploading) => set({ isUploading }),
    setIsSummarizing: (isSummarizing) => set({ isSummarizing }),
    setError: (error) => set({ error, isUploading: false, isSummarizing: false }),
}));
