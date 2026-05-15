// src/shared/api/base.ts
import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const $api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Интерцептор для автоматической подстановки токена
$api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Интерцептор для обработки ошибок (например, 401 - токен просрочен)
$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);