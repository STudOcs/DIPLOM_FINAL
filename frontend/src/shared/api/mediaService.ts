import { $api } from './base';

export interface UploadedMedia {
  id: number;
  file: string;
  url: string;
  uploaded_at: string;
}

export const mediaService = {
  async uploadImage(file: File): Promise<UploadedMedia> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await $api.post<UploadedMedia>('/media/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};