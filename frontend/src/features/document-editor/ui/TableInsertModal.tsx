import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (data: { title: string; rows: number; cols: number }) => void;
}

export const TableInsertModal = ({ open, onClose, onInsert }: Props) => {
  const [title, setTitle] = useState('Название таблицы');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  if (!open) return null;

  const submit = () => {
    onInsert({
      title: title.trim() || 'Название таблицы',
      rows: Math.max(1, rows),
      cols: Math.max(1, cols),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold">Создание таблицы</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <label className="block text-sm font-medium mb-1">Название таблицы</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Строки</label>
            <input
              type="number"
              min={1}
              max={30}
              value={rows}
              onChange={e => setRows(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Столбцы</label>
            <input
              type="number"
              min={1}
              max={15}
              value={cols}
              onChange={e => setCols(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-gray-100">
            Отмена
          </button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700">
            Вставить
          </button>
        </div>
      </div>
    </div>
  );
};