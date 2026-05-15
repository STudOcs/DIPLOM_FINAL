// src/shared/api/authService.ts
import { $api } from './base';
import { RegisterData, LoginResponse } from '../../entities/user/model/types';

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
  // Логин через OAuth2 (form-data)
  async login(loginValue: string, passwordValue: string): Promise<LoginResponse> {
    const params = new URLSearchParams();
    params.append('username', loginValue); // FastAPI ожидает именно 'username'
    params.append('password', passwordValue);

    const { data } = await $api.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    localStorage.setItem('token', data.access_token);
    return data;
  },

  // Регистрация (JSON)
  async register(data: RegisterData): Promise<any> {
    const response = await $api.post('/auth/register', data);
    return response.data;
  },

  async getTitleData(): Promise<TitleData> {
    const { data } = await $api.get<TitleData>('/auth/me/title-data');
    return data;
  },

  logout() {
    localStorage.removeItem('token');
  }
};