// src/features/document-editor/model/Figure.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FigureView } from '../ui/FigureView';

export const Caption = Node.create({
  name: 'caption',
  group: 'block',
  content: 'inline*',
  selectable: false, // Нельзя выбрать отдельно от фигуры
  parseHTML() { return [{ tag: 'figcaption' }] },
  renderHTML({ HTMLAttributes }) {
    return ['figcaption', mergeAttributes(HTMLAttributes, { class: 'figure-caption' }), 0];
  },
});

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'image caption', // Строгий порядок: картинка, затем подпись
  draggable: true,         // Разрешаем перетаскивание всего блока
  selectable: true,

  parseHTML() { return [{ tag: 'figure' }] },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { class: 'custom-figure' }), 0];
  },

  // Подключаем наш React-компонент
  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
});