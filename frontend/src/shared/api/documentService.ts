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
  compilation_status: doc.compilation_status ?? 'IDLE',
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

  async compile(id: number): Promise<{ status: string; task_id: string; document_id: number }> {
    const { data } = await $api.post(`/documents/${id}/compile/`);
    return data;
  },

  async getCompileStatus(id: number): Promise<{
    status: 'IDLE' | 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
    log?: string;
    pdf_url?: string | null;
  }> {
    const { data } = await $api.get(`/documents/${id}/status/`);
    return data;
  },

  async downloadPdf(docId: number, fileName: string) {
    const status = await this.getCompileStatus(docId);

    if (status.status !== 'SUCCESS' || !status.pdf_url) {
      throw new Error('PDF ещё не готов');
    }

    const link = document.createElement('a');
    link.href = status.pdf_url;
    link.download = `${fileName}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};