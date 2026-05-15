import { Template } from '../model/types';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onSelect: (id: string) => void;
}

export const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
  // Безопасно получаем иконку из библиотеки
  const Icon = (Icons[template.icon as keyof typeof Icons] as LucideIcon) || Icons.File;

  return (
    <div 
      onClick={() => onSelect(template.id)}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center group"
    >
      <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
        <Icon size={32} />
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-2">{template.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-3">
        {template.description}
      </p>
    </div>
  );
};