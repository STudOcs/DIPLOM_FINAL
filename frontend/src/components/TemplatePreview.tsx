import React, { useState } from 'react';

interface TemplatePreviewProps {
  templateId: number;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = () => {
    setIsLoading(true);
    // Здесь будет логика предпросмотра шаблона
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900">Предпросмотр шаблона</h3>
        <button
          onClick={handlePreview}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isLoading ? 'Загрузка...' : 'Предпросмотр PDF'}
        </button>
      </div>
      
      <div className="aspect-[210/297] bg-gray-50 border border-gray-300 rounded flex items-center justify-center">
        {isLoading ? (
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Загрузка предпросмотра...</p>
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Нажмите для предпросмотра</p>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Шаблон соответствует СТО СФУ 01-2023</p>
        <p>Автоматическое оформление: поля, шрифты, нумерация</p>
      </div>
    </div>
  );
};

export default TemplatePreview;