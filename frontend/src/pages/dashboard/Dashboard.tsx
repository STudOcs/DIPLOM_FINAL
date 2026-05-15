// src/pages/dashboard/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'; // Иконки
import { DocumentList } from '../../widgets/document-list/ui/DocumentList';
import { authService } from '../../shared/api/authService';
import { userService } from '../../shared/api/userService'; // Импорт сервиса
import { UserProfile } from '../../entities/user/model/types'; // Импорт типа

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);


  useEffect(() => {
    userService.getMe()
      .then(data => {
        console.log("Данные профиля получены:", data); // Отладка в консоли
        setUserProfile(data);
      })
      .catch(err => {
        console.error("Ошибка загрузки профиля:", err);
        // Если ошибка 401, интерцептор сам выкинет на логин, 
        // но здесь можно добавить уведомление
      });
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Генерируем отображаемое имя и инициалы
  const displayName = userProfile 
    ? `${userProfile.last_name} ${userProfile.first_name[0] || ''}.` 
    : 'Загрузка...';
    
  const initials = userProfile 
    ? `${userProfile.last_name[0] || ''}${userProfile.first_name[0] || ''}` 
    : '??';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Обновленная Шапка */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold">С</div>
            <span className="font-bold text-xl tracking-tight text-gray-900">СФУ.ДОК</span>
          </div>

          {/* Меню пользователя */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-50 rounded-full transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-none">{displayName}</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">студент</p>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Выпадающий список */}
            {isMenuOpen && (
              <>
                {/* Подложка для закрытия меню при клике вне его */}
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  <button 
                    onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <User size={16} />
                    Профиль
                  </button>
                  <button 
                    onClick={() => { /* функционал настроек */ setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <Settings size={16} />
                    Настройки
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мои документы</h1>
            <p className="text-gray-500 text-sm">Управление вашими учебными работами</p>
          </div>
        </div>

        <DocumentList />
      </main>
    </div>
  );
};

export default Dashboard;