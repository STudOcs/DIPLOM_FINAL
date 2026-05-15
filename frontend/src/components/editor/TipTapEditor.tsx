import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Blockquote from '@tiptap/extension-blockquote';
import HardBreak from '@tiptap/extension-hard-break';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Document from '@tiptap/extension-document';

interface TipTapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ 
  initialContent = '<h1>Отчет по учебной практике</h1><h2>Введение</h2><p>Начните вводить текст вашего документа здесь...</p>', 
  onContentChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [pages, setPages] = useState<string[]>(['']);

  const A4_WIDTH = 794; // Ширина А4 в пикселях
  const A4_HEIGHT = 1123; // Высота А4 в пикселях
  const PAGE_MARGIN = 72; // Отступы страницы

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
        },
        orderedList: {
          keepMarks: true,
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'my-8 border-t-2 border-gray-300',
          },
        },
        hardBreak: {
          HTMLAttributes: {
            class: 'hard-break',
          },
        },
      }),
      Underline,
      // Исправлено: конфигурация TextAlign (теперь кнопки не будут выдавать ошибку)
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full border-collapse border border-gray-300 my-4',
        },
      }),
      TableRow,
      TableCell,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700 bg-blue-50 py-2',
        },
      }),
      HardBreak,
      Placeholder.configure({
        placeholder: 'Начните писать здесь...',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'pl-0 my-2',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-1',
        },
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      
      if (onContentChange) {
        onContentChange(newContent);
      }
      
      // Разбиваем контент на страницы
      splitContentIntoPages(newContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
  });

  // Разбиваем контент на страницы
  const splitContentIntoPages = (content: string) => {
    if (!editor) return;
    
    // Ищем разрывы страниц
    const pageBreaks = content.split(/<div class="page-break"[^>]*><\/div>/g);
    
    // Если есть разрывы, используем их
    if (pageBreaks.length > 1) {
      setPages(pageBreaks.filter(page => page.trim() !== ''));
    } else {
      // Если нет разрывов, разбиваем по высоте
      const editorElement = editor.view.dom;
      const elements = Array.from(editorElement.children) as HTMLElement[];
      
      const newPages: string[] = [];
      let currentPageHeight = 0;
      let currentPageContent: string[] = [];
      const maxPageHeight = A4_HEIGHT - (PAGE_MARGIN * 2);
      
      elements.forEach((element, index) => {
        const elementHeight = element.offsetHeight || 50; // Примерная высота
        const elementHTML = element.outerHTML;
        
        if (currentPageHeight + elementHeight > maxPageHeight && currentPageContent.length > 0) {
          // Сохраняем текущую страницу и начинаем новую
          newPages.push(currentPageContent.join(''));
          currentPageContent = [elementHTML];
          currentPageHeight = elementHeight;
        } else {
          currentPageContent.push(elementHTML);
          currentPageHeight += elementHeight;
        }
      });
      
      // Добавляем последнюю страницу
      if (currentPageContent.length > 0) {
        newPages.push(currentPageContent.join(''));
      }
      
      setPages(newPages.length > 0 ? newPages : ['']);
    }
  };

  // Эффект для инициализации разбиения на страницы
  useEffect(() => {
    if (editor) {
      splitContentIntoPages(editor.getHTML());
    }
  }, [editor]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertTable = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true })
        .run();
      setIsTableModalOpen(false);
    }
  };

  const setLink = () => {
    if (editor) {
      if (linkUrl === '') {
        editor.chain().focus().unsetLink().run();
      } else {
        editor
          .chain()
          .focus()
          .setLink({ href: linkUrl })
          .run();
      }
      setIsLinkModalOpen(false);
      setLinkUrl('https://');
    }
  };


  // Рассчитываем примерную высоту контента
  const calculateContentHeight = (content: string): number => {
    // Простая эвристика: примерно 20px на строку
    const lines = content.split(/<\/?(p|h[1-6]|div|li)[^>]*>/gi).length;
    return lines * 20;
  };

  if (!editor) {
    return <div className="p-8">Загрузка редактора...</div>;
  }

  return (
    /* ВАЖНО: Добавлен h-full и overflow-hidden, чтобы зафиксировать всё внутри компонента */
    <div className="flex flex-col h-full overflow-hidden bg-gray-100">
      
      {/* 1. ФИКСИРОВАННЫЙ ТУЛБАР: добавлен shrink-0 и высокий z-index */}
      <div className="toolbar border-b border-gray-200 px-4 py-3 bg-white flex flex-wrap items-center gap-2 sticky top-0 z-[60] shrink-0 shadow-sm">
        
        {/* Статистика страниц */}
        <div className="flex items-center border-r border-gray-300 pr-3">
          <span className="text-sm text-gray-600">
            Страниц: {pages.length}
          </span>
        </div>

        {/* Заголовки */}
        <div className="flex items-center border-r border-gray-300 pr-3">
          <select
            value={editor.getAttributes('heading')?.level || 'paragraph'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 }).run();
              }
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="paragraph">Обычный текст</option>
            <option value="1">Заголовок 1</option>
            <option value="2">Заголовок 2</option>
            <option value="3">Заголовок 3</option>
          </select>
        </div>

        {/* Основное форматирование */}
        <div className="flex items-center border-r border-gray-300 pr-3 gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Жирный (Ctrl+B)"
          >
            <strong className="font-bold">B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Курсив (Ctrl+I)"
          >
            <em className="italic">I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Подчеркнутый (Ctrl+U)"
          >
            <u className="underline">U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Зачеркнутый"
          >
            <span className="line-through">S</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Выделение"
          >
            <span className="bg-yellow-200 px-1">H</span>
          </button>
        </div>

        {/* Выравнивание */}
        <div className="flex items-center border-r border-gray-300 pr-3 gap-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Выровнять по левому краю"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h10M3 18h10" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Выровнять по центру"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 6h12M6 14h12M3 18h18" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Выровнять по правому краю"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M9 6h12M9 14h12M3 18h18" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Выровнять по ширине"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Списки */}
        <div className="flex items-center border-r border-gray-300 pr-3 gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Маркированный список"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="4" cy="12" r="2" />
              <circle cx="4" cy="6" r="2" />
              <circle cx="4" cy="18" r="2" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Нумерованный список"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded ${editor.isActive('taskList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Список задач"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              <rect x="3" y="10" width="12" height="4" rx="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Вставка элементов */}
        <div className="flex items-center border-r border-gray-300 pr-3 gap-1">
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Вставить ссылку (Ctrl+K)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              id="image-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded hover:bg-gray-100"
              title="Вставить изображение"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => setIsTableModalOpen(true)}
            className="p-2 rounded hover:bg-gray-100"
            title="Вставить таблицу"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18M3 18h18M3 6h18M6 3v18M9 3v18M12 3v18M15 3v18" />
            </svg>
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Цитата"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-gray-100"
            title="Горизонтальная линия"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13H5m14 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 13V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          
        </div>

        {/* Дополнительные действия */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-100"
            title="Отменить (Ctrl+Z)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-100"
            title="Повторить (Ctrl+Y)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          
        </div>
      </div>

      {/* 2. СКРОЛЛИРУЕМАЯ ОБЛАСТЬ: добавлены стили для прокрутки */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        <div className="flex flex-col items-center">
          {/* Отображаем страницы одна под другой */}
          {pages.map((pageContent, pageIndex) => (
            <div 
              key={pageIndex}
              className="bg-white shadow-lg border border-gray-300 mb-8 shrink-0"
              style={{
                width: `${A4_WIDTH}px`,
                minHeight: `${A4_HEIGHT}px`,
              }}
            >
              {/* Отступы как на реальной странице */}
              <div 
                className="h-full"
                style={{
                  padding: `${PAGE_MARGIN}px`,
                }}
              >
                {pageIndex === 0 ? (
                  // Первая страница - активный редактор
                  <EditorContent editor={editor} />
                ) : (
                  // Остальные страницы - только отображение
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                  />
                )}
              </div>
              
              {/* Номер страницы внизу */}
              <div className="text-center text-sm text-gray-500 py-2 border-t border-gray-200">
                Страница {pageIndex + 1}
              </div>
            </div>
          ))}
          
        </div>
      </div>

      {/* 3. ФИКСИРОВАННЫЙ ФУТЕР */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-sm text-gray-500 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <span>Страниц: {pages.length}</span>
          <span>Количество слов: {editor?.storage.characterCount?.words() || 0}</span>
          <span>Символов: {editor?.storage.characterCount?.characters() || 0}</span>
        </div>
        <div className="text-xs text-gray-400">
          СФУ.ДОК — Редактор учебных документов
        </div>
      </div>

      {/* Модальные окна и остальная логика без изменений */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Вставить ссылку</h3>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full border border-gray-300 rounded px-3 py-2 mb-4" autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Отмена</button>
              <button onClick={setLink} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Вставить</button>
            </div>
          </div>
        </div>
      )}

      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Вставить таблицу</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Количество строк</label><input type="number" min="1" max="10" value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Количество столбцов</label><input type="number" min="1" max="10" value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsTableModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Отмена</button>
              <button onClick={insertTable} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Вставить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TipTapEditor;