import { create } from 'zustand';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

interface DocumentState {
    currentDocumentId: number | null;
    currentText: string | null;
    summaries: Record<string, string>;
    chatHistory: ChatMessage[];
    initialDepth: string;
    isUploading: boolean;
    isSummarizing: boolean;
    error: string | null;

    setDocumentData: (id: number, text: string) => void;
    setSummaryForDepth: (depth: string, summary: string) => void;
    appendToSummary: (depth: string, chunk: string) => void;
    setInitialDepth: (depth: string) => void;
    addChatMessage: (msg: ChatMessage) => void;
    clearChatHistory: () => void;
    clearSummaries: () => void;
    setIsUploading: (isLoading: boolean) => void;
    setIsSummarizing: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useStore = create<DocumentState>((set) => ({
    currentDocumentId: null,
    currentText: null,
    summaries: {},
    chatHistory: [],
    initialDepth: 'medium',
    isUploading: false,
    isSummarizing: false,
    error: null,

    setDocumentData: (id, text) => set({
        currentDocumentId: id,
        currentText: text,
        summaries: {},
        chatHistory: [],
        error: null,
    }),
    setSummaryForDepth: (depth, summary) =>
        set((state) => ({ summaries: { ...state.summaries, [depth]: summary }, error: null })),
    appendToSummary: (depth, chunk) =>
        set((state) => ({
            summaries: {
                ...state.summaries,
                [depth]: (state.summaries[depth] || '') + chunk,
            }
        })),
    setInitialDepth: (depth) => set({ initialDepth: depth }),
    addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
    clearChatHistory: () => set({ chatHistory: [] }),
    clearSummaries: () => set({ summaries: {} }),
    setIsUploading: (isUploading) => set({ isUploading }),
    setIsSummarizing: (isSummarizing) => set({ isSummarizing }),
    setError: (error) => set({ error, isUploading: false, isSummarizing: false }),
}));
