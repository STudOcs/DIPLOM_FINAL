// src/entities/document/model/types.ts

// Алиас для обратной совместимости с компонентом Badge
export type DocStatus = CompilationStatus | 'draft';

export type BlockType = 'text' | 'image' | 'table' | 'code' | 'heading';

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: any;
}

export type CompilationStatus = 'not_compiled' | 'compiled' | 'success' | 'error' | 'compiling';

export interface DocumentItem {
  // Django использует id, но если в твоем JSON прилетает doc_id, используй его
  doc_id: number; 
  name_doc: string;
  template_id: number;
  content_json: DocumentBlock[]; // Это массив
  latex_source: string;
  compilation_status: CompilationStatus;
  compilation_log: string;
  changes_data_doc: string;
  creation_data_doc: string;
  // Поля для создания (из твоей доки)
  course_name?: string;
  lab_number?: string;
  record_book_number?: string;
}

export interface CreateDocumentDto {
  name_doc: string; // сопоставим с title
  template_id: number;
  content_json: DocumentBlock[];
}

export interface TemplateItem {
  template_id: number;
  name_tmp: string;
  definition_tmp: string;
  latex_preambula_tmp: string;
}