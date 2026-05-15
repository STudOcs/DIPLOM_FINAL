import { RegisterForm } from '../../features/auth-by-email/ui/RegisterForm';

export const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 overflow-y-auto">
      <RegisterForm />
    </div>
  );
};