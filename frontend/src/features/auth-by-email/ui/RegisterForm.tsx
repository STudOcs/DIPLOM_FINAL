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
    email: '',
    login: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    group_name: '',
    student_card: '',
    department: '',
    password: '',
  });

  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(formData);
      alert('Регистрация успешна! Теперь вы можете войти.');
      navigate('/login');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Ошибка валидации данных. Проверьте зачетку и группу.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl p-8 bg-white shadow-2xl rounded-3xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-orange-600 tracking-tighter">СФУ.ДОК</h2>
        <p className="text-gray-500 mt-2 font-medium">Создание аккаунта студента</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-shake">
          {error}
        </div>
      )}

      {/* ГРУППА: Аккаунт */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Данные входа</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Логин" placeholder="ivanov_2025" value={formData.login} onChange={e => handleChange('login', e.target.value)} required />
          <Input label="Email" type="email" placeholder="user@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
        </div>
        <Input label="Пароль" type="password" placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} required />
      </div>

      {/* ГРУППА: Личные данные */}
      <div className="space-y-4 pt-4 border-t border-gray-50">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Личные данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Фамилия" placeholder="Иванов" value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} required />
          <Input label="Имя" placeholder="Иван" value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} required />
          <Input label="Отчество" placeholder="Иванович" value={formData.middle_name} onChange={e => handleChange('middle_name', e.target.value)} />
        </div>
      </div>

      {/* ГРУППА: Учеба */}
      <div className="space-y-4 pt-4 border-t border-gray-50">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Учебные данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Группа" placeholder="КИ22-14Б" value={formData.group_name} onChange={e => handleChange('group_name', e.target.value)} required />
          <Input label="Номер зачетки" placeholder="032213102" value={formData.student_card} onChange={e => handleChange('student_card', e.target.value)} required />
        </div>
        <Input label="Кафедра" placeholder="Кафедра вычислительной техники" value={formData.department} onChange={e => handleChange('department', e.target.value)} />
      </div>

      <div className="pt-6">
        <Button type="submit" disabled={isLoading} className="h-12 text-lg shadow-lg shadow-orange-200">
          {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Уже есть аккаунт? <Link to="/login" className="text-orange-600 font-bold hover:underline">Войти</Link>
      </p>
    </form>
  );
};