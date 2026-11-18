import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportView from './ReportView';
import { seniorsAPI, reportsAPI } from '../services/api';

vi.mock('../services/api', () => ({
  seniorsAPI: {
    getAll: vi.fn(),
    getDeceased: vi.fn(),
  },
  reportsAPI: {
    downloadSeniorCitizensReport: vi.fn(),
  },
}));

interface ReportDownload {
  blob: Blob;
  filename: string;
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const clickedDownloads: string[] = [];
const originalAnchorClick = HTMLAnchorElement.prototype.click;
let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

describe('ReportView Excel export loading', () => {
  beforeEach(() => {
    vi.mocked(seniorsAPI.getAll).mockResolvedValue({
      data: [],
      meta: { last_page: 1, total: 0 },
    } as any);
    vi.mocked(seniorsAPI.getDeceased).mockResolvedValue({ data: [] } as any);

    createObjectURL = vi.fn(() => 'blob:report-download');
    revokeObjectURL = vi.fn();
    (URL as any).createObjectURL = createObjectURL;
    (URL as any).revokeObjectURL = revokeObjectURL;

    clickedDownloads.length = 0;
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      clickedDownloads.push(this.download);
    });
  });

  afterEach(() => {
    HTMLAnchorElement.prototype.click = originalAnchorClick;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('keeps the global loading overlay active until the report finishes downloading', async () => {
    const download = deferred<ReportDownload>();
    vi.mocked(reportsAPI.downloadSeniorCitizensReport).mockReturnValue(download.promise);

    const setGlobalLoading = vi.fn();
    const notify = vi.fn();

    render(<ReportView notify={notify} setGlobalLoading={setGlobalLoading} />);

    const button = await screen.findByRole('button', { name: /generate excel report/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(setGlobalLoading).toHaveBeenCalledWith(true);
    });

    // While the request is still pending, the overlay must stay on.
    expect(screen.getByRole('button', { name: /generating report/i })).toBeDisabled();
    expect(setGlobalLoading).not.toHaveBeenCalledWith(false);

    download.resolve({ blob: new Blob(['xlsx-bytes']), filename: 'Senior Report.xlsx' });

    await waitFor(() => {
      expect(setGlobalLoading).toHaveBeenLastCalledWith(false);
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickedDownloads).toEqual(['Senior Report.xlsx']);
    expect(notify).toHaveBeenCalledWith(
      'Final Report for All Barangays has been downloaded.',
      'success'
    );
  });

  it('lists only members marked as verified centenarians, not placeholder birthdates', async () => {
    const verifiedCentenarian = {
      id: 'cent-1',
      name: 'Verified Centenarian',
      age: 101,
      isCentenarian: true,
      dateOfBirth: '1925-01-01',
      barangay: 'Anibong',
      sex: 'Female',
      status: 'Active',
    };
    const placeholder = {
      id: 'cent-2',
      name: 'Placeholder Birthdate',
      age: 126,
      isCentenarian: false,
      dateOfBirth: '1900-01-01',
      barangay: 'Anibong',
      sex: 'Male',
      status: 'Active',
    };
    const nonCentenarian = {
      id: 'cent-3',
      name: 'Seventy Year Old',
      age: 70,
      isCentenarian: false,
      dateOfBirth: '1956-01-01',
      barangay: 'Anibong',
      sex: 'Male',
      status: 'Active',
    };

    vi.mocked(seniorsAPI.getAll).mockImplementation((params: any) => {
      if (params?.centenarians === true) {
        return Promise.resolve({ data: [verifiedCentenarian, placeholder, nonCentenarian] } as any);
      }
      return Promise.resolve({
        data: [verifiedCentenarian],
        meta: { last_page: 1, total: 1 },
      } as any);
    });

    render(<ReportView notify={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /living centenarians/i }));

    expect(await screen.findByText('Verified Centenarian')).toBeInTheDocument();
    expect(screen.queryByText('Placeholder Birthdate')).not.toBeInTheDocument();
    expect(screen.queryByText('Seventy Year Old')).not.toBeInTheDocument();
    expect(screen.getByText('Total: 1')).toBeInTheDocument();
  });

  it('requests only the data each report section needs', async () => {
    render(<ReportView notify={vi.fn()} />);

    await waitFor(() => expect(seniorsAPI.getAll).toHaveBeenCalled());
    expect(vi.mocked(seniorsAPI.getAll).mock.calls[0][0]).toMatchObject({
      page: 1,
      per_page: 15,
    });
    expect(vi.mocked(seniorsAPI.getAll).mock.calls[0][0]).not.toHaveProperty('centenarians');

    vi.mocked(seniorsAPI.getAll).mockClear();

    fireEvent.click(await screen.findByRole('button', { name: /living centenarians/i }));

    await waitFor(() => expect(seniorsAPI.getAll).toHaveBeenCalledTimes(1));
    expect(vi.mocked(seniorsAPI.getAll).mock.calls[0][0]).toMatchObject({
      centenarians: true,
    });

    vi.mocked(seniorsAPI.getAll).mockClear();

    fireEvent.click(screen.getByRole('button', { name: /new registered/i }));

    await waitFor(() => expect(seniorsAPI.getAll).toHaveBeenCalledTimes(1));
    expect(vi.mocked(seniorsAPI.getAll).mock.calls[0][0]).toMatchObject({
      per_page: 30,
      sort: 'created_at',
      order: 'desc',
    });
    expect(vi.mocked(seniorsAPI.getAll).mock.calls[0][0]).not.toHaveProperty('centenarians');
  });

  it('clears the loading overlay and reports an error when the download fails', async () => {
    const download = deferred<ReportDownload>();
    vi.mocked(reportsAPI.downloadSeniorCitizensReport).mockReturnValue(download.promise);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const setGlobalLoading = vi.fn();
    const notify = vi.fn();

    render(<ReportView notify={notify} setGlobalLoading={setGlobalLoading} />);

    const button = await screen.findByRole('button', { name: /generate excel report/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(setGlobalLoading).toHaveBeenCalledWith(true);
    });

    download.reject(new Error('server failed'));

    await waitFor(() => {
      expect(setGlobalLoading).toHaveBeenLastCalledWith(false);
    });

    expect(notify).toHaveBeenCalledWith('Failed to generate report. Please try again.', 'error');
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
