// src/entities/document/model/types.ts

export type CompilationStatus = 'not_compiled' | 'compiled' | 'success' | 'error' | 'compiling';

// Алиас для обратной совместимости с компонентом Badge
export type DocStatus = CompilationStatus | 'draft';



export interface DocumentItem {
  doc_id: number;
  name_doc: string;
  user_id: number;
  template_id: number;
  content_json: any;
  latex_source: string;
  creation_data_doc: string;
  changes_data_doc: string;
  pdf_path: string;
  compilation_status: CompilationStatus;
  compilation_log: string;
  pdf_generated_at: string;
}

export interface TemplateItem {
  template_id: number;
  name_tmp: string;
  definition_tmp: string;
  latex_preambula_tmp: string;
}