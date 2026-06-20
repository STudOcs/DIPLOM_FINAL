// src/entities/document/model/types.ts

export type BlockType = 'heading' | 'text' | 'image' | 'table' | 'code' | 'formula' | 'title';

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: {
    text?: string;
    level?: number;
    image_path?: string;
    caption?: string;
    width?: number;
    rows?: any[];
  };
}

export type CompilationStatus =
  | 'IDLE'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'ERROR'
  | 'not_compiled'
  | 'compiling'
  | 'compiled'
  | 'error';

export type DocStatus = CompilationStatus | 'draft'; 

export interface TemplateItem {
  id: number;           // В v1.1 бэк шлет "id"
  name: string;
  description: string;
  content_json: DocumentBlock[];
  latex_preambula_tmp: string; // Оставляем для генерации LaTeX
}

export interface DocumentItem {
  doc_id: number;
  id?: number;
  title: string;
  template_id: number;
  content_json: DocumentBlock[];
  latex_source: string; // Обязательное поле для синхронизации
  compilation_status: CompilationStatus;
  compilation_log?: string;
  changes_data_doc: string;
  // Поля метаданных
  course_name?: string;
  lab_number?: number;
}

export interface CreateDocumentDto {
  title: string;
  template_id: number;
  lab_number?: number;
  course_name?: string;
}