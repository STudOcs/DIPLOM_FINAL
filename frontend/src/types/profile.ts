export interface Institute {
  id: number;
  name: string;
  departments: string[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  middleName: string;
  instituteId: number;
  group: string;
  department: string;
  studentId: string;
  email: string;
  phone?: string;
}

export interface ProfileFormData extends Omit<UserProfile, 'instituteId'> {
  instituteId: string;
}