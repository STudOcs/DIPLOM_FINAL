// src/pages/profile/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, MessageCircle } from 'lucide-react';
import { userService } from '../../shared/api/userService';
import { UserProfile, UserUpdatePayload } from '../../entities/user/model/types';
import { Input } from '../../shared/ui/Input';
import { Button } from '../../shared/ui/Button';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Локальное состояние полей (включая пароль)
  const [formData, setFormData] = useState<UserUpdatePayload & { password?: string }>({});

  useEffect(() => {
    userService.getMe()
      .then(data => {
        setUser(data);
        setFormData(data); // Инициализируем форму текущими данными
      })
      .catch(() => alert("Ошибка загрузки профиля"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Удаляем пустой пароль, чтобы не менять его на бэкенде
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      const updated = await userService.updateMe(payload);
      setUser(updated);
      alert("Данные успешно сохранены!");
    } catch (err) {
      alert("Ошибка при сохранении данных");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 custom-scrollbar">
      <header className="h-16 bg-white border-b flex items-center px-6 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Профиль студента</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-10 px-4">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Блок 1: Личные данные */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Личные данные</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Фамилия" value={formData.last_name || ''} onChange={e => setFormData({...formData, last_name: e.target.value})} />
              <Input label="Имя" value={formData.first_name || ''} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              <Input label="Отчество" value={formData.middle_name || ''} onChange={e => setFormData({...formData, middle_name: e.target.value})} />
            </div>
          </div>

          {/* Блок 2: Учебные данные */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Учеба</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Группа" value={formData.group_name || ''} onChange={e => setFormData({...formData, group_name: e.target.value})} />
              <Input label="Номер зачетки" value={formData.student_card || ''} onChange={e => setFormData({...formData, student_card: e.target.value})} />
              <div className="md:col-span-2">
                <Input label="Кафедра" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Блок 3: Аккаунт */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Настройки аккаунта</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Новый пароль" type="password" placeholder="Введите для смены" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <p className="mt-4 text-xs text-gray-400 italic">Дата регистрации: {new Date(user?.registration_date || '').toLocaleDateString()}</p>
          </div>

          <div className="flex justify-end gap-4 items-center">
            <Button type="submit" disabled={isSaving} className="w-auto px-8">
              {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
              Сохранить изменения
            </Button>
          </div>
        </form>

        {/* Обратная связь */}
        <div className="mt-12 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <MessageCircle className="text-orange-600" size={32} />
                <div>
                    <h3 className="font-bold text-orange-900">Нашли ошибку?</h3>
                    <p className="text-sm text-orange-700">Сообщите нам через форму обратной связи</p>
                </div>
            </div>
            <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLScuvUkGg41Uax6eSm3YTB7dLTbKV4ZTZwObdqewu5MvkJ1D3w/viewform?usp=publish-editor"
                target="_blank" rel="noreferrer"
                className="bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-600 hover:text-white transition-all"
            >
                Заполнить форму
            </a>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;