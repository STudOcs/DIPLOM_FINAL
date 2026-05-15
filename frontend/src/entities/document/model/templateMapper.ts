// src/entities/document/model/templateMapper.ts

export const getTemplateName = (id: number): string => {
  const templates: Record<number, string> = {
    1: 'Отчет по практике',
    2: 'ВКР Бакалавра',
    3: 'Курсовая работа',
    4: 'Научная статья'
  };
  return templates[id] || 'Документ';
};