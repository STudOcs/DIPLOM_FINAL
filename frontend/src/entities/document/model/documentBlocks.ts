export type BlockType = 'title' | 'toc' | 'intro' | 'main' | 'conclusion' | 'biblio' | 'appendix';

export interface DocBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string; // HTML контент для TipTap
}

export const INITIAL_BLOCKS: DocBlock[] = [
  { id: '1', type: 'title', title: 'Титульный лист', content: '' },
  { id: '2', type: 'intro', title: 'Введение', content: '<h1>Введение</h1><p>Текст введения...</p>' },
  { id: '3', type: 'main', title: 'Основная часть', content: '<h1>Глава 1</h1><p>Текст главы...</p>' },
  { id: '4', type: 'conclusion', title: 'Заключение', content: '<h1>Заключение</h1>' },
];