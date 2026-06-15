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
  const navigate = useNavigate();

  useEffect(() => {
    documentService.getTemplates()
      .then(setTemplates)
      .catch(() => alert("Не удалось загрузить шаблоны"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectTemplate = async (tpl: TemplateItem) => {
    try {
      // При создании запрашиваем название через prompt для простоты (позже можно сделать модалку)
      const title = window.prompt("Введите название работы:", `Отчет по ${tpl.name}`);
      if (!title) return;

      const newDoc = await documentService.create({
        title: title,
        template_id: tpl.id,
        lab_number: 1,
        course_name: "Наименование дисциплины"
      });

      const documentId = newDoc.doc_id || newDoc.id;

      navigate(`/documents/${documentId}`);
    } catch (e) {
      alert("Ошибка при создании документа");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-8 hover:text-orange-600">
          <ArrowLeft size={20} /> Назад
        </button>
        <h1 className="text-3xl font-bold mb-2">Выберите тип работы</h1>
        <p className="text-gray-500 mb-10">Бэкенд автоматически сформирует структуру по стандартам СТУ СФУ</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => (
            <TemplateCard 
              key={tpl.id}
              template={{
                id: tpl.id.toString(),
                title: tpl.name,
                description: tpl.description,
                icon: 'FileText' // Можешь добавить логику выбора иконок
              }}
              onSelect={() => handleSelectTemplate(tpl)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentCreate;