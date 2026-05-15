import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TemplateModal from '../components/TemplateModal';

interface Document {
  id: number;
  title: string;
  type: string;
  lastModified: string;
  status: 'Черновик' | 'Завершено' | 'В работе';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentDocuments] = useState<Document[]>([
    { id: 1, title: 'Отчет по учебной практике', type: 'Практика', lastModified: '15.01.2024', status: 'Черновик' },
    { id: 2, title: 'Курсовая работа по БД', type: 'Курсовая', lastModified: '10.01.2024', status: 'Завершено' },
    { id: 3, title: 'РГР по физике', type: 'РГР', lastModified: '05.01.2024', status: 'В работе' },
  ]);

  const handleTemplateSelect = (templateId: number, templateName: string) => {
    console.log(`Выбран шаблон: ${templateName} (ID: ${templateId})`);
    // Здесь будет логика создания документа
    setIsModalOpen(false);
    navigate(`/document/new?template=${templateId}`);
  };

  const handleQuickCreate = () => {
    // Быстрое создание с шаблоном по умолчанию
    navigate('/document/new?template=1');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Конструктор учебных документов СФУ</h1>
            <p className="text-sm text-gray-600 mt-1">Автоматическое оформление по стандартам СФУ</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/profile" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Профиль
            </Link>
            <div className="text-right">
              <p className="font-medium text-gray-900">Иван Иванов</p>
              <p className="text-sm text-gray-600">Студент ИКИТ</p>
              
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Создать документ</span>
            </button>
          </div>
        </div>
        
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Быстрые действия */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрый старт</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleQuickCreate}
              className="bg-white border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center space-x-2 shadow-sm"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Новый отчет по практике</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center space-x-2 shadow-sm"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Выбрать шаблон...</span>
            </button>
          </div>
        </div>

        {/* Недавние документы */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Недавние документы</h2>
            <Link to="/documents/all" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Посмотреть все →
            </Link>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {recentDocuments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Нет документов</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Создайте свой первый документ, нажав кнопку выше
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <Link to={`/document/${doc.id}`} className="block">
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${
                            doc.status === 'Завершено' ? 'bg-green-100' : 
                            doc.status === 'В работе' ? 'bg-blue-100' : 'bg-yellow-100'
                          }`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.title}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {doc.lastModified}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {doc.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'Завершено' ? 'bg-green-100 text-green-800' : 
                            doc.status === 'В работе' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status}
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Статистика */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Всего документов</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Завершено</p>
                <p className="text-2xl font-bold">18</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">В работе</p>
                <p className="text-2xl font-bold">6</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Модальное окно выбора шаблона */}
      <TemplateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default Dashboard;