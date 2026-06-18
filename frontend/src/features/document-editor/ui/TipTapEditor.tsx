import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  Heading1,
  Heading2,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
} from 'lucide-react';

import { EditorToolbar } from './EditorToolbar';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onEditorInit: (editor: Editor) => void;
  pdfUrl?: string | null;
}

type OutlineItem = {
  id: string;
  level: number;
  text: string;
  pos: number;
};

export const TipTapEditor = ({
  content,
  onChange,
  onEditorInit,
  pdfUrl,
}: TipTapEditorProps) => {
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 40,
        lastColumnResizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Введите текст документа...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'justify',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'sfu-document-content focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      updateOutline(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateOutline(editor);
    },
  });

  const updateOutline = (editor: Editor) => {
    const headings: OutlineItem[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          id: `heading-${pos}`,
          level: node.attrs.level || 1,
          text: node.textContent || 'Без названия',
          pos,
        });
      }
    });

    setOutline(headings);
  };

  useEffect(() => {
    if (editor) {
      onEditorInit(editor);
      updateOutline(editor);
    }
  }, [editor, onEditorInit]);

  const scrollToHeading = (pos: number) => {
    if (!editor) return;

    editor.chain().focus().setTextSelection(pos + 1).run();

    setTimeout(() => {
      const selection = window.getSelection();
      const node = selection?.anchorNode?.parentElement;

      node?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  };

  const handleDropBlock = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!editor) return;

    const blockType = event.dataTransfer.getData('block-type');

    if (!blockType) return;

    const view = editor.view;
    const coordinates = {
      left: event.clientX,
      top: event.clientY,
    };

    const position = view.posAtCoords(coordinates);

    if (position) {
      editor.chain().focus().setTextSelection(position.pos).run();
    }

    insertBlock(blockType);
  };

  const insertBlock = (type: string) => {
    if (!editor) return;

    if (type === 'table') {
      editor
        .chain()
        .focus()
        .insertContent('<p class="table-title">Таблица 1 – Название таблицы</p>')
        .insertTable({
          rows: 3,
          cols: 3,
          withHeaderRow: true,
        })
        .insertContent('<p></p>')
        .run();

      return;
    }

    const contentByType: Record<string, string> = {
      paragraph: '<p>Новый абзац текста</p>',

      heading1: '<h1>НОВЫЙ РАЗДЕЛ</h1><p></p>',

      heading2: '<h2>1.1 Новый подраздел</h2><p></p>',

      image: `
        <figure>
          <div class="image-placeholder">Изображение</div>
          <figcaption>Рисунок 1 – Название рисунка</figcaption>
        </figure>
        <p></p>
      `,
    };

    const content = contentByType[type];

    if (!content) return;

    editor.chain().focus().insertContent(content).run();
  };

  const blockItems = useMemo(
    () => [
      { type: 'paragraph', label: 'Абзац', icon: Type },
      { type: 'heading1', label: 'Раздел', icon: Heading1 },
      { type: 'heading2', label: 'Подраздел', icon: Heading2 },
      { type: 'table', label: 'Таблица', icon: TableIcon },
      { type: 'image', label: 'Рисунок', icon: ImageIcon },
    ],
    []
  );

  return (
    <div className="h-full grid grid-cols-[280px_minmax(900px,1fr)_minmax(420px,45vw)] bg-gray-100 overflow-hidden">
      <aside className="border-r bg-white overflow-hidden flex flex-col">
        <section className="h-1/2 border-b p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Содержание
          </h3>

          {outline.length === 0 ? (
            <p className="text-xs text-gray-400">Заголовки появятся здесь</p>
          ) : (
            <div className="space-y-1">
              {outline.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.pos)}
                  className={`block w-full text-left text-sm rounded px-2 py-1 hover:bg-orange-50 hover:text-orange-600 ${
                    item.level === 1 ? 'font-semibold' : 'pl-5 text-gray-600'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="h-1/2 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Блоки
          </h3>

          <div className="space-y-2">
            {blockItems.map(item => {
              const Icon = item.icon;

              return (
                <button
                  key={item.type}
                  draggable
                  onClick={() => insertBlock(item.type)}
                  onDragStart={e => {
                    e.dataTransfer.setData('block-type', item.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition"
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>
      </aside>

      <main className="overflow-hidden flex flex-col min-w-[900px]">
        <div className="sticky top-0 z-30 bg-gray-100 pt-3">
          <div className="mx-auto w-[210mm] bg-white border shadow-sm">
            <EditorToolbar editor={editor} />
          </div>
        </div>

        <div className="flex-1 overflow-auto py-8 px-10">
          <div
            className="mx-auto w-[210mm] min-h-[297mm] bg-white border border-gray-300 shadow-sm"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDropBlock}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      <aside className="border-l bg-white overflow-hidden flex flex-col">
        <div className="h-12 px-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">
            PDF предпросмотр
          </h3>
        </div>

        <div className="flex-1 bg-gray-200 p-4 overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF preview"
              className="w-full h-full bg-white border rounded"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center">
              PDF появится после компиляции документа
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};