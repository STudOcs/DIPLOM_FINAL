// src/shared/ui/Badge.tsx
import { DocStatus } from '../../entities/document/model/types';

const statusStyles: Record<DocStatus, string> = {
  not_compiled: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  compiled: 'bg-green-100 text-green-700',
  success: 'bg-green-100 text-green-700', // Добавлено
  error: 'bg-red-100 text-red-700',
  compiling: 'bg-blue-100 text-blue-700 animate-pulse',
};

const statusLabels: Record<DocStatus, string> = {
  not_compiled: 'Черновик',
  draft: 'Черновик',
  compiled: 'Готов',
  success: 'Готов',
  error: 'Ошибка',
  compiling: 'Сборка...',
};

export const Badge = ({ status }: { status: DocStatus }) => (
  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusStyles[status] || statusStyles.draft}`}>
    {statusLabels[status] || statusLabels.draft}
  </span>
);