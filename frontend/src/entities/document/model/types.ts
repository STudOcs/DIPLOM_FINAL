// src/entities/document/model/types.ts

export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'table'
  | 'list'
  | 'code'
  | 'formula'
  | 'equation'
  | 'title';

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: {
    text?: string;
    level?: number;
    kind?: 'numbered' | 'structural';

    image_path?: string;
    url?: string;
    src?: string;
    file?: string;
    storage_path?: string;
    caption?: string;
    width?: number;

    rows?: string[][];
    column_spec?: string;

    ordered?: boolean;
    items?: string[];
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
  id: number;
  name: string;
  description: string;
  content_json: DocumentBlock[];
  latex_preambula_tmp: string;
}

export interface DocumentItem {
  doc_id: number;
  id?: number;
  title: string;
  template_id: number;
  content_json: DocumentBlock[];
  latex_source: string;
  compilation_status: CompilationStatus;
  compilation_log?: string;
  changes_data_doc: string;
  course_name?: string;
  lab_number?: number;
}

export interface CreateDocumentDto {
  title: string;
  template_id: number;
  lab_number?: number;
  course_name?: string;
}