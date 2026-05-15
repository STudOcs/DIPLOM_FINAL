import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export const FigureView = () => {
  return (
    <NodeViewWrapper className="custom-figure-wrapper group relative">
      {/* Контейнер для изображения (нередактируемый напрямую) */}
      <div className="flex justify-center border-2 border-transparent group-hover:border-orange-200 transition-all rounded-lg overflow-hidden">
        <NodeViewContent className="figure-content" />
      </div>
      
      {/* Текст подписи будет редактируемым, но привязанным */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        Рисунок
      </div>
    </NodeViewWrapper>
  );
};