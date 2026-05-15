// src/pages/document-create/DocumentCreate.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Book, GraduationCap, ClipboardList, FileText } from 'lucide-react';
import { documentService } from '../../shared/api/documentService';
import { TemplateItem } from '../../entities/document/model/types';
import { TemplateCard } from '../../entities/template/ui/TemplateCard';

// Вспомогательная функция для выбора иконки
const getTemplateIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('курсовая')) return 'Book';
  if (lowerName.includes('вкр') || lowerName.includes('диплом')) return 'GraduationCap';
  if (lowerName.includes('отчет') || lowerName.includes('практик')) return 'ClipboardList';
  return 'FileText';
};

const DocumentCreate = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    documentService.getTemplates()
      .then(setTemplates)
      .catch(err => console.error("Ошибка загрузки шаблонов:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectTemplate = async (template: TemplateItem) => {
    try {
      setIsCreating(true);
      // При создании документа отправляем название и ID шаблона
      const newDoc = await documentService.create({
        name_doc: `Новый документ (${template.name_tmp})`,
        template_id: template.template_id
      });
      
      // После создания летим в редактор
      navigate(`/editor/${newDoc.doc_id}`);
    } catch (err) {
      alert("Ошибка при создании документа");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 mb-8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Новый документ</h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Выберите шаблон</h2>
          <p className="text-gray-500">Все шаблоны настроены согласно стандартам СТО СФУ</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tmp) => (
              <TemplateCard 
                key={tmp.template_id}
                // Мапим данные бэкенда под интерфейс карточки
                template={{
                  id: tmp.template_id.toString(),
                  title: tmp.name_tmp,
                  description: tmp.definition_tmp,
                  icon: getTemplateIcon(tmp.name_tmp)
                }}
                onSelect={() => handleSelectTemplate(tmp)}
              />
            ))}
          </div>
        )}

        {isCreating && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
              <Loader2 className="animate-spin text-orange-600" />
              <span className="font-medium">Подготовка документа...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentCreate;