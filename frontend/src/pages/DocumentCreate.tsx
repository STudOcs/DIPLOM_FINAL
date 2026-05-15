// src/pages/DocumentCreate.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TemplatePreview from '../components/TemplatePreview';

const DocumentCreate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState<number>(1);
  const [documentName, setDocumentName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateParam = params.get('template');
    if (templateParam) {
      setTemplateId(parseInt(templateParam));
    }
  }, [location]);

  const handleCreate = () => {
    if (!documentName.trim()) {
      alert('Введите название документа');
      return;
    }

    setIsCreating(true);
    // Имитация создания документа
    setTimeout(() => {
      const newDocId = Math.floor(Math.random() * 1000);
      navigate(`/document/${newDocId}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Создание нового документа</h1>
          <p className="text-gray-600 mt-2">
            Выберите параметры для нового документа
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Форма */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow border p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название документа *
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Например: Отчет по практике за 2024 год"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите шаблон
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="1">Отчет по учебной практике</option>
                    <option value="2">Курсовая работа</option>
                    <option value="3">Расчетно-графическая работа</option>
                    <option value="4">Выпускная квалификационная работа</option>
                    <option value="5">Научная статья</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дополнительные настройки
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                      <span className="text-sm text-gray-700">Автоматическая нумерация страниц</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                      <span className="text-sm text-gray-700">Оглавление (автоматически)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Скрытые комментарии</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Создание...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Создать документ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Правая колонка - Предпросмотр */}
          <div>
            <TemplatePreview templateId={templateId} />
            
            {/* Информация о шаблоне */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Что включает шаблон?</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Титульный лист по СТО СФУ
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Автоматическое оглавление
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Правильные поля и шрифты
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Нумерация страниц и разделов
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreate;