// src/shared/ui/Badge.tsx
import { DocStatus } from '../../entities/document/model/types';

const statusStyles: Record<DocStatus, string> = {
  not_compiled: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  compiled: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  compiling: 'bg-blue-100 text-blue-700 animate-pulse',
  success: 'bg-green-100 text-green-700',
};

const statusLabels: Record<DocStatus, string> = {
  not_compiled: 'Черновик',
  draft: 'Черновик',
  compiled: 'Готов',
  error: 'Ошибка',
  compiling: 'Сборка...',
  success: 'Готов',
};

export const Badge = ({ status }: { status: DocStatus }) => (
  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}>
    {statusLabels[status]}
  </span>
);