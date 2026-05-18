// src/entities/user/model/types.ts
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  student_group: string;
}

export interface UserUpdatePayload {
  email?: string;
  password?: string;
  last_name?: string;
  first_name?: string;
  middle_name?: string;
  group_name?: string;
  student_card?: string;
  department?: string;
}

export interface RegisterData {
  // Поля, которые требует Djoser (POST /api/v1/users/users/)
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  student_group: string;
}

// Данные для обновления (PATCH запрос)
// Partial делает все поля необязательными, так как мы отправляем только "дельту"
export interface UpdateProfileDto extends Partial<UserProfile> {
  password?: string;
}

// Ответ при логине
export interface LoginResponse {
  access: string;  // Djoser возвращает "access"
  refresh: string; // и "refresh"
}