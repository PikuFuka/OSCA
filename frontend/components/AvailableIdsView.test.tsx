import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AvailableIdsView from './AvailableIdsView';
import { seniorsAPI } from '../services/api';

vi.mock('../services/api', () => ({
  seniorsAPI: {
    getAvailableOscaIds: vi.fn(),
  },
}));

const vacancies = [
  {
    id: 1,
    oscaId: '0001',
    reason: 'Deceased',
    pastHolder: 'Juan Dela Cruz',
    vacatedAt: '2026-11-14',
  },
  {
    id: 2,
    oscaId: '0002',
    reason: 'Deleted',
    pastHolder: 'Maria Santos',
    vacatedAt: '2026-10-05',
  },
];

describe('AvailableIdsView', () => {
  beforeEach(() => {
    vi.mocked(seniorsAPI.getAvailableOscaIds).mockResolvedValue({
      data: vacancies,
      total: vacancies.length,
    });
  });

  it('renders the required vacancy columns and available IDs', async () => {
    render(<AvailableIdsView notify={vi.fn()} />);

    expect(await screen.findByText('0001')).toBeInTheDocument();
    expect(screen.getByText('OSCA ID')).toBeInTheDocument();
    expect(screen.getByText('Reason of Vacancy')).toBeInTheDocument();
    expect(screen.getByText('Past Holder')).toBeInTheDocument();
    expect(screen.getByText('Date of Vacancy')).toBeInTheDocument();
    expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Deceased')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  it('filters the table by OSCA ID, holder, or reason', async () => {
    render(<AvailableIdsView notify={vi.fn()} />);

    expect(await screen.findByText('0001')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search by id, holder, or reason/i), {
      target: { value: 'Maria' },
    });

    expect(screen.getByText('0002')).toBeInTheDocument();
    expect(screen.queryByText('0001')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search by id, holder, or reason/i), {
      target: { value: 'no-match' },
    });

    await waitFor(() => {
      expect(screen.getByText(/no matching available osca ids/i)).toBeInTheDocument();
    });
  });
});
