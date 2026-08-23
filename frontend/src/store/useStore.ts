// pyrefly: ignore [missing-import]
import { create } from 'zustand';

interface DocumentState {
    currentText: string | null;
    currentSummary: string | null;
    isLoading: boolean;
    error: string | null;

    setText: (text: string) => void;
    setSummary: (summary: string) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useStore = create<DocumentState>((set) => ({
    currentText: null,
    currentSummary: null,
    isLoading: false,
    error: null,

    setText: (text) => set({ currentText: text, error: null }),
    setSummary: (summary) => set({ currentSummary: summary, error: null }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
}));
