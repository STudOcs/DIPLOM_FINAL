// src/shared/api/userService.ts
import { $api } from './base';
import { UserProfile, UpdateProfileDto, UserUpdatePayload } from '../../entities/user/model/types';

export const userService = {
    // Получение данных текущего пользователя
    async getProfile(): Promise<UserProfile> {
        const { data } = await $api.get<UserProfile>('/user/profile/');
        return data;
    },

    // Частичное обновление профиля
    async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
        const { data } = await $api.patch<UserProfile>('/user/profile/', dto);
        return data;
    },

    async getMe(): Promise<UserProfile> {
        const { data } = await $api.get<UserProfile>('/users/users/me/');
        return data;
    },

    async updateMe(payload: UserUpdatePayload): Promise<UserProfile> {
        const { data } = await $api.patch<UserProfile>('/users/users/me/', payload);
        return data;
    }
};