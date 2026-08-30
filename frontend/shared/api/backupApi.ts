import { api } from '../../core/api/client';

export const backupAPI = {
  exportDB: async (): Promise<Blob> => {
    const response = await api.get('/backup/export', { responseType: 'blob' });
    return response.data;
  },
  importDB: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await api.post('/backup/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
};

export default backupAPI;
