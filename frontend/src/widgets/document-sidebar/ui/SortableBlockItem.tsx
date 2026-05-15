import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { DocBlock } from '../../../entities/document/model/documentBlocks';

interface Props {
  block: DocBlock;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SortableBlockItem = ({ block, isActive, onSelect, onDelete }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Устанавливаем данные, которые поймает TipTap
    e.dataTransfer.setData('blockType', block.type);
    e.dataTransfer.setData('blockTitle', block.title);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Можно добавить картинку-превью при перетаскивании
    const dragIcon = document.createElement('div');
    dragIcon.innerText = block.title;
    dragIcon.style.padding = '8px';
    dragIcon.style.background = '#ea580c';
    dragIcon.style.color = 'white';
    dragIcon.style.borderRadius = '4px';
    dragIcon.style.position = 'absolute';
    dragIcon.style.top = '-1000px';
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 0, 0);
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      draggable // Обязательно
      onDragStart={handleDragStart}
      onClick={() => onSelect(block.id)}
      className={`
        group flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer mb-2
        ${isActive 
          ? 'border-orange-300 bg-orange-50 text-orange-900 shadow-sm' 
          : 'border-transparent bg-white hover:bg-gray-50 text-gray-600'}
      `}
    >
      {/* Кнопка-хендл для перетаскивания */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500"
      >
        <GripVertical size={16} />
      </div>

      <span className="text-sm font-medium flex-1 truncate select-none">
        {block.title}
      </span>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};