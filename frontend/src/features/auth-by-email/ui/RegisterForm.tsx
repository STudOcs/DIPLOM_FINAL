import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../shared/api/authService';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { RegisterData } from '../../../entities/user/model/types';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    student_group: '',
});

  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Шлем данные в Djoser (POST /api/v1/users/)
      await authService.register(formData);
      alert('Регистрация прошла успешно! Теперь вы можете войти.');
      navigate('/login');
    } catch (err: any) {
      // Djoser возвращает ошибки в виде объекта { field: ["error message"] }
      const responseData = err.response?.data;
      if (responseData) {
        const firstError = Object.values(responseData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : 'Ошибка регистрации');
      } else {
        setError('Сервер недоступен');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-2xl p-8 bg-white shadow-xl rounded-2xl">
      <h2 className="text-2xl font-bold text-center">Регистрация СФУ.ДОК</h2>
      
      {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Логин" value={formData.username} onChange={e => handleChange('username', e.target.value)} required />
        <Input label="Email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
      </div>

      <Input label="Пароль" type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} required />

      <div className="grid grid-cols-3 gap-4">
        <Input label="Фамилия" value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} required />
        <Input label="Имя" value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} required />
        <Input label="Отчество" value={formData.middle_name} onChange={e => handleChange('middle_name', e.target.value)} required />
      </div>

      <Input label="Группа (СФУ)" placeholder="КИ22-14Б" value={formData.student_group} onChange={e => handleChange('student_group', e.target.value)} required />

      <Button type="submit" disabled={isLoading}>{isLoading ? 'Загрузка...' : 'Создать аккаунт'}</Button>
    </form>
  );
};