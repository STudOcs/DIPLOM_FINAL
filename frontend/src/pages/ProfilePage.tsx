import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Определяем интерфейсы внутри файла
interface Institute {
  id: number;
  name: string;
  departments: string[];
}

interface UserProfile {
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

interface ProfilePageProps {
  // Можно добавить пропсы при необходимости
}

const ProfilePage: React.FC<ProfilePageProps> = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: 'Иванович',
    instituteId: 1,
    group: 'КИ22-148',
    department: 'Информационные системы',
    studentId: '24-03213102',
    email: 'student@sfu-kras.ru',
    phone: '+7 (999) 123-45-67'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const institutes: Institute[] = [
    {
      id: 1,
      name: 'Институт космических и информационных технологий',
      departments: [
        'Информационные системы',
        'Программная инженерия',
        'Информатика и вычислительная техника',
        'Прикладная математика и информатика'
      ]
    },
    {
      id: 2,
      name: 'Политехнический институт',
      departments: [
        'Машиностроение',
        'Нефтегазовое дело',
        'Энергетика',
        'Транспорт'
      ]
    },
    {
      id: 3,
      name: 'Институт экономики, управления и природопользования',
      departments: [
        'Экономика',
        'Менеджмент',
        'Государственное и муниципальное управление',
        'Экология и природопользование'
      ]
    },
    {
      id: 4,
      name: 'Гуманитарный институт',
      departments: [
        'Лингвистика',
        'История',
        'Философия',
        'Социология'
      ]
    }
  ];

  const currentInstitute = institutes.find(inst => inst.id === profile.instituteId);

  useEffect(() => {
    // Здесь будет загрузка данных профиля с сервера
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'instituteId') {
      const institute = institutes.find(inst => inst.id === parseInt(value));
      setProfile(prev => ({
        ...prev,
        [name]: parseInt(value),
        department: institute?.departments[0] || ''
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Валидация
    if (!profile.firstName || !profile.lastName || !profile.studentId) {
      setSaveMessage('Пожалуйста, заполните обязательные поля');
      setIsSaving(false);
      return;
    }

    if (profile.studentId && !/^\d{2}-\d{6,8}$/.test(profile.studentId)) {
      setSaveMessage('Номер зачетной книжки должен быть в формате XX-XXXXXX');
      setIsSaving(false);
      return;
    }

    // Имитация API запроса
    setTimeout(() => {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setIsSaving(false);
      setIsEditing(false);
      setSaveMessage('Изменения успешно сохранены');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => setSaveMessage(null), 3000);
    }, 1000);
  };

  const handleCancel = () => {
    // Загружаем сохраненный профиль
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Профиль пользователя</h1>
              <p className="text-sm text-gray-600 mt-1">Личные данные для оформления документов</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Назад к документам</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Сообщение об успешном сохранении */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${saveMessage.includes('успешно') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {saveMessage.includes('успешно') ? (
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${saveMessage.includes('успешно') ? 'text-green-800' : 'text-red-800'}`}>
                  {saveMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-xl overflow-hidden">
          {/* Заголовок профиля с аватаром */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full p-2">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {profile.lastName} {profile.firstName} {profile.middleName}
                  </h2>
                  <p className="text-blue-100">{profile.email}</p>
                </div>
              </div>
              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Редактировать профиль</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="bg-white text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Сохранение...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Сохранить изменения</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Форма профиля */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Левая колонка - Основная информация */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Основная информация</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Отчество
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={profile.middleName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Электронная почта *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Правая колонка - Учебная информация */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Учебная информация</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Институт *
                  </label>
                  <select
                    name="instituteId"
                    value={profile.instituteId}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {institutes.map((institute) => (
                      <option key={institute.id} value={institute.id}>
                        {institute.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Кафедра *
                  </label>
                  <select
                    name="department"
                    value={profile.department}
                    onChange={handleInputChange}
                    disabled={!isEditing || !currentInstitute}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {currentInstitute?.departments.map((dept, index) => (
                      <option key={index} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Учебная группа *
                  </label>
                  <input
                    type="text"
                    name="group"
                    value={profile.group}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Например: КИ22-148"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    № зачетной книжки *
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={profile.studentId}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="XX-XXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">Формат: номер-номер (например, 24-03213102)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Информация о заполнении */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    Эта информация будет автоматически использоваться для заполнения документов. 
                    Убедитесь, что все данные актуальны и соответствуют вашим учебным документам.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Поля, отмеченные * (звездочкой), обязательны для заполнения.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительные разделы */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Статистика документов */}
          <div className="bg-white rounded-xl shadow border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Статистика документов</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Всего создано</span>
                <span className="font-bold text-gray-900">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Скомпилировано в PDF</span>
                <span className="font-bold text-gray-900">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">В работе</span>
                <span className="font-bold text-gray-900">6</span>
              </div>
            </div>
          </div>

          {/* Избранные шаблоны */}
          <div className="bg-white rounded-xl shadow border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Избранные шаблоны</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Отчет по учебной практике</span>
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Курсовая работа</span>
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Расчетно-графическая работа</span>
              </li>
            </ul>
          </div>

          {/* Быстрые действия */}
          <div className="bg-white rounded-xl shadow border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Действия</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Перейти к документам
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Сменить пароль
              </button>
              <button className="w-full text-left px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;