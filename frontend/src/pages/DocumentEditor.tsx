import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TipTapEditor from '../components/editor/TipTapEditor';
import CompilationStatus from '../components/CompilationStatus';

const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [docData, setDocData] = useState({
    id: id,
    title: 'Отчет по практике',
    lastSaved: new Date().toLocaleTimeString(),
    content: '<h1>Отчет по учебной практике</h1><h2>Введение</h2><p>Начните вводить текст вашего документа здесь...</p>' // Теперь просто строка
  });

  const [compilationState, setCompilationState] = useState<'idle' | 'queued' | 'compiling' | 'ready' | 'error'>('idle');
  const [compilationProgress, setCompilationProgress] = useState(0);

  const handleSave = () => {
    console.log('Сохранение документа...');
    // API call for save
    setDocData(prev => ({ ...prev, lastSaved: new Date().toLocaleTimeString() }));
  };

  const handleCompile = () => {
    setCompilationState('queued');
    setCompilationProgress(0);
    
    // Имитация процесса компиляции с прогрессом
    const interval = setInterval(() => {
      setCompilationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCompilationState('ready');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    setTimeout(() => {
      if (compilationState !== 'ready') {
        setCompilationState('compiling');
      }
    }, 1000);
  };

  const handleContentChange = (content: string) => {
    console.log('Содержимое изменено');
    setDocData(prev => ({ ...prev, content }));
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Верхняя панель инструментов */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
            title="Вернуться к документам"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{docData.title}</h1>
          <span className="text-sm text-gray-500">Сохранено: {docData.lastSaved}</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Сохранить
          </button>
          <button
            onClick={handleCompile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Скомпилировать в PDF
          </button>
          <select className="border border-gray-300 rounded-md px-3 py-2">
            <option>Визуальный редактор</option>
            <option>Режим LaTeX</option>
          </select>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Боковая панель - Структура документа */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Структура документа</h3>
            <nav className="space-y-2">
              <div className="text-sm text-blue-600 font-medium">Титульный лист</div>
              <div className="text-sm text-gray-700 ml-4">Реферат</div>
              <div className="text-sm text-gray-700 ml-4">Содержание</div>
              <div className="text-sm text-gray-700 ml-4">Введение</div>
              <div className="text-sm text-gray-700 ml-4">Основная часть</div>
              <div className="text-sm text-gray-700 ml-4">Заключение</div>
              <div className="text-sm text-gray-700 ml-4">Список литературы</div>
            </nav>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Элементы</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  📊 Добавить таблицу
                </button>
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  📷 Добавить изображение
                </button>
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  ∫ Добавить формулу
                </button>
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  📋 Добавить список литературы
                </button>
                <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded">
                  📄 Добавить приложение
                </button>
              </div>
            </div>

            {/* Статистика документа */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-semibold mb-2">Статистика</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Страниц:</span>
                  <span className="font-medium">~3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Слов:</span>
                  <span className="font-medium">~500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Символов:</span>
                  <span className="font-medium">~3000</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Основная область - Редактор */}
        <main className="flex-1 overflow-auto">
          <TipTapEditor 
            initialContent={docData.content}
            onContentChange={handleContentChange}
          />
        </main>
      </div>

      {/* Нижняя панель - Статус компиляции */}
      <footer className="border-t border-gray-200 bg-white px-4 py-2">
        <CompilationStatus state={compilationState} progress={compilationProgress} />
      </footer>
    </div>
  );
};

export default DocumentEditor;