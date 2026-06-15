// src/shared/api/documentService.ts
import { $api } from './base';
import { DocumentItem, TemplateItem, CreateDocumentDto } from '../../entities/document/model/types';

export const documentService = {
  // Получить все документы
  async getAll(): Promise<DocumentItem[]> {
    const { data } = await $api.get<DocumentItem[]>('/documents/');
    return data;
  },

  // Получить один по ID
  async getById(id: string): Promise<DocumentItem> {
    const { data } = await $api.get<DocumentItem>(`/documents/${id}/`); 
    return data;
  },

  // Создать новый (v1.1)
  async create(payload: CreateDocumentDto): Promise<DocumentItem> {
    const { data } = await $api.post<DocumentItem>('/documents/', payload);
    return data;
  },

  // Обновить документ
  async update(doc_id: number, payload: Partial<DocumentItem>): Promise<DocumentItem> {
    const { data } = await $api.patch<DocumentItem>(`/documents/${doc_id}/`, payload);
    return data;
  },

  // Удалить
  async delete(id: number): Promise<void> {
    await $api.delete(`/documents/${id}/`);
  },

  // Список шаблонов
  async getTemplates(): Promise<TemplateItem[]> {
    const { data } = await $api.get<TemplateItem[]>('/templates/');
    return data;
  },

  // Запуск компиляции
  async compile(id: number): Promise<{ status: 'success' | 'error', pdf_url?: string, log?: string }> {
    const { data } = await $api.post(`/documents/${id}/compile/`);
    return data;
  },

  // Статус компиляции
  async getCompileStatus(id: number): Promise<{ status: string, log: string }> {
    const { data } = await $api.get(`/documents/${id}/compile-status/`);
    return data;
  },

  // Скачивание PDF
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
  }
};