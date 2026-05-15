export interface Template {
  id: string;
  title: string;
  description: string;
  icon: string; // Название иконки или путь
}

export const TEMPLATES: Template[] = [
  {
    id: 'course-work',
    title: 'Курсовая работа',
    description: 'Соответствует СТО СФУ 004-2018. Стандартный титульный лист и структура.',
    icon: 'Book',
  },
  {
    id: 'vkr-bachelor',
    title: 'ВКР Бакалавра',
    description: 'Выпускная квалификационная работа. Включает расширенный титульный лист.',
    icon: 'GraduationCap',
  },
  {
    id: 'practice-report',
    title: 'Отчет по практике',
    description: 'Упрощенная структура с упором на дневник и содержание работ.',
    icon: 'ClipboardList',
  },
  {
    id: 'scientific-article',
    title: 'Научная статья',
    description: 'Для публикации в вестнике СФУ. Двухколоночная верстка (опционально).',
    icon: 'FileText',
  },
];