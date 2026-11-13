import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../api/seniorsApi', () => ({
  seniorsAPI: {
    getHistory: vi.fn(),
    requestNewId: vi.fn(),
  },
}));

import { seniorsAPI } from '../api/seniorsApi';
import SeniorHistorySection from './SeniorHistorySection';

const makeLog = (overrides: Record<string, any> = {}) => ({
  id: 1,
  action: 'UPDATED_SENIOR',
  timestamp: '2026-11-13T10:00:00+08:00',
  user: 'Staff Ana',
  details: { changed_fields: ['contact_number'] },
  ...overrides,
});

const renderSection = (notify = vi.fn()) => {
  render(<SeniorHistorySection seniorId="OSCA-1" notify={notify} />);
  return notify;
};

describe('SeniorHistorySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders the member history with reasons', async () => {
    vi.mocked(seniorsAPI.getHistory).mockResolvedValue({
      data: [
        makeLog({
          id: 3,
          action: 'REQUESTED_NEW_ID',
          timestamp: '2026-11-13T12:00:00+08:00',
          details: { reason: 'Lost ID', notes: 'Lost wallet at the market.' },
        }),
        makeLog({
          id: 2,
          action: 'APPROVED_REQUEST',
          timestamp: '2026-11-13T11:00:00+08:00',
          details: { type: 'ID Replacement', reason: 'Damaged ID' },
        }),
        makeLog({ id: 1 }),
      ],
    });

    renderSection();

    expect(await screen.findByText('Requested a new ID')).toBeInTheDocument();
    expect(screen.getByText('Information updated')).toBeInTheDocument();
    expect(screen.getByText('Request approved')).toBeInTheDocument();
    expect(screen.getByText('Lost wallet at the market.')).toBeInTheDocument();
    expect(screen.getByText('Lost ID')).toBeInTheDocument();
    expect(screen.getByText('Damaged ID')).toBeInTheDocument();
    expect(screen.getAllByText('Staff Ana').length).toBeGreaterThan(0);
  });

  it('requests history for the member on mount', async () => {
    vi.mocked(seniorsAPI.getHistory).mockResolvedValue({ data: [] });

    renderSection();

    await waitFor(() => expect(seniorsAPI.getHistory).toHaveBeenCalledWith('OSCA-1'));
  });

  it('shows an empty state when there is no history', async () => {
    vi.mocked(seniorsAPI.getHistory).mockResolvedValue({ data: [] });

    renderSection();

    expect(await screen.findByText('No history recorded yet.')).toBeInTheDocument();
  });

  it('shows an error state and can retry', async () => {
    vi.mocked(seniorsAPI.getHistory)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce({ data: [] });

    renderSection();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load history.');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No history recorded yet.')).toBeInTheDocument();
    expect(seniorsAPI.getHistory).toHaveBeenCalledTimes(2);
  });

  it('records a new ID request with a reason and notes', async () => {
    vi.mocked(seniorsAPI.getHistory).mockResolvedValue({ data: [] });
    vi.mocked(seniorsAPI.requestNewId).mockResolvedValue({ success: true });

    const notify = renderSection();

    await screen.findByText('No history recorded yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Request New ID' }));

    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Damaged ID' } });
    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: 'Card is cracked.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record request' }));

    await waitFor(() =>
      expect(seniorsAPI.requestNewId).toHaveBeenCalledWith('OSCA-1', {
        reason: 'Damaged ID',
        notes: 'Card is cracked.',
      })
    );
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('ID replacement request recorded.', 'success')
    );
    await waitFor(() => expect(seniorsAPI.getHistory).toHaveBeenCalledTimes(2));
    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument();
  });

  it('keeps the request form open and notifies on failure', async () => {
    vi.mocked(seniorsAPI.getHistory).mockResolvedValue({ data: [] });
    vi.mocked(seniorsAPI.requestNewId).mockRejectedValue(new Error('Already pending'));

    const notify = renderSection();

    await screen.findByText('No history recorded yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Request New ID' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record request' }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'Unable to record the ID request. Please try again.',
        'error'
      )
    );
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });
});
