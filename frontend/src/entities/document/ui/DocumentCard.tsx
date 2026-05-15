// src/entities/document/ui/DocumentCard.tsx
import { DocumentItem } from '../model/types';
import { getTemplateName } from '../model/templateMapper';
import { Badge } from '../../../shared/ui/Badge';
import { FileText, Trash2, Clock } from 'lucide-react'; // Импорт Trash2

interface DocumentCardProps {
  doc: DocumentItem;
  onClick: () => void;
  onDelete: (id: number) => void; // Новый пропс
}

export const DocumentCard = ({ doc, onClick, onDelete }: DocumentCardProps) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  return (
    <div 
      onClick={onClick}
      className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all cursor-pointer flex flex-col h-[220px] relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
          <FileText size={24} />
        </div>
        
        {/* Кнопка удаления */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Чтобы не сработал onClick карточки
            onDelete(doc.doc_id);
          }}
          className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Удалить документ"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
          {doc.name_doc || "Безымянный документ"}
        </h3>
        <p className="text-xs font-medium text-gray-400 uppercase">
          {getTemplateName(doc.template_id)}
        </p>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <Badge status={doc.compilation_status === 'not_compiled' ? 'draft' : doc.compilation_status as any} />
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock size={12} />
          {formatDate(doc.changes_data_doc)}
        </div>
      </div>
    </div>
  );
};