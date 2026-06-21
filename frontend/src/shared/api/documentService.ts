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

  async getRawCode(id: number): Promise<{ raw_latex: string }> {
    const { data } = await $api.get(`/documents/${id}/raw_code/`);
    return data;
  },

  async syncCode(id: number, rawLatex: string): Promise<DocumentItem> {
    const { data } = await $api.post<ApiDocumentItem>(`/documents/${id}/sync_code/`, {
      raw_latex: rawLatex,
    });

    return normalizeDocument(data);
  },

  async getPdfBlob(docId: number): Promise<Blob> {
    const response = await $api.get(`/documents/${docId}/pdf/`, {
      responseType: 'blob',
    });

    const contentType = response.headers['content-type'] || '';

    if (!contentType.includes('application/pdf')) {
      const errorText = await response.data.text();
      throw new Error(errorText || 'Backend вернул не PDF-файл');
    }

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    });

    if (blob.size === 0) {
      throw new Error('PDF-файл пустой');
    }

    const header = await blob.slice(0, 5).text();

    if (header !== '%PDF-') {
      throw new Error('Скачанный файл не является корректным PDF');
    }

    return blob;
  },

  async getPdfObjectUrl(docId: number): Promise<string> {
    const blob = await this.getPdfBlob(docId);
    return window.URL.createObjectURL(blob);
  },

  async downloadPdf(docId: number, fileName: string) {
    const blob = await this.getPdfBlob(docId);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'document'}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },
};