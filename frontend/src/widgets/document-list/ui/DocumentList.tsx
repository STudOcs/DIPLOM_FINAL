// src/widgets/document-list/ui/DocumentList.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { DocumentCard } from '../../../entities/document/ui/DocumentCard';
import { documentService } from '../../../shared/api/documentService';
import { DocumentItem } from '../../../entities/document/model/types';

export const DocumentList = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = () => {
    setIsLoading(true);
    documentService.getAll()
      .then(setDocuments)
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // --- ФУНКЦИЯ УДАЛЕНИЯ ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот документ?")) return;

    try {
      await documentService.delete(id);
      // Убираем документ из стейта, чтобы он исчез мгновенно без перезагрузки
      setDocuments(prev => prev.filter(doc => doc.doc_id !== id));
    } catch (err) {
      alert("Не удалось удалить документ");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-600" size={40} /></div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {/* Кнопка Создать */}
      <div 
        onClick={() => navigate('/create')}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer group h-[220px]"
      >
        <Plus size={32} className="text-gray-400 group-hover:text-orange-600 mb-2" />
        <span className="text-sm font-medium text-gray-500">Создать документ</span>
      </div>

      {/* Список документов */}
      {documents.map((doc) => (
        <DocumentCard 
          key={doc.doc_id} 
          doc={doc} 
          onClick={() => navigate(`/editor/${doc.doc_id}`)} 
          onDelete={handleDelete} // Передаем функцию удаления
        />
      ))}
    </div>
  );
};
