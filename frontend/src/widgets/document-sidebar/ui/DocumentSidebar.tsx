import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { DocBlock, BlockType } from '../../../entities/document/model/documentBlocks';
import { SortableBlockItem } from './SortableBlockItem';
import { DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';

interface SidebarProps {
  blocks: DocBlock[];
  activeBlockId: string;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: BlockType) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (newBlocks: DocBlock[]) => void; // Новый пропс
}

export const DocumentSidebar = ({ 
  blocks, 
  activeBlockId, 
  onSelectBlock, 
  onAddBlock, 
  onDeleteBlock,
  onReorderBlocks 
}: SidebarProps) => {
  
  // Настройка сенсоров (мышь + клавиатура)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      
      const movedArray = arrayMove(blocks, oldIndex, newIndex);
      onReorderBlocks(movedArray);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Структура</h3>
        <button 
          onClick={() => onAddBlock('main')}
          className="p-1 hover:bg-orange-100 text-orange-600 rounded-full transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-y-auto p-3">
            <SortableContext 
                items={blocks.map(b => b.id)} 
                strategy={verticalListSortingStrategy}
            >
                {blocks.map((block) => (
                <SortableBlockItem 
                    key={block.id}
                    block={block}
                    isActive={activeBlockId === block.id}
                    onSelect={onSelectBlock}
                    onDelete={onDeleteBlock}
                />
                ))}
            </SortableContext>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeId ? (
                <div className="p-3 bg-orange-600 text-white rounded-lg shadow-2xl opacity-90 cursor-grabbing w-56 border-2 border-orange-400 rotate-3">
                {blocks.find(b => b.id === activeId)?.title}
                </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </aside>
  );
};