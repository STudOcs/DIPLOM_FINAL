import { $api } from './base';
import { DocumentItem, TemplateItem, CreateDocumentDto } from '../../entities/document/model/types';

type ApiDocumentItem = DocumentItem & {
  id?: number;
  updated_at?: string;
  raw_latex?: string;
};

const normalizeDocument = (doc: ApiDocumentItem): DocumentItem => ({
  ...doc,
  doc_id: doc.doc_id ?? doc.id ?? 0,
  latex_source: doc.latex_source ?? doc.raw_latex ?? '',
  changes_data_doc: doc.changes_data_doc ?? doc.updated_at ?? '',
  compilation_status: doc.compilation_status ?? 'not_compiled',
});

export const documentService = {
  async getAll(): Promise<DocumentItem[]> {
    const { data } = await $api.get<ApiDocumentItem[]>('/documents/');
    return data.map(normalizeDocument);
  },

  async getById(id: string): Promise<DocumentItem> {
    const { data } = await $api.get<ApiDocumentItem>(`/documents/${id}/`);
    return normalizeDocument(data);
  },

  async create(payload: CreateDocumentDto): Promise<DocumentItem> {
    const { data } = await $api.post<ApiDocumentItem>('/documents/', payload);
    return normalizeDocument(data);
  },

  async update(doc_id: number, payload: Partial<DocumentItem>): Promise<DocumentItem> {
    const { data } = await $api.patch<ApiDocumentItem>(`/documents/${doc_id}/`, payload);
    return normalizeDocument(data);
  },

  async delete(id: number): Promise<void> {
    await $api.delete(`/documents/${id}/`);
  },

  async getTemplates(): Promise<TemplateItem[]> {
    const { data } = await $api.get<TemplateItem[]>('/templates/');
    return data;
  },

  async compile(id: number): Promise<{ status: 'success' | 'error'; pdf_url?: string; log?: string }> {
    const { data } = await $api.post(`/documents/${id}/compile/`);
    return data;
  },

  async getCompileStatus(id: number): Promise<{ status: string; log: string }> {
    const { data } = await $api.get(`/documents/${id}/compile-status/`);
    return data;
  },

  async downloadPdf(docId: number, fileName: string) {
    const response = await $api.get(`/documents/${docId}/pdf/`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `${fileName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};