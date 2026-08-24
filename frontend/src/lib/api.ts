import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const uploadDocument = async (file: File, clerkUserId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (clerkUserId) formData.append('clerk_user_id', clerkUserId);
    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const summarizeDocument = async (document_id: number, text: string, length: string = 'medium') => {
    const response = await axios.post(`${API_URL}/summarize`, { document_id, text, length });
    return response.data;
};

/**
 * Streams a summary via SSE. Calls onChunk for every text token received.
 * Returns a promise that resolves when streaming is complete.
 */
export const streamSummarize = (
    document_id: number,
    length: string,
    onChunk: (chunk: string) => void
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}/summarize/stream?document_id=${document_id}&length=${length}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (e) => {
            if (e.data === '[DONE]') {
                eventSource.close();
                resolve();
            } else if (e.data.startsWith('[ERROR]')) {
                eventSource.close();
                reject(new Error(e.data.replace('[ERROR] ', '')));
            } else {
                onChunk(e.data);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            reject(new Error('Streaming connection failed'));
        };
    });
};

export const askDocumentQuestion = async (document_id: number, message: string, history: {role: string, content: string}[]) => {
    const response = await axios.post(`${API_URL}/chat`, { document_id, message, history });
    return response.data;
};

export const getUserDocuments = async (userId: string) => {
    const response = await axios.get(`${API_URL}/documents?user_id=${userId}`);
    return response.data;
};
