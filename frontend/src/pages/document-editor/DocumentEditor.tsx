// src/pages/document-editor/DocumentEditor.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Loader2, Check, Play, Download, FileText, ArrowLeft, FileDown, FileCode2 } from 'lucide-react';
import { htmlToLatex } from '../../shared/lib/latex/htmlToLatex';
import { latexToHtml } from '../../shared/lib/latex/latexToHtml';
import { TipTapEditor } from '../../features/document-editor/ui/TipTapEditor';
import { LatexCodeEditor } from '../../features/document-editor/ui/LatexCodeEditor';
import { DocumentItem, TemplateItem, DocumentBlock } from '../../entities/document/model/types';
import { documentService } from '../../shared/api/documentService';
import { authService, TitleData } from '../../shared/api/authService';
import { $api } from '../../shared/api/base';
import {
  htmlToDocumentBlocks,
  documentBlocksToHtml,
} from '../../features/document-editor/lib/documentBlocksHtml';

export type ImageRegistry = Record<string, string>; 

const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  
  const [editorInstance, setEditorInstance] = useState<any>(null); 
  // Состояния данных
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [userData, setUserData] = useState<TitleData | null>(null);
  const [content, setContent] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [isSyncingCode, setIsSyncingCode] = useState(false);
  const [registry, setRegistry] = useState<ImageRegistry>({});
  
  // Состояния интерфейса
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const [editorMode, setEditorMode] = useState<'Визуал' | 'LaTeX'>('Визуал');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef<string>('');
  const isInitialLoadFinished = useRef(false);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
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
        
        const initial =
          Array.isArray(docData.content_json) && docData.content_json.length > 0
            ? documentBlocksToHtml(docData.content_json)
            : (docData.latex_source ? latexToHtml(docData.latex_source, {}) : '');
        
        setContent(initial);

        lastSavedContent.current = initial;
        isInitialLoadFinished.current = true;

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

  const switchToLatexMode = async () => {
    if (!doc?.doc_id) return;

    try {
      setIsSyncingCode(true);

      const data = await documentService.getRawCode(doc.doc_id);

      setRawCode(data.raw_latex);
      setEditorMode('LaTeX');
    } catch (err) {
      console.error('Ошибка загрузки RAW LaTeX:', err);
      alert('Не удалось загрузить LaTeX-код');
    } finally {
      setIsSyncingCode(false);
    }
  };

  const switchToVisualMode = async () => {
    if (!doc?.doc_id) return;

    try {
      setIsSyncingCode(true);

      const updatedDoc = await documentService.syncCode(doc.doc_id, rawCode);

      setDoc(updatedDoc);

      const updatedHtml = Array.isArray(updatedDoc.content_json)
        ? documentBlocksToHtml(updatedDoc.content_json)
        : '';

      setContent(updatedHtml);
      lastSavedContent.current = updatedHtml;

      setEditorMode('Визуал');
    } catch (err) {
      console.error('Ошибка синхронизации RAW LaTeX:', err);
      alert('Не удалось синхронизировать LaTeX-код');
    } finally {
      setIsSyncingCode(false);
    }
  };

  const handleSave = useCallback(
    async (silent = false): Promise<DocumentItem | undefined> => {
      if (!doc || !id) return;

      if (!silent) {
        setSaveStatus('saving');
      }

      try {
        const currentTemplate = templates.find(t => t.id === doc.template_id);
        if (editorMode === 'LaTeX') {
          const updatedDoc = await documentService.syncCode(doc.doc_id, rawCode);

          setDoc(updatedDoc);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 2000);

          return updatedDoc;
        }

        const finalHtml = content;
        const blocks: DocumentBlock[] = htmlToDocumentBlocks(finalHtml);

        const { latex } = isCodeMode
          ? { latex: content }
          : htmlToLatex(
              content,
              registry,
              currentTemplate?.latex_preambula_tmp,
              userData
            );

        const updatedDoc = await documentService.update(doc.doc_id, {
          title: doc.title,
          content_json: blocks,
          latex_source: latex,
        });

        setDoc(updatedDoc);
        lastSavedContent.current = content;

        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);

        return updatedDoc;
      } catch (err) {
        console.error("Ошибка сохранения:", err);
        setSaveStatus('error');

        if (!silent) {
          alert("Ошибка сохранения");
        }

        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    },
    [doc, id, templates, isCodeMode, content, registry, userData]
  );

  useEffect(() => {
    if (!isInitialLoadFinished.current) return;
    if (!doc?.doc_id) return;
    if (isLoading) return;
    if (isCompiling) return;

    if (content === lastSavedContent.current) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    setSaveStatus('saving');

    autoSaveTimer.current = setTimeout(() => {
      handleSave(true);
    }, 1500);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [content, doc?.doc_id, isLoading, isCompiling, handleSave]);

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

  const getCompilationBadge = () => {
    const status = doc?.compilation_status;

    if (isCompiling || status === 'PENDING' || status === 'RUNNING') {
      return {
        text: status === 'PENDING' ? 'В очереди' : 'Компиляция...',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClassName: 'bg-blue-500 animate-pulse',
      };
    }

    if (status === 'SUCCESS') {
      return {
        text: 'PDF готов',
        className: 'bg-green-50 text-green-700 border-green-200',
        dotClassName: 'bg-green-500',
      };
    }

    if (status === 'ERROR') {
      return {
        text: 'Ошибка компиляции',
        className: 'bg-red-50 text-red-700 border-red-200',
        dotClassName: 'bg-red-500',
      };
    }

    return {
      text: 'Не скомпилирован',
      className: 'bg-gray-50 text-gray-600 border-gray-200',
      dotClassName: 'bg-gray-400',
    };
  };

  const startPollingStatus = (docId: number) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      try {
        const data = await documentService.getCompileStatus(docId);

        setDoc(prev =>
          prev
            ? {
                ...prev,
                compilation_status: data.status,
                compilation_log: data.log || '',
              }
            : prev
        );

        console.log("Current status:", data.status);

        if (data.status === 'PENDING' || data.status === 'RUNNING') {
          return;
        }

        if (pollingInterval.current) clearInterval(pollingInterval.current);

        const updatedDoc = await documentService.getById(docId.toString());
        setDoc(updatedDoc);
        setIsCompiling(false);

        if (data.status === 'SUCCESS') {
          if (data.pdf_url) {
            setPdfUrl(data.pdf_url);
          }

          setIsCompiling(false);
          return;
        }

        if (data.status === 'ERROR') {
          alert(data.log || "Ошибка компиляции");
          console.error("Log:", data.log);
        }
      } catch (err) {
        console.error("Ошибка при опросе статуса:", err);
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setIsCompiling(false);
      }
    }, 2000);
  };

  const handleDownload = async () => {
    if (!doc?.doc_id) return;

    try {
      const status = await documentService.getCompileStatus(doc.doc_id);

      if (status.status !== 'SUCCESS' || !status.pdf_url) {
        alert('PDF ещё не готов для скачивания');
        return;
      }

      const link = document.createElement('a');
      link.href = status.pdf_url;
      link.download = `${doc.title || 'document'}.pdf`;
      link.target = '_blank';

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Ошибка скачивания PDF:', err);
      alert('Не удалось скачать PDF');
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
      {/* className="h-14 bg-white border-b flex items-center px-4 shrink-0 justify-between z-50" */}
      <header>
        <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">

            <div className="flex items-center gap-4 min-w-0">

              <button
                onClick={() => navigate('/dashboard')}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded-lg
                  text-gray-700
                  hover:bg-orange-50
                  hover:text-orange-600
                "
              >
                <ArrowLeft size={18} />
                К документам
              </button>

              <div className="w-px h-6 bg-gray-200" />

              <div className="font-medium truncate">
                {doc?.title}
              </div>

              <div className="text-xs text-gray-400 min-w-[120px]">
                {saveStatus === 'saving' && 'Сохранение...'}
                {saveStatus === 'success' && 'Сохранено'}
                {saveStatus === 'error' && 'Ошибка сохранения'}
              </div>

            </div>

            <div className="flex items-center gap-2">

              <div className="flex rounded-lg border overflow-hidden">

                <button
                  onClick={switchToVisualMode}
                  disabled={editorMode === 'Визуал' || isSyncingCode}
                  className={`px-3 py-2 text-sm ${
                    editorMode === 'Визуал'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-white text-gray-600'
                  } disabled:opacity-60`}
                >
                  Визуал
                </button>

                <button
                  onClick={switchToLatexMode}
                  disabled={editorMode === 'LaTeX' || isSyncingCode}
                  className={`px-3 py-2 text-sm ${
                    editorMode === 'LaTeX'
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-white text-gray-600'
                  } disabled:opacity-60`}
                >
                  LaTeX
                </button>
              </div>

              <button
                onClick={() => handleSave(false)}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded-lg
                  bg-orange-600
                  text-white
                  hover:bg-orange-700
                "
              >
                <Save size={16} />
                Сохранить
              </button>

              <button
                onClick={handleCompile}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded-lg
                  border
                  hover:bg-orange-50
                  hover:text-orange-600
                "
              >
                <FileCode2 size={16} />
                Компилировать
              </button>

              {(() => {
                const badge = getCompilationBadge();

                return (
                  <div
                    className={`
                      flex items-center gap-2
                      px-3 py-2
                      rounded-lg border
                      text-xs font-medium
                      ${badge.className}
                    `}
                    title="Статус компиляции PDF"
                  >
                    <span className={`w-2 h-2 rounded-full ${badge.dotClassName}`} />
                    {badge.text}
                  </div>
                );
              })()}

              <button
                onClick={handleDownload}
                disabled={doc?.compilation_status !== 'SUCCESS'}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded-lg
                  border
                  hover:bg-orange-50
                  hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <FileDown size={16} />
                Скачать PDF
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Основная рабочая область: flex-1, тоже overflow-hidden */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Контейнер редактора */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#f8f9fa]">
          

          <div className="flex-1 overflow-hidden">

            {editorMode === 'Визуал' && (
              <TipTapEditor 
                content={content} 
                onChange={setContent} 
                onEditorInit={setEditorInstance}
                pdfUrl={pdfUrl}
                isCompiling={isCompiling}
                compilationStatus={doc?.compilation_status}
                compilationLog={doc?.compilation_log}
              />
            )}

            {editorMode === 'LaTeX' && (
              <LatexCodeEditor
                code={rawCode}
                onChange={setRawCode}
              />
            )}

          </div>
          
        </main>

      </div>
    </div>
  );
};

export default DocumentEditor;