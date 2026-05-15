// src/pages/document-editor/DocumentEditor.tsx
import { useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { htmlToLatex } from '../../shared/lib/latex/htmlToLatex';
import { latexToHtml } from '../../shared/lib/latex/latexToHtml';
import { DocumentSidebar } from '../../widgets/document-sidebar/ui/DocumentSidebar';
import { TipTapEditor } from '../../features/document-editor/ui/TipTapEditor';
import { LatexCodeEditor } from '../../features/document-editor/ui/LatexCodeEditor';
import { useParams } from 'react-router-dom';
import { Save, Loader2, Check, Play, Download } from 'lucide-react'; // Иконки
import { DocumentItem } from '../../entities/document/model/types';
import { documentService } from '../../shared/api/documentService';
import { FileText } from 'lucide-react';
import { TemplateItem } from '../../entities/document/model/types';
import { authService, TitleData } from '../../shared/api/authService';
import { $api } from '../../shared/api/base'; // Для прямого вызова получения блоба

export type ImageRegistry = Record<string, string>; 

const DocumentEditor = () => {
  // ЕДИНЫЙ КОНТЕНТ для всего документа
  const [content, setContent] = useState('<h1>Введение</h1><p>Начните писать...</p>');
  const [isCodeMode, setIsCodeMode] = useState(false);
  
  const [templates, setTemplates] = useState<TemplateItem[]>([]); // Храним шаблоны здесь
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [userData, setUserData] = useState<TitleData | null>(null);
  const [images, setImages] = useState<ImageRegistry>({});
  
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [registry, setRegistry] = useState<Record<string, string>>({});

  // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ PDF ---
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Пример в DocumentEditor.tsx
  const { latex, newRegistry } = htmlToLatex(content, registry);
  // И обратно
  const html = latexToHtml(content, registry);

  // Сайдбар теперь просто список-заглушка для навигации или вставки
  const [structure, setStructure] = useState([
    { id: '1', title: 'Титульный лист', type: 'title' },
    { id: '2', title: 'Введение', type: 'intro' },
    { id: '3', title: 'Основная часть', type: 'main' },
  ]);

  // Вспомогательная функция получения текущего шаблона
  const getCurrentTemplate = () => {
    return templates.find(t => t.template_id === doc?.template_id);
  };

  // Загрузка данных
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      Promise.all([
        documentService.getById(id),
        documentService.getTemplates(),
        authService.getTitleData()
      ])
        .then(([docData, templatesData, titleData]) => {
          setDoc(docData);
          setTemplates(templatesData);
          setUserData(titleData);

          const initial = docData.content_json?.html || latexToHtml(docData.latex_source, {});
          setContent(initial);

          // Если уже скомпилирован — загружаем превью сразу
          if (docData.compilation_status === 'compiled') {
            loadPdfPreview(docData.doc_id);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  // Функция загрузки PDF через Blob (чтобы работала авторизация)
  const loadPdfPreview = async (docId: number) => {
    try {
      const response = await $api.get(`/documents/${docId}/pdf`, {
        responseType: 'blob', // Важно!
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error("Ошибка загрузки PDF файла:", err);
    }
  };

  const handleSave = async () => {
    if (!doc || !id) return;
    setSaveStatus('saving');

    try {
      let finalHtml = '';
      let finalLatex = '';
      const currentTemplate = getCurrentTemplate();

      if (isCodeMode) {
        // Если мы в LaTeX моде — сохраняем текст как есть
        finalLatex = content;
        finalHtml = latexToHtml(content, registry);
      } else {
        // Если в Визуале — РЕКОНСТРУИРУЕМ полный LaTeX с преамбулой
        const { latex } = htmlToLatex(
          content, 
          registry, 
          currentTemplate?.latex_preambula_tmp, 
          userData
        );
        finalHtml = content;
        finalLatex = latex;
      }

      const updatedDoc = await documentService.update(Number(id), {
        content_json: { html: finalHtml },
        latex_source: finalLatex
      });

      setDoc(updatedDoc);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return updatedDoc;
    } catch (err) {
      alert("Ошибка при сохранении");
      setSaveStatus('idle');
      throw err;
    }
  };

  // --- Функция опроса статуса ---
  // Внутри DocumentEditor.tsx находим функцию startPollingStatus

  const startPollingStatus = (docId: number) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      try {
        const data = await documentService.getCompileStatus(docId);
        
        // Логируем для отладки, чтобы видеть что присылает бэк
        console.log("Current status:", data.status);

        // Если статус уже не 'compiling', значит процесс завершен
        if (data.status !== 'compiling') {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          
          const updatedDoc = await documentService.getById(docId.toString());
          setDoc(updatedDoc);
          setIsCompiling(false);

          // ИСПРАВЛЕННАЯ ПРОВЕРКА: учитываем 'success' от бэкенда
          if (data.status === 'compiled' || data.status === 'success') {
            alert("Документ успешно скомпилирован!");
            // Загружаем PDF в превью
            loadPdfPreview(docId); 
          } else {
            alert("Ошибка компиляции. Проверьте LaTeX код.");
            console.error("Log:", data.log);
          }
        }
      } catch (err) {
        console.error("Ошибка при опросе статуса:", err);
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setIsCompiling(false);
      }
    }, 2000);
  };

  const handleCompile = async () => {
    if (!doc) return;
    try {
      setIsCompiling(true);
      // 1. Сохраняем
      const savedDoc = await handleSave();
      if (!savedDoc) {
        setIsCompiling(false);
        return;
      }

      // 2. Запускаем компиляцию
      await documentService.compile(savedDoc.doc_id);
      
      // 3. Начинаем опрос статуса
      startPollingStatus(savedDoc.doc_id);
      
    } catch (err) {
      console.error(err);
      setIsCompiling(false);
      alert("Не удалось запустить компиляцию");
    }
  };

  const handleDownload = async () => {
    // ВАЖНО: проверяем статус из объекта doc
    if (!doc || doc.compilation_status !== 'success') {
      alert("Файл еще не готов для скачивания");
      return;
    }
    try {
      await documentService.downloadPdf(doc.doc_id, doc.name_doc || 'document');
    } catch (err) {
      alert("Ошибка при скачивании файла");
    }
  };

  const toggleMode = () => {
    if (!isCodeMode) {
      const currentTemplate = getCurrentTemplate();
      const { latex, newRegistry } = htmlToLatex(
        content, 
        registry, 
        currentTemplate?.latex_preambula_tmp,
        userData
      );
      setRegistry(newRegistry);
      setContent(latex);
    } else {
      setContent(latexToHtml(content, registry));
    }
    setIsCodeMode(!isCodeMode);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

  return (
    // Весь экран: h-screen, запрещаем скролл
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 font-sans">
      
      {/* Хедер: фиксированный */}
      <header className="h-14 bg-white border-b flex items-center px-4 shrink-0 justify-between z-50">
        <div className="font-bold text-orange-600 tracking-tighter text-xl">СФУ.ДОК</div>
        <div className="flex gap-4 items-center">
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => isCodeMode && toggleMode()} 
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!isCodeMode ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
              >
                Визуал
              </button>
              <button 
                onClick={() => !isCodeMode && toggleMode()} 
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isCodeMode ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
              >
                LaTeX
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
            >
              {saveStatus === 'saving' ? <Loader2 size={20} className="animate-spin" /> : saveStatus === 'success' ? <Check size={20} className="text-green-600" /> : <Save size={20} />}
            </button>

            <button 
              onClick={handleCompile}
              disabled={isCompiling || doc?.compilation_status === 'compiling'}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
            >
              {isCompiling ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
              {isCompiling ? 'Сборка...' : 'Компиляция'}
            </button>

            {/* Скачивание */}
            <button 
              onClick={handleDownload}
              // Добавляем проверку на 'success'
              disabled={!(doc?.compilation_status === 'compiled' || doc?.compilation_status === 'success') || isCompiling}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                (doc?.compilation_status === 'compiled' || doc?.compilation_status === 'success') && !isCompiling
                  ? 'bg-gray-800 hover:bg-black text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <Download size={16} />
              Скачать PDF
            </button>
        </div>
      </header>

      {/* Основная рабочая область: flex-1, тоже overflow-hidden */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Сайдбар: свой скролл внутри */}
        {/* <DocumentSidebar 
          blocks={structure as any} 
          onReorderBlocks={setStructure as any}
          activeBlockId="" 
          onSelectBlock={() => {}} // В будущем: скролл к заголовку в TipTap
          onAddBlock={() => {}} 
          onDeleteBlock={() => {}}
        /> */}

        {/* Контейнер редактора */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#f8f9fa]">
          
          {isCodeMode ? (
            // РЕЖИМ КОДА: свой скролл внутри LatexCodeEditor
            <div className="flex-1 overflow-hidden p-4">
               <LatexCodeEditor code={content} onChange={setContent} />
            </div>
          ) : (
            // ВИЗУАЛЬНЫЙ РЕЖИМ: скролл внутри TipTapEditor
            <TipTapEditor 
               content={content} 
               onChange={setContent} 
               onEditorInit={setEditorInstance} 
            />
          )}
          
        </main>

        {/* Предпросмотр: фиксированный - ОБНОВЛЕН ДЛЯ ОТОБРАЖЕНИЯ PDF
        <aside className="w-[450px] border-l bg-white hidden 2xl:flex flex-col relative shrink-0">
           {isCompiling ? (
             <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <Loader2 size={48} className="text-orange-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Генерируем PDF...</p>
                <p className="text-xs text-gray-400 mt-1">Это может занять до 10 секунд</p>
             </div>
           ) : pdfUrl ? (
             <iframe 
               src={pdfUrl} 
               className="w-full h-full border-none shadow-inner"
               title="PDF Preview"
             />
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <FileText size={64} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">Документ еще не скомпилирован</p>
                <p className="text-xs mt-2">Нажмите «Компиляция», чтобы создать PDF файл по стандартам СТО СФУ</p>
             </div>
           )}

            Окно логов при ошибке 
           {!isCompiling && doc?.compilation_status === 'error' && (
             <div className="absolute bottom-0 left-0 right-0 max-h-[200px] overflow-y-auto bg-red-950 text-red-200 p-4 font-mono text-[10px] border-t border-red-800">
                <div className="font-bold uppercase mb-2 border-b border-red-800 pb-1 text-red-400">LaTeX Error Log:</div>
                {doc.compilation_log}
             </div>
           )}
        </aside> */}
      </div>
    </div>
  );
};

export default DocumentEditor;