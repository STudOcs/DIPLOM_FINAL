import React from 'react';

interface Template {
  id: number;
  name: string;
  description: string;
  category: 'Практика' | 'Курсовая' | 'РГР' | 'Диплом' | 'Другое';
  icon: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (id: number, name: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const templates: Template[] = [
    { id: 1, name: 'Отчет по учебной практике', description: 'Стандартный шаблон СФУ для отчетов по практике', category: 'Практика', icon: '🎓' },
    { id: 2, name: 'Курсовая работа', description: 'Шаблон для курсовых работ с учетом требований СФУ', category: 'Курсовая', icon: '📚' },
    { id: 3, name: 'Расчетно-графическая работа', description: 'Для РГР с формулами и расчетами', category: 'РГР', icon: '📐' },
    { id: 4, name: 'Выпускная квалификационная работа', description: 'Полный шаблон для дипломных работ', category: 'Диплом', icon: '🎖️' },
    { id: 5, name: 'Научная статья', description: 'Шаблон для оформления научных статей', category: 'Другое', icon: '📄' },
    { id: 6, name: 'Отчет о НИР', description: 'Научно-исследовательская работа', category: 'Другое', icon: '🔬' },
    { id: 7, name: 'Пояснительная записка', description: 'Для проектов и технических заданий', category: 'Другое', icon: '📝' },
    { id: 8, name: 'Портфолио', description: 'Сборник работ студента', category: 'Другое', icon: '📁' },
  ];

  const categories = Array.from(new Set(templates.map(t => t.category)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Выберите шаблон</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Все шаблоны соответствуют стандартам оформления СФУ
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search bar */}
            <div className="mt-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск шаблонов..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6">
              {/* Категории */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Категории</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    Все
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Шаблоны */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => onSelectTemplate(template.id, template.name)}
                    className="group border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {template.category}
                          </span>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Совет:</span> Используйте курсор для предпросмотра шаблона
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => onSelectTemplate(1, 'Отчет по учебной практике')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Создать по умолчанию
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;