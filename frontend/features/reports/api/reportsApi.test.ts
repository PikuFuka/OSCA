import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { reportsAPI } from './reportsApi';
import { api } from '../../../core/api/client';

describe('reportsAPI.getSeniorCitizensReportUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('includes barangay/year/token params when all present', () => {
    localStorage.setItem('auth_token', 'tok123');
    const url = reportsAPI.getSeniorCitizensReportUrl({ barangay: 'Anibong', year: 2024 });

    expect(url).toContain('/reports/senior-citizens?');
    expect(url).toContain('barangay=Anibong');
    expect(url).toContain('year=2024');
    expect(url).toContain('token=tok123');
  });

  it('omits missing params and omits token when logged out', () => {
    const url = reportsAPI.getSeniorCitizensReportUrl({ barangay: 'Biñan' });

    expect(url).toContain('barangay=Bi%C3%B1an');
    expect(url).not.toContain('year=');
    expect(url).not.toContain('token=');
  });

  it('builds a bare report URL with no params when logged out', () => {
    const url = reportsAPI.getSeniorCitizensReportUrl();

    expect(url).toContain('/reports/senior-citizens');
    expect(url).not.toContain('token=');
  });
});

describe('reportsAPI.downloadSeniorCitizensReport', () => {
  const blob = new Blob(['workbook-bytes'], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the report as a blob with no timeout so large exports can finish', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="Senior_Citizens.xlsx"' },
    } as any);

    await reportsAPI.downloadSeniorCitizensReport({ barangay: 'Anibong', year: '2026' });

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith('/reports/senior-citizens', {
      params: { barangay: 'Anibong', year: '2026' },
      responseType: 'blob',
      timeout: 0,
    });
  });

  it('returns the downloaded blob and filename from Content-Disposition', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="Senior_Citizens_Report.xlsx"' },
    } as any);

    const result = await reportsAPI.downloadSeniorCitizensReport();

    expect(result.blob).toBe(blob);
    expect(result.filename).toBe('Senior_Citizens_Report.xlsx');
  });

  it('decodes an RFC 5987 UTF-8 filename', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: blob,
      headers: {
        'content-disposition':
          "attachment; filename=report.xlsx; filename*=UTF-8''Bi%C3%B1an%20Report.xlsx",
      },
    } as any);

    const result = await reportsAPI.downloadSeniorCitizensReport({ barangay: 'Biñan' });

    expect(result.filename).toBe('Biñan Report.xlsx');
  });

  it('falls back to the default filename when the header is missing', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: blob, headers: {} } as any);

    const result = await reportsAPI.downloadSeniorCitizensReport();

    expect(result.filename).toBe('Senior_Citizens_Report.xlsx');
  });

  it('rejects when the report request fails', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Failed to generate report.'));

    await expect(reportsAPI.downloadSeniorCitizensReport()).rejects.toThrow(
      'Failed to generate report.'
    );
  });
});
