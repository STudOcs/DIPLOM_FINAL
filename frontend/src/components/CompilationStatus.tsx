import React from 'react';

interface CompilationStatusProps {
  state: 'idle' | 'queued' | 'compiling' | 'ready' | 'error';
  progress?: number;
}

const CompilationStatus: React.FC<CompilationStatusProps> = ({ state, progress = 0 }) => {
  const getStatusConfig = (state: string) => {
    const configs = {
      idle: { text: 'Готов к компиляции', color: 'text-gray-500', bg: 'bg-gray-100', icon: '🔄' },
      queued: { text: 'В очереди...', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⏳' },
      compiling: { text: `Компилируется... ${progress}%`, color: 'text-blue-600', bg: 'bg-blue-100', icon: '⚙️' },
      ready: { text: 'PDF готов к скачиванию', color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
      error: { text: 'Ошибка компиляции', color: 'text-red-600', bg: 'bg-red-100', icon: '❌' },
    };
    return configs[state as keyof typeof configs] || configs.idle;
  };

  const status = getStatusConfig(state);

  return (
    <div className={`px-4 py-3 rounded-lg ${status.bg} ${status.color} text-sm font-medium`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">{status.icon}</span>
          <span>{status.text}</span>
        </div>
        
        {state === 'compiling' && (
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        {state === 'ready' && (
          <button className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 transition-colors">
            Скачать PDF
          </button>
        )}
        
        {state === 'error' && (
          <button className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors">
            Показать ошибки
          </button>
        )}
      </div>
    </div>
  );
};

export default CompilationStatus;