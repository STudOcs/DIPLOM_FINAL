// src/shared/api/base.ts
import axios from 'axios';

// Добавляем /api/v1 в конец
export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1';

export const $api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Интерцептор для автоматической подстановки токена
$api.interceptors.request.use((config) => {
    // ВАЖНО: Djoser сохраняет его как access_token (проверь authService)
    const token = localStorage.getItem('access_token'); 
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);