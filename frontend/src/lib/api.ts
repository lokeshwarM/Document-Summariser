import axios from 'axios';

// Ensure this matches the FastAPI backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const summarizeDocument = async (text: string, length: string = 'medium') => {
    const response = await api.post('/summarize', { text, length });
    return response.data;
};

export default api;
