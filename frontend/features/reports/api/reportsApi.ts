import { api, API_BASE_URL, getAuthToken } from '../../../core/api/client';

export const reportsAPI = {
  getSeniorCitizensReportUrl: (params?: { barangay?: string; year?: string | number }): string => {
    const searchParams = new URLSearchParams();
    if (params?.barangay) searchParams.append('barangay', params.barangay);
    if (params?.year) searchParams.append('year', String(params.year));
    const token = getAuthToken();
    if (token) searchParams.append('token', token);
    const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;
    return `${base}/reports/senior-citizens?${searchParams.toString()}`;
  },
  downloadSeniorCitizensReport: async (params?: { barangay?: string; year?: string | number }) => {
    const response = await api.get('/reports/senior-citizens', { params, responseType: 'blob' });
    return response.data;
  },
};

export default reportsAPI;
