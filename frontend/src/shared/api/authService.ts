// src/shared/api/authService.ts
import { $api } from './base';
import { RegisterData, LoginResponse, UserProfile } from '../../entities/user/model/types';

export interface TitleData {
  last_name: string;
  first_name: string;
  middle_name: string;
  initials: string;
  group: string;
  student_card: string;
  department: string;
}

export const authService = {
async register(data: RegisterData) {
        return $api.post('/users/users/', data); // путь по твоему гайду
    },

    // Логин: Djoser/JWT ожидает JSON
    async login(username: string, password: string): Promise<LoginResponse> {
        const { data } = await $api.post<LoginResponse>('/users/jwt/create/', { 
            username, 
            password 
        });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return data;
    },

    async getMe(): Promise<UserProfile> {
        const { data } = await $api.get<UserProfile>('/users/users/me/');
        return data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};