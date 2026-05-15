// src/features/document-editor/ui/TipTapEditor.tsx
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { DOMParser } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import { useDroppable } from '@dnd-kit/core';
import TextAlign from '@tiptap/extension-text-align';

import { PageBreak } from '../model/PageBreak';
import { Figure, Caption } from '../model/Figure';
import { EditorToolbar } from './EditorToolbar';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onEditorInit: (editor: any) => void;
}

export const TipTapEditor = ({ content, onChange, onEditorInit }: TipTapEditorProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'editor-drop-zone',
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Image.configure({ allowBase64: true }),
      Figure,
      Caption,
      PageBreak,
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Placeholder.configure({ placeholder: 'Перетащите блок сюда...' }),
      TextAlign.configure({
        types: ['heading', 'paragraph'], // К каким тегам применять выравнивание
        alignments: ['left', 'center', 'right', 'justify'], // Доступные режимы
        defaultAlignment: 'left',
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor) onEditorInit(editor);
  }, [editor]);

  return (
    // flex-col h-full overflow-hidden: контейнер не скроллится
    <div ref={setNodeRef} className="flex flex-col h-full overflow-hidden relative">
      
      {/* Тулбар: ВСЕГДА СВЕРХУ (shrink-0) */}
      <div className="shrink-0 bg-white border-b z-20 shadow-sm">
        <EditorToolbar editor={editor} />
      </div>
      
      {/* Область скролла: flex-1 overflow-y-auto */}
      <div className="flex-1 overflow-y-auto editor-scroll-container py-12 px-4 scroll-smooth bg-gray-200/50">
        
        {/* Лист А4: центрирован, фиксированная ширина */}
        <div className="mx-auto w-[210mm] min-h-[297mm] bg-white shadow-xl mb-20 border border-gray-200">
          <EditorContent editor={editor} className="prose-container" />
        </div>
        
      </div>

    </div>
  );
};