// src/entities/user/model/types.ts
export interface UserProfile {
  user_id: number;
  login: string;
  email: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  group_name: string;
  student_card: string;
  department: string;
  registration_date: string;
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
  email: string;
  login: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  group_name: string;
  student_card: string;
  department: string;
  password: string;
}

// Данные для обновления (PATCH запрос)
// Partial делает все поля необязательными, так как мы отправляем только "дельту"
export interface UpdateProfileDto extends Partial<UserProfile> {
  password?: string;
}

// Ответ при логине
export interface LoginResponse {
  access_token: string;
  token_type: string;
} 