// src/pages/document-editor/DocumentEditor.tsx
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Loader2, Check, Play, Download, FileText } from 'lucide-react';
import { htmlToLatex } from '../../shared/lib/latex/htmlToLatex';
import { latexToHtml } from '../../shared/lib/latex/latexToHtml';
import { TipTapEditor } from '../../features/document-editor/ui/TipTapEditor';
import { LatexCodeEditor } from '../../features/document-editor/ui/LatexCodeEditor';
import { DocumentItem, TemplateItem, DocumentBlock } from '../../entities/document/model/types';
import { documentService } from '../../shared/api/documentService';
import { authService, TitleData } from '../../shared/api/authService';
import { $api } from '../../shared/api/base';

export type ImageRegistry = Record<string, string>; 

const blocksToHtml = (blocks: DocumentBlock[]): string => {
  return blocks.map(block => {
    const textContent = block.content?.text || '';
    if (block.type === 'heading') {
      const level = block.content?.level || 1;
      return `<h${level}>${textContent}</h${level}>`;
    }
    if (block.type === 'text') {
      return textContent.startsWith('<') ? textContent : `<p>${textContent}</p>`;
    }
    return '';
  }).join('');
};

const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  
  const [editorInstance, setEditorInstance] = useState<any>(null); 
  // Состояния данных
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [userData, setUserData] = useState<TitleData | null>(null);
  const [content, setContent] = useState('');
  const [registry, setRegistry] = useState<ImageRegistry>({});
  
  // Состояния интерфейса
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  // Загрузка данных
  useEffect(() => {
    if (!id || id === 'undefined') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const loadData = async () => {
      try {
        // 1. Загружаем то, что ОБЯЗАТЕЛЬНО для работы редактора
        const [docData, templatesData] = await Promise.all([
          documentService.getById(id),
          documentService.getTemplates()
        ]);

        setDoc(docData);
        setTemplates(templatesData);
        
        const initial = Array.isArray(docData.content_json) && docData.content_json.length > 0
          ? blocksToHtml(docData.content_json)
          : (docData.latex_source ? latexToHtml(docData.latex_source, {}) : '');
        
        setContent(initial);

        // 2. Загружаем профиль отдельно. Если он упадет — редактор все равно будет работать
        try {
          const profile = await authService.getMe();
          const mappedUserData: TitleData = {
            last_name: profile?.last_name || '',
            first_name: profile?.first_name || '',
            middle_name: profile?.middle_name || '',
            initials: `${profile?.last_name || ''} ${(profile?.first_name?.[0] || '')}.${(profile?.middle_name?.[0] || '')}.`.trim(),
            group: profile?.student_group || '',
            student_card: profile?.student_card || '',
            department: profile?.department || ''
          };
          setUserData(mappedUserData);
        } catch (e) {
          console.warn("Профиль не загружен, титульник будет пуст", e);
        }

      } catch (err) {
        console.error("Ошибка загрузки документа:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);


  // Функция загрузки PDF через Blob (чтобы работала авторизация)
  const loadPdfPreview = async (docId: number) => {
    try {
      const response = await $api.get(`/documents/${docId}/pdf/`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfBlobUrl(url);
    } catch (err) {
      console.error("Ошибка загрузки PDF:", err);
    }
  };

  const handleSave = async (): Promise<DocumentItem | undefined> => {
    if (!doc || !id) return;
    setSaveStatus('saving');
    try {
      const currentTemplate = templates.find(t => t.id === doc.template_id);
      let finalHtml = isCodeMode ? latexToHtml(content, registry) : content;

      const blocks: DocumentBlock[] = [{
        id: "main-content",
        type: "text",
        content: { text: finalHtml }
      }];

      const { latex } = isCodeMode 
        ? { latex: content } 
        : htmlToLatex(content, registry, currentTemplate?.latex_preambula_tmp, userData);

      const updatedDoc = await documentService.update(doc.doc_id, {
        title: doc.title,
        content_json: blocks,
        latex_source: latex
      });

      setDoc(updatedDoc);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return updatedDoc;
    } catch (err) {
      setSaveStatus('idle');
      alert("Ошибка сохранения");
    }
  };

  const handleCompile = async () => {
    const savedDoc = await handleSave();
    if (!savedDoc) return;
    try {
      setIsCompiling(true);
      await documentService.compile(savedDoc.doc_id);
      startPollingStatus(savedDoc.doc_id);
    } catch (e) {
      setIsCompiling(false);
    }
  };

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

  const handleDownload = async () => {
    // ВАЖНО: проверяем статус из объекта doc
    if (!doc || doc.compilation_status !== 'success') {
      alert("Файл еще не готов для скачивания");
      return;
    }
    try {
      await documentService.downloadPdf(doc.doc_id, doc.title || 'document');
    } catch (err) {
      alert("Ошибка при скачивании файла");
    }
  };

  const toggleMode = async () => {
    if (!isCodeMode) {
      try {
        const { data } = await $api.get(`/documents/${doc?.doc_id}/raw_source/`);
        setContent(data.raw_latex);
        setIsCodeMode(true);
      } catch (e) {
        alert("Бэк еще не отдал LaTeX");
      }
    } else {
      try {
        const { data } = await $api.post(`/documents/${doc?.doc_id}/sync_raw/`, {
          latex_source: content 
        });
        // Если бэк вернул обновленный массив блоков
        const newHtml = data.content_json[0]?.content || '';
        setContent(newHtml);
        setIsCodeMode(false);
      } catch (e) {
        alert("Ошибка синхронизации LaTeX");
      }
    }
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