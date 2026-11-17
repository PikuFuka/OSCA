import { api, API_BASE_URL, getAuthToken } from '../../../core/api/client';

export interface SeniorCitizensReportDownload {
  blob: Blob;
  filename: string;
}

export interface SeniorCitizensReportParams {
  barangay?: string;
  year?: string | number;
  min_age?: string | number;
  max_age?: string | number;
  category?: string;
  search?: string;
  status?: string;
  sort?: string;
  order?: string;
  filtered?: boolean;
}

const DEFAULT_REPORT_FILENAME = 'Senior_Citizens_Report.xlsx';

const filenameFromContentDisposition = (disposition?: string): string => {
  if (!disposition) return DEFAULT_REPORT_FILENAME;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // Fall back to the plain filename below.
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(disposition);
  return plainMatch?.[1]?.trim() || DEFAULT_REPORT_FILENAME;
};

export const reportsAPI = {
  getSeniorCitizensReportUrl: (params?: SeniorCitizensReportParams): string => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const token = getAuthToken();
    if (token) searchParams.append('token', token);
    const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;
    return `${base}/reports/senior-citizens?${searchParams.toString()}`;
  },
  downloadSeniorCitizensReport: async (
    params?: SeniorCitizensReportParams
  ): Promise<SeniorCitizensReportDownload> => {
    // Report generation can take well over the client's default 30s timeout,
    // so downloads must not be aborted while the server is still compiling.
    const response = await api.get('/reports/senior-citizens', {
      params,
      responseType: 'blob',
      timeout: 0,
    });

    return {
      blob: response.data as Blob,
      filename: filenameFromContentDisposition(response.headers?.['content-disposition']),
    };
  },
};

export default reportsAPI;
