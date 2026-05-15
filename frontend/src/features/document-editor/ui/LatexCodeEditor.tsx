// src/features/document-editor/ui/LatexCodeEditor.tsx
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';

// Импортируем синтаксис LaTeX
import 'prismjs/components/prism-latex';
// Импортируем ТЕМНУЮ тему (Tomorrow Night)
import 'prismjs/themes/prism-tomorrow.css'; 

interface Props {
  code: string;
  onChange: (newCode: string) => void;
}

export const LatexCodeEditor = ({ code, onChange }: Props) => {
  return (
    <div className="h-full w-full bg-[#2d2d2d] rounded-lg border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
      {/* Панель с названием файла */}
      <div className="h-9 bg-[#1e1e1e] flex items-center px-4 justify-between shrink-0 border-b border-black/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">
            main.tex
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">UTF-8</span>
      </div>
      
      {/* Область редактора со скроллом */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={(code) => highlight(code, languages.latex, 'latex')}
          padding={20}
          className="font-mono text-sm leading-relaxed"
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight: '100%',
            // ВАЖНО: Цвет обычного текста (не команд)
            color: '#ccc', 
            backgroundColor: '#2d2d2d',
          }}
        />
      </div>
    </div>
  );
};