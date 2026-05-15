import { LoginForm } from '../../features/auth-by-email/ui/LoginForm';

const AuthPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Декоративный элемент с логотипом СФУ на фоне (опционально) */}
      <div className="absolute top-10 left-10 opacity-10 pointer-events-none text-6xl font-black">
        СФУ.ДОК
      </div>
      
      <LoginForm />
    </div>
  );
};

export default AuthPage;