// src/shared/api/documentService.ts
import { $api } from './base';
import { DocumentItem } from '../../entities/document/model/types';
import { TemplateItem } from '../../entities/document/model/types';

export const documentService = {
  // Получить все документы
  async getAll(): Promise<DocumentItem[]> {
    const { data } = await $api.get<DocumentItem[]>('/documents/');
    return data;
  },

  // Получить один по ID
  async getById(id: string): Promise<DocumentItem> {
    const { data } = await $api.get<DocumentItem>(`/documents/${id}`);
    return data;
  },

  // Создать новый
  async create(payload: { name_doc: string, template_id: number }): Promise<DocumentItem> {
    const { data } = await $api.post<DocumentItem>('/documents/', payload);
    return data;
  },

  // Удалить
  async delete(doc_id: number): Promise<void> {
    await $api.delete(`/documents/${doc_id}`);
  },

  async getTemplates(): Promise<TemplateItem[]> {
    const { data } = await $api.get<TemplateItem[]>('/templates/');
    return data;
  },

  async update(doc_id: number, payload: { 
    name_doc?: string; 
    content_json?: any; 
    latex_source?: string 
  }): Promise<DocumentItem> {
    const { data } = await $api.put<DocumentItem>(`/documents/${doc_id}`, payload);
    return data;
  },

  // Запуск компиляции
  async compile(doc_id: number): Promise<DocumentItem> {
    const { data } = await $api.post<DocumentItem>(`/documents/${doc_id}/compile`);
    return data;
  },

  // Получение URL для PDF (с токеном, если нужно)
  getPdfUrl(doc_id: number): string {
    const token = localStorage.getItem('token');
    // Добавляем timestamp, чтобы браузер не кешировал старый PDF
    return `${$api.defaults.baseURL}/documents/${doc_id}/pdf?token=${token}&t=${Date.now()}`;
  },

  async downloadPdf(docId: number, fileName: string) {
    const response = await $api.get(`/documents/${docId}/pdf`, {
      responseType: 'blob',
    });
    
    // Создаем ссылку для скачивания в браузере
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  async getCompileStatus(docId: number): Promise<{ status: string, log: string }> {
    const { data } = await $api.get(`/documents/${docId}/compile-status`);
    return data;
  },

  

};