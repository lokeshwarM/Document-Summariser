import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const summarizeDocument = async (document_id: number, text: string, length: string = 'medium') => {
    const response = await axios.post(`${API_URL}/summarize`, {
        document_id,
        text,
        length,
    });
    return response.data;
};


export const askDocumentQuestion = async (document_id: number, message: string, history: {role: string, content: string}[]) => {
    const response = await axios.post(`${API_URL}/chat`, {
        document_id,
        message,
        history,
    });
    return response.data;
};
