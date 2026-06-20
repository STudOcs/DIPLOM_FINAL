// src/shared/ui/Badge.tsx
import { DocStatus } from '../../entities/document/model/types';

const statusClasses: Record<DocStatus, string> = {
  IDLE: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-blue-100 text-blue-700 animate-pulse',
  RUNNING: 'bg-blue-100 text-blue-700 animate-pulse',
  SUCCESS: 'bg-green-100 text-green-700',
  ERROR: 'bg-red-100 text-red-700',

  not_compiled: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  compiled: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  compiling: 'bg-blue-100 text-blue-700 animate-pulse',
};

const statusLabels: Record<DocStatus, string> = {
  IDLE: 'Не скомпилирован',
  PENDING: 'В очереди',
  RUNNING: 'Сборка...',
  SUCCESS: 'Готов',
  ERROR: 'Ошибка',

  not_compiled: 'Не скомпилирован',
  draft: 'Черновик',
  compiled: 'Готов',
  error: 'Ошибка',
  compiling: 'Сборка...',
};

export const Badge = ({ status }: { status: DocStatus }) => (
  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusClasses[status] || statusClasses.draft}`}>
    {statusLabels[status] || statusLabels.draft}
  </span>
);