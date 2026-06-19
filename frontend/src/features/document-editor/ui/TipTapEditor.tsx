import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TableInsertModal } from './TableInsertModal';

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
  const editorWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

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
        cellMinWidth: 60,
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
      renumberTables(editor);
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

  const renumberTables = (editor: Editor) => {
    const root = editor.view.dom;
    const titles = Array.from(
      root.querySelectorAll<HTMLParagraphElement>('p.table-title')
    );

    titles.forEach((title, index) => {
      const currentText = title.textContent || '';
      const name = currentText.replace(/^Таблица\s+\d+\s+[—-]\s*/u, '').trim();

      title.textContent = `Таблица ${index + 1} — ${name || 'Название таблицы'}`;
    });
  };

  const getNextTableNumber = () => {
    if (!editor) return 1;

    const html = editor.getHTML();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    return doc.querySelectorAll('.table-title').length + 1;
  };

  const insertStandardTable = (data: { title: string; rows: number; cols: number }) => {
    if (!editor) return;

    const number = getNextTableNumber();

    editor
      .chain()
      .focus()
      .insertContent(`<p class="table-title">Таблица 1 — ${data.title}</p>`)
      .insertTable({
        rows: data.rows,
        cols: data.cols,
        withHeaderRow: true,
      })
      .insertContent('<p></p>')
      .run();
  };

  const MIN_TABLE_COLUMN_WIDTH = 80;
  const TABLE_RESIZE_HANDLE_WIDTH = 8;

  const getEditorRoot = useCallback(() => {
    return editorWrapperRef.current?.querySelector<HTMLElement>('.sfu-document-content') ?? null;
  }, []);

  const getEditorTables = useCallback(() => {
    const root = getEditorRoot();

    if (!root) return [];

    return Array.from(root.querySelectorAll<HTMLTableElement>('table'));
  }, [getEditorRoot]);

  const shouldSkipTableResize = (table: HTMLTableElement) => {
    return (
      table.classList.contains('latex-signature-table') ||
      table.classList.contains('signature-table') ||
      Boolean(table.closest('[data-type="titlepage"]')) ||
      Boolean(table.closest('.latex-title-page')) ||
      Boolean(table.closest('blockquote'))
    );
  };

  const getFirstTableRow = (table: HTMLTableElement) => {
    return Array.from(table.rows).find(row => row.cells.length > 0) ?? null;
  };

  const getColumnWidths = (table: HTMLTableElement): number[] => {
    const firstRow = getFirstTableRow(table);

    if (!firstRow) return [];

    const cells = Array.from(firstRow.cells);
    const tableWidth = table.getBoundingClientRect().width;

    const cols = Array.from(table.querySelectorAll<HTMLTableColElement>('col'));

    let widths =
      cols.length === cells.length
        ? cols.map(col => parseFloat(col.style.width))
        : [];

    const hasValidWidths =
      widths.length === cells.length &&
      widths.every(width => Number.isFinite(width) && width > 0);

    if (!hasValidWidths) {
      widths = cells.map(cell => cell.getBoundingClientRect().width);
    }

    const sum = widths.reduce((acc, width) => acc + width, 0);

    if (sum > 0 && Math.abs(sum - tableWidth) > 1) {
      widths = widths.map(width => (width / sum) * tableWidth);
    }

    return widths;
  };

  const getMinColumnWidth = (table: HTMLTableElement, columnCount: number) => {
    const tableWidth = table.getBoundingClientRect().width;

    return Math.max(
      45,
      Math.min(MIN_TABLE_COLUMN_WIDTH, Math.floor(tableWidth / columnCount) - 4),
    );
  };

  useEffect(() => {
    const wrapper = editorWrapperRef.current;

    if (!wrapper || !editor) return;

    const MIN_COL_WIDTH = 80;
    const HANDLE_WIDTH = 8;

    let handles: HTMLDivElement[] = [];

    const clearHandles = () => {
      handles.forEach(handle => handle.remove());
      handles = [];
    };

    const getTables = () => {
      return Array.from(
        wrapper.querySelectorAll<HTMLTableElement>('.sfu-document-content table'),
      );
    };

    const getTableColumnCount = (table: HTMLTableElement) => {
      const firstRow = Array.from(table.rows).find(row => row.cells.length > 0);

      return firstRow?.cells.length ?? 0;
    };

    const getColumnWidths = (table: HTMLTableElement) => {
      const columnCount = getTableColumnCount(table);

      if (columnCount === 0) return [];

      const tableWidth = table.getBoundingClientRect().width;
      const cols = Array.from(table.querySelectorAll<HTMLTableColElement>('col'));

      let widths =
        cols.length === columnCount
          ? cols.map(col => Number.parseFloat(col.style.width))
          : [];

      const hasInvalidWidth =
        widths.length !== columnCount ||
        widths.some(width => !Number.isFinite(width) || width <= 0);

      if (hasInvalidWidth) {
        widths = Array.from({ length: columnCount }, () => tableWidth / columnCount);
      }

      const sum = widths.reduce((acc, width) => acc + width, 0);

      if (sum > 0 && Math.abs(sum - tableWidth) > 1) {
        widths = widths.map(width => (width / sum) * tableWidth);
      }

      return widths;
    };

    const applyWidths = (table: HTMLTableElement, widths: number[]) => {
      let colgroup = table.querySelector('colgroup');

      if (!colgroup) {
        colgroup = document.createElement('colgroup');
        table.prepend(colgroup);
      }

      colgroup.innerHTML = '';

      widths.forEach(width => {
        const col = document.createElement('col');

        col.style.width = `${Math.round(width)}px`;
        colgroup?.appendChild(col);
      });

      table.style.width = '100%';
      table.style.maxWidth = '100%';
      table.style.tableLayout = 'fixed';
    };

    const updateHandlePosition = (
      handle: HTMLDivElement,
      table: HTMLTableElement,
      widths: number[],
      columnIndex: number,
    ) => {
      const tableRect = table.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();

      const leftOffset = widths
        .slice(0, columnIndex + 1)
        .reduce((acc, width) => acc + width, 0);

      handle.style.left = `${
        tableRect.left - wrapperRect.left + leftOffset - HANDLE_WIDTH / 2
      }px`;
      handle.style.top = `${tableRect.top - wrapperRect.top}px`;
      handle.style.height = `${tableRect.height}px`;
    };

    const buildHandles = () => {
      clearHandles();

      getTables().forEach((table, tableIndex) => {
        const widths = getColumnWidths(table);

        if (widths.length < 2) return;

        applyWidths(table, widths);

        widths.slice(0, -1).forEach((_, columnIndex) => {
          const handle = document.createElement('div');

          handle.className = 'sfu-table-resize-handle';
          handle.dataset.tableIndex = String(tableIndex);
          handle.dataset.columnIndex = String(columnIndex);

          updateHandlePosition(handle, table, widths, columnIndex);

          handle.addEventListener('mousedown', event => {
            event.preventDefault();
            event.stopPropagation();

            const startX = event.clientX;
            const startWidths = getColumnWidths(table);

            const leftStartWidth = startWidths[columnIndex];
            const rightStartWidth = startWidths[columnIndex + 1];

            if (!leftStartWidth || !rightStartWidth) return;

            const pairWidth = leftStartWidth + rightStartWidth;

            if (pairWidth < MIN_COL_WIDTH * 2) return;

            const onMouseMove = (moveEvent: MouseEvent) => {
              moveEvent.preventDefault();

              const delta = moveEvent.clientX - startX;

              let nextLeftWidth = leftStartWidth + delta;

              nextLeftWidth = Math.max(MIN_COL_WIDTH, nextLeftWidth);
              nextLeftWidth = Math.min(pairWidth - MIN_COL_WIDTH, nextLeftWidth);

              const nextRightWidth = pairWidth - nextLeftWidth;

              const nextWidths = [...startWidths];

              nextWidths[columnIndex] = nextLeftWidth;
              nextWidths[columnIndex + 1] = nextRightWidth;

              applyWidths(table, nextWidths);
              updateHandlePosition(handle, table, nextWidths, columnIndex);
            };

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);

              const finalWidths = getColumnWidths(table);

              applyWidths(table, finalWidths);

              onChange(editor.getHTML());

              requestAnimationFrame(buildHandles);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          });

          wrapper.appendChild(handle);
          handles.push(handle);
        });
      });
    };

    buildHandles();

    const rebuildAfterEditorUpdate = () => {
      requestAnimationFrame(buildHandles);
    };

    editor.on('update', rebuildAfterEditorUpdate);
    editor.on('selectionUpdate', rebuildAfterEditorUpdate);

    window.addEventListener('resize', buildHandles);

    return () => {
      editor.off('update', rebuildAfterEditorUpdate);
      editor.off('selectionUpdate', rebuildAfterEditorUpdate);
      window.removeEventListener('resize', buildHandles);
      clearHandles();
    };
  }, [editor, onChange]);

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
      setIsTableModalOpen(true);
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
            <EditorToolbar
              editor ={editor}
              onOpenTableModal={() => setIsTableModalOpen(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto py-8 px-10">
          <div
            ref={editorWrapperRef}
            className="mx-auto w-[210mm] min-h-[297mm] bg-white border border-gray-300 shadow-sm relative"
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
      <TableInsertModal
        open={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={insertStandardTable}
      />
    </div>
  );
};