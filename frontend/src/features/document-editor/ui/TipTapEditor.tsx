import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TableInsertModal } from './TableInsertModal';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';

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

  const renumberTableTitles = (editor: Editor) => {
    const updates: { from: number; to: number; text: string }[] = [];

    let commonTableNumber = 1;
    let currentAppendixLetter: string | null = null;
    const appendixTableCounters: Record<string, number> = {};

    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === 'heading' &&
        node.attrs.headingKind === 'structural'
      ) {
        const appendixMatch = node.textContent
          .trim()
          .toUpperCase()
          .match(/^ПРИЛОЖЕНИЕ\s+([А-ЯA-Z])$/u);

        currentAppendixLetter = appendixMatch ? appendixMatch[1] : null;
        return;
      }

      if (node.type.name !== 'paragraph') return;

      const isTableTitle =
        node.attrs.class === 'table-title' ||
        /^Таблица\s+/u.test(node.textContent.trim());

      if (!isTableTitle) return;

      const rawTitle = node.textContent
        .replace(/^Таблица\s+(([А-ЯA-Z]\.)?\d+|\d+)\s*[—–-]\s*/u, '')
        .replace(/^Таблица\s+[А-ЯA-Z]\.\d+\s*[—–-]\s*/u, '')
        .trim();

      let expected: string;

      if (currentAppendixLetter) {
        appendixTableCounters[currentAppendixLetter] =
          (appendixTableCounters[currentAppendixLetter] || 0) + 1;

        expected = `Таблица ${currentAppendixLetter}.${appendixTableCounters[currentAppendixLetter]} – ${rawTitle || 'Название таблицы'}`;
      } else {
        expected = `Таблица ${commonTableNumber} – ${rawTitle || 'Название таблицы'}`;
        commonTableNumber += 1;
      }

      if (node.textContent !== expected) {
        updates.push({
          from: pos + 1,
          to: pos + node.nodeSize - 1,
          text: expected,
        });
      }
    });

    if (!updates.length) return;

    let tr = editor.state.tr;

    updates.reverse().forEach(update => {
      tr = tr.insertText(update.text, update.from, update.to);
    });

    editor.view.dispatch(tr);
  };

  const renumberNumberedHeadings = (editor: Editor) => {
    const counters = [0, 0, 0, 0];
    const updates: { from: number; to: number; text: string }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'heading') return;
      if (node.attrs.headingKind === 'structural') return;

      const level = node.attrs.level as number;

      counters[level - 1] += 1;

      for (let i = level; i < counters.length; i += 1) {
        counters[i] = 0;
      }

      const number = counters.slice(0, level).filter(Boolean).join('.');

      const cleanText = node.textContent
        .replace(/^\d+(\.\d+)*\s+/u, '');

      updates.push({
        from: pos + 1,
        to: pos + node.nodeSize - 1,
        text: `${number} ${cleanText || 'Заголовок'}`,
      });
    });

    if (!updates.length) return;

    let tr = editor.state.tr;
    let changed = false;

    updates.reverse().forEach(update => {
      const currentText = editor.state.doc.textBetween(update.from, update.to);

      if (currentText !== update.text) {
        tr = tr.insertText(update.text, update.from, update.to);
        changed = true;
      }
    });

    if (changed) {
      editor.view.dispatch(tr);
    }
  };

  const normalizeLists = (editor: Editor) => {
    const updates: { from: number; to: number; text: string }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'bulletList' && node.type.name !== 'orderedList') return;

      const listItems: { item: typeof node; pos: number }[] = [];

      node.forEach((listItem, offset) => {
        if (listItem.type.name === 'listItem') {
          listItems.push({
            item: listItem,
            pos: pos + 1 + offset,
          });
        }
      });

      listItems.forEach(({ item, pos: itemPos }, index) => {
        const isLast = index === listItems.length - 1;
        const requiredEnding = isLast ? '.' : ';';

        item.forEach((child, offset) => {
          if (child.type.name !== 'paragraph') return;

          const paragraphPos = itemPos + 1 + offset;
          const from = paragraphPos + 1;
          const to = paragraphPos + child.nodeSize - 1;

          const text = editor.state.doc.textBetween(from, to).trim();
          if (!text) return;

          const normalizedText = text.replace(/[.;]\s*$/u, '') + requiredEnding;

          if (text !== normalizedText) {
            updates.push({ from, to, text: normalizedText });
          }
        });
      });
    });

    if (!updates.length) return;

    let tr = editor.state.tr;
    let changed = false;

    updates.reverse().forEach(update => {
      tr = tr.insertText(update.text, update.from, update.to);
      changed = true;
    });

    if (changed) {
      editor.view.dispatch(tr);
    }
  };

  const STRUCTURAL_TITLES = [
    'РЕФЕРАТ',
    'АННОТАЦИЯ',
    'СОДЕРЖАНИЕ',
    'ВВЕДЕНИЕ',
    'ЗАКЛЮЧЕНИЕ',
    'СПИСОК СОКРАЩЕНИЙ',
    'СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ',
    'ПРИЛОЖЕНИЕ',
  ];

  const APPENDIX_LETTERS = [
    'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'И', 'К', 'Л',
    'М', 'Н', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х'
  ];

  const renumberAppendices = (editor: Editor) => {
    const updates: { from: number; to: number; text: string }[] = [];

    let appendixIndex = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'heading') return;
      if (node.attrs.headingKind !== 'structural') return;

      const text = node.textContent.trim().toUpperCase();

      if (!text.startsWith('ПРИЛОЖЕНИЕ')) return;

      const letter =
        APPENDIX_LETTERS[appendixIndex] ||
        APPENDIX_LETTERS[APPENDIX_LETTERS.length - 1];

      const expected = `ПРИЛОЖЕНИЕ ${letter}`;

      if (node.textContent !== expected) {
        updates.push({
          from: pos + 1,
          to: pos + node.nodeSize - 1,
          text: expected,
        });
      }

      appendixIndex += 1;
    });

    if (!updates.length) return;

    let tr = editor.state.tr;

    updates.reverse().forEach(update => {
      tr = tr.insertText(update.text, update.from, update.to);
    });

    editor.view.dispatch(tr);
  };

  const normalizeStructuralHeadings = (editor: Editor) => {
    const updates: { from: number; to: number; text: string }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'heading') return;
      if (node.attrs.headingKind !== 'structural') return;

      const current = node.textContent.trim().toUpperCase();

      if (current.startsWith('ПРИЛОЖЕНИЕ')) {
        return;
      }

      let original: string | undefined;

      STRUCTURAL_TITLES.forEach(title => {
        if (
          current.includes(title) ||
          title.includes(current)
        ) {
          original = title;
        }
      });

      if (!original) return;

      if (node.textContent !== original) {
        updates.push({
          from: pos + 1,
          to: pos + node.nodeSize - 1,
          text: original,
        });
      }
    });

    if (!updates.length) return;

    let tr = editor.state.tr;

    updates.reverse().forEach(update => {
      tr = tr.insertText(update.text, update.from, update.to);
    });

    editor.view.dispatch(tr);
  };

  const toTocTitle = (text: string) => {
    const value = text.trim();

    const structuralMap: Record<string, string> = {
      'РЕФЕРАТ': 'Реферат',
      'АННОТАЦИЯ': 'Аннотация',
      'СОДЕРЖАНИЕ': 'Содержание',
      'ВВЕДЕНИЕ': 'Введение',
      'ЗАКЛЮЧЕНИЕ': 'Заключение',
      'СПИСОК СОКРАЩЕНИЙ': 'Список сокращений',
      'СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ': 'Список использованных источников',
      'ПРИЛОЖЕНИЕ': 'Приложение',
    };

    const appendixMatch = value.match(/^ПРИЛОЖЕНИЕ\s+([А-ЯA-Z])$/u);

    if (appendixMatch) {
      return `Приложение ${appendixMatch[1]}`;
    }

    return structuralMap[value.toUpperCase()] || value;
  };

  const buildTableOfContents = (editor: Editor) => {
    const items: string[] = [];

    editor.state.doc.descendants((node) => {
      if (node.type.name !== 'heading') return;

      const text = node.textContent.trim();
      if (!text) return;
      if (text.toUpperCase() === 'СОДЕРЖАНИЕ') return;

      const tocText = toTocTitle(text)
        .replace(/\s*[—–-]\s*$/u, '')
        .replace(/\s*[—–-]\s*\d*$/u, '')
        .trim();

      items.push(tocText);
    });

    return items;
  };

  const updateTableOfContents = (editor: Editor) => {
    let tocHeadingPos: number | null = null;
    const deleteRanges: { from: number; to: number }[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === 'heading' &&
        node.attrs.headingKind === 'structural' &&
        node.textContent.trim().toUpperCase() === 'СОДЕРЖАНИЕ'
      ) {
        tocHeadingPos = pos;
        return false;
      }
    });

    if (tocHeadingPos === null) return;

    let afterTocHeading = tocHeadingPos + editor.state.doc.nodeAt(tocHeadingPos)!.nodeSize;

    editor.state.doc.nodesBetween(afterTocHeading, editor.state.doc.content.size, (node, pos) => {
      if (node.type.name !== 'paragraph') return false;

      const isTocItem = node.attrs.class === 'toc-item';

      if (!isTocItem) return false;

      deleteRanges.push({
        from: pos,
        to: pos + node.nodeSize,
      });

      return false;
    });

    const items = buildTableOfContents(editor);
    const cleanTocItem = (item: string) =>
      item
        .replace(/\s*[—–-]\s*$/u, '')
        .replace(/\s*[—–-]\s*\d*$/u, '')
        .trim();

    const content = items.length
      ? items.map(item => ({
          type: 'paragraph',
          attrs: { class: 'toc-item' },
          content: [
            {
              type: 'text',
              text: cleanTocItem(item),
            },
          ],
        }))
      : [{
          type: 'paragraph',
          attrs: { class: 'toc-item' },
          content: [
            {
              type: 'text',
              text: 'Содержание будет сформировано автоматически',
            },
          ],
        }];

    let tr = editor.state.tr;

    deleteRanges.reverse().forEach(range => {
      tr = tr.delete(range.from, range.to);
    });

    tr = tr.insert(
      afterTocHeading,
      editor.schema.nodeFromJSON({
        type: 'doc',
        content,
      }).content
    );

    if (tr.docChanged) {
      editor.view.dispatch(tr);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
      }),
      Heading.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            headingKind: {
              default: 'numbered',
              parseHTML: element => element.getAttribute('data-heading-kind') || 'numbered',
              renderHTML: attributes => ({
                'data-heading-kind': attributes.headingKind,
              }),
            },
          };
        },
      }).configure({
        levels: [1, 2, 3, 4],
      }),
      Paragraph.extend({
        addAttributes() {
          return {
            class: {
              default: null,
              parseHTML: element => element.getAttribute('class'),
              renderHTML: attributes => {
                if (!attributes.class) return {};
                return { class: attributes.class };
              },
            },
          };
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
      normalizeStructuralHeadings(editor);
      renumberAppendices(editor);

      renumberNumberedHeadings(editor);
      renumberTableTitles(editor);
      normalizeLists(editor);
      updateTableOfContents(editor);

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

    setTimeout(() => renumberTableTitles(editor), 0);
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

      abstract:
        '<h1 data-heading-kind="structural">РЕФЕРАТ</h1><p></p>',

      annotation:
        '<h1 data-heading-kind="structural">АННОТАЦИЯ</h1><p></p>',

      toc: `
        <h1 data-heading-kind="structural">СОДЕРЖАНИЕ</h1>
        <p class="toc-item">Содержание будет сформировано автоматически</p>
        <p></p>
        `,

      intro:
        '<h1 data-heading-kind="structural">ВВЕДЕНИЕ</h1><p></p>',

      conclusion:
        '<h1 data-heading-kind="structural">ЗАКЛЮЧЕНИЕ</h1><p></p>',

      abbreviations:
        '<h1 data-heading-kind="structural">СПИСОК СОКРАЩЕНИЙ</h1><p></p>',

      bibliography:
        '<h1 data-heading-kind="structural">СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ</h1><p></p>',

      appendix:
        '<h1 data-heading-kind="structural">ПРИЛОЖЕНИЕ</h1><p></p>',

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
      { type: 'abstract', label: 'Реферат', icon: Heading1 },
      { type: 'annotation', label: 'Аннотация', icon: Heading1 },
      { type: 'toc', label: 'Содержание', icon: Heading1 },
      { type: 'intro', label: 'Введение', icon: Heading1 },
      { type: 'conclusion', label: 'Заключение', icon: Heading1 },
      { type: 'abbreviations', label: 'Список сокращений', icon: Heading1 },
      { type: 'bibliography', label: 'Список источников', icon: Heading1 },
      { type: 'appendix', label: 'Приложение', icon: Heading1 },
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