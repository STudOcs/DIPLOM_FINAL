import { Node, mergeAttributes } from '@tiptap/core';

// 1. Добавляем декларацию типов для TypeScript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    }
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(HTMLAttributes, { 'data-type': 'page-break', class: 'page-break' }), 
      ['span', {}, '']
    ];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({ type: this.name });
      },
    };
  },
});