import { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Table as TableIcon, Heading1, Heading2, Quote, Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
// Импортируем всё как Icons, чтобы заработал твой код
import * as Icons from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar = ({ editor }: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertTable = () => {
    const rows = window.prompt('Количество строк:', '3');
    const cols = window.prompt('Количество столбцов:', '3');
    if (rows && cols) {
      editor.chain().focus().insertTable({ 
        rows: parseInt(rows), 
        cols: parseInt(cols), 
        withHeaderRow: true 
      }).run();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const captionText = window.prompt('Название рисунка:', 'Название');

        editor
          .chain()
          .focus()
          // Передаем массив: первым элементом идет фигура, вторым — пустой абзац
          .insertContent([
            {
              type: 'figure',
              content: [
                { type: 'image', attrs: { src } },
                { 
                  type: 'caption', 
                  content: [{ type: 'text', text: `Рисунок 1 — ${captionText || 'Без названия'}` }] 
                }
              ]
            },
            {
              type: 'paragraph' // Это создаст пустую строку под рисунком для продолжения ввода
            }
          ])
          .run();
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const setLink = () => {
    const url = window.prompt('Введите URL ссылки:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  

  const btnClass = (active: boolean) => 
    `p-2 rounded hover:bg-orange-100 transition-colors ${active ? 'bg-orange-200 text-orange-800' : 'text-gray-600'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        <Bold size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        <Italic size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))}>
        <Underline size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))}>
        <Heading1 size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        <Heading2 size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        <List size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button 
        onClick={() => editor.chain().focus().setTextAlign('left').run()} 
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
      >
        <AlignLeft size={18} />
      </button>
      <button 
        onClick={() => editor.chain().focus().setTextAlign('center').run()} 
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
      >
        <AlignCenter size={18} />
      </button>
      <button 
        onClick={() => editor.chain().focus().setTextAlign('right').run()} 
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
      >
        <AlignRight size={18} />
      </button>
      <button 
        onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
        className={btnClass(editor.isActive({ textAlign: 'justify' }))}
      >
        <AlignJustify size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button onClick={insertTable} className="p-2 hover:bg-orange-50 text-gray-600 rounded">
        <Icons.Table size={18} />
      </button>

      {/* Группа управления таблицей (ПОЯВЛЯЕТСЯ ТОЛЬКО В ТАБЛИЦЕ) */}
      {editor.isActive('table') && (
        <div className="flex items-center gap-1 bg-orange-50 p-1 rounded-md border border-orange-100 animate-in fade-in slide-in-from-left-2">
          <button onClick={() => editor.chain().focus().addColumnBefore().run()} className={btnClass(false)} title="Добавить столбец слева"><Icons.ArrowLeftToLine size={16} /></button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} className={btnClass(false)} title="Добавить столбец справа"><Icons.ArrowRightToLine size={16} /></button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Удалить столбец"><Icons.Columns size={16} /></button>
          
          <div className="w-px h-4 bg-orange-200 mx-1" />
          
          <button onClick={() => editor.chain().focus().addRowBefore().run()} className={btnClass(false)} title="Добавить строку выше"><Icons.ArrowUpToLine size={16} /></button>
          <button onClick={() => editor.chain().focus().addRowAfter().run()} className={btnClass(false)} title="Добавить строку ниже"><Icons.ArrowDownToLine size={16} /></button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Удалить строку"><Icons.Rows size={16} /></button>

          <div className="w-px h-4 bg-orange-200 mx-1" />

          <button onClick={() => editor.chain().focus().mergeCells().run()} className={btnClass(false)} title="Объединить ячейки"><Icons.Merge size={16} /></button>
          <button onClick={() => editor.chain().focus().splitCell().run()} className={btnClass(false)} title="Разделить ячейку"><Icons.Split size={16} /></button>
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-2 text-red-600 hover:bg-red-100 rounded" title="Удалить таблицу"><Icons.Trash2 size={16} /></button>
        </div>
      )}

      {/* Изображение */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
      <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-orange-50">
        <Icons.Image size={18} />
      </button>
      <button 
        onClick={() => editor.chain().focus().setPageBreak().run()} 
        className="p-2 hover:bg-orange-50 text-blue-600"
        title="Новая страница"
      >
        <Icons.FilePlus size={18} />
      </button>

      <div className="flex-1" />

      <button onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)}><Undo size={18} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)}><Redo size={18} /></button>
    </div>
  );
};
