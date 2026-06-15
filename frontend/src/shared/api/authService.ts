// src/shared/api/authService.ts
import { $api } from './base';
import { RegisterData, LoginResponse, UserProfile, UserUpdatePayload } from '../../entities/user/model/types';

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
        return $api.post('/users/users/', data);
    },

    // Логин: Djoser/JWT ожидает JSON
    async login(loginValue: string, passwordValue: string): Promise<LoginResponse> {
        const { data } = await $api.post<LoginResponse>('/users/jwt/create/', { 
            email: loginValue,
            password: passwordValue
        });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return data;
    },

    async getMe(): Promise<UserProfile> {
        const { data } = await $api.get<UserProfile>('/users/users/me/');
        return data;
    },
    
    async updateMe(payload: UserUpdatePayload): Promise<UserProfile> {
        const { data } = await $api.patch<UserProfile>('/users/users/me/', payload);
        return data;
    },

    async getTitleData(): Promise<UserProfile> {
        return this.getMe();
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};