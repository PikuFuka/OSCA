import { describe, it, expect, beforeEach } from 'vitest';
import { reportsAPI } from './reportsApi';

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
