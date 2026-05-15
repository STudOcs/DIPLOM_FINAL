// src/features/auth-by-email/ui/LoginForm.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../shared/api/authService';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';

export const LoginForm = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(login, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
      <div className="text-center">
        <h2 className="text-3xl font-black text-orange-600">СФУ.ДОК</h2>
        <p className="text-gray-500 mt-2">Вход в систему</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <Input label="Логин" value={login} onChange={e => setLogin(e.target.value)} required />
      <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

      <Button type="submit" disabled={isLoading}>{isLoading ? 'Вход...' : 'Войти'}</Button>

      <p className="text-center text-sm text-gray-500">
        Нет аккаунта? <Link to="/register" className="text-orange-600 font-bold hover:underline">Создать</Link>
      </p>
    </form>
  );
};