import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../shared/api/authService';
import { userService } from '../../../shared/api/userService';
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
    re_password: '',
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

    if (formData.password !== formData.re_password) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('REGISTER PAYLOAD:', formData);

      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        re_password: formData.re_password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        student_group: formData.student_group,
      });

      await authService.login(formData.email, formData.password);

      await userService.updateMe({
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        student_group: formData.student_group,
      });

      alert('Регистрация прошла успешно!');
      navigate('/dashboard');
    } catch (err: any) {
      const serverErrors = err.response?.data;

      if (serverErrors) {
        const errorMessages = Object.entries(serverErrors)
          .map(([field, messages]) =>
            `${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`
          )
          .join(' | ');

        setError(errorMessages);
      } else {
        setError('Произошла неизвестная ошибка');
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

      <div className="grid grid-cols-2 gap-4">
        <Input 
            label="Пароль" 
            type="password" 
            value={formData.password} 
            onChange={e => handleChange('password', e.target.value)} 
            required 
        />
        <Input 
            label="Повторите пароль" 
            type="password" 
            value={formData.re_password} 
            onChange={e => handleChange('re_password', e.target.value)} 
            required 
        />
      </div>

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