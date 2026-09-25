import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { seniorsAPI, requestsAPI } from '../services/api';

vi.mock('../services/api', () => ({
  seniorsAPI: {
    getStatistics: vi.fn(),
    getBirthdays: vi.fn(),
  },
  requestsAPI: {
    getPending: vi.fn(),
  },
}));

// jsdom cannot measure layout, so recharts' ResponsiveContainer renders
// nothing — give charts a fixed size like a real viewport would.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 400 }}>
        {React.cloneElement(children as React.ReactElement, { width: 800, height: 400 })}
      </div>
    ),
  };
});

// Instant counter (skips the 900ms animation) so assertions don't race it.
vi.mock('../utils/useCountUp', () => ({
  useCountUp: (target: number) => target,
}));

// jsdom lacks these browser APIs used by charts/animations.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    window.setTimeout(() => cb(performance.now()), 0);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const statsPayload = {
  total: 10,
  deceased: 1,
  pending: 2,
  centenarians: 0,
  monthlyStats: [],
  ageRanges: [],
  genders: [],
  topBarangays: [],
  allBarangayStats: [],
};

describe('Dashboard refresh robustness', () => {
  it('fetches stats on mount even when the global auth flag is unset (no stuck skeleton)', async () => {
    // Simulate fresh boot: App's effect has not set the flag yet.
    delete (window as any).isAuthenticated;

    vi.mocked(seniorsAPI.getStatistics).mockResolvedValue({ ...statsPayload });
    vi.mocked(requestsAPI.getPending).mockResolvedValue({ total: 2, data: [] });
    vi.mocked(seniorsAPI.getBirthdays).mockResolvedValue({ count: 0, date: '', seniors: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(seniorsAPI.getStatistics).toHaveBeenCalled();
    });

    // Skeleton resolves into content once the flight settles.
    await waitFor(() => {
      expect(screen.queryByText('Failed to load analytical data.')).not.toBeInTheDocument();
    });
    expect(requestsAPI.getPending).toHaveBeenCalled();
  });

  it('refetches and shows new data when the year filter changes', async () => {
    vi.mocked(seniorsAPI.getStatistics).mockResolvedValue({ ...statsPayload, total: 10 });
    vi.mocked(requestsAPI.getPending).mockResolvedValue({ total: 0, data: [] });
    vi.mocked(seniorsAPI.getBirthdays).mockResolvedValue({ count: 0, date: '', seniors: [] });

    render(<Dashboard />);
    let selects = await screen.findAllByRole('combobox');

    vi.mocked(seniorsAPI.getStatistics).mockResolvedValue({ ...statsPayload, total: 20 });
    fireEvent.change(selects[0], { target: { value: '2024' } });

    await waitFor(() => {
      expect(seniorsAPI.getStatistics).toHaveBeenCalledWith('All Barangays', '2024');
    });
    await waitFor(
      () => {
        expect(screen.getByText('Active Registry').parentElement?.parentElement?.textContent).toContain('20');
      },
      { timeout: 3000 }
    );
  });

  it('renders peak ages as a chart matching the other graphs', async () => {
    vi.mocked(seniorsAPI.getStatistics).mockResolvedValue({
      ...statsPayload,
      topAges: [
        { age: 68, count: 140 },
        { age: 72, count: 150 },
        { age: 65, count: 120 },
      ],
    });
    vi.mocked(requestsAPI.getPending).mockResolvedValue({ total: 0, data: [] });
    vi.mocked(seniorsAPI.getBirthdays).mockResolvedValue({ count: 0, date: '', seniors: [] });

    render(<Dashboard />);

    expect(await screen.findByText('Peak Ages')).toBeInTheDocument();
    expect(screen.queryByText('Registration Momentum')).not.toBeInTheDocument();
    expect(screen.queryByText('Barangay Concentration')).not.toBeInTheDocument();

    // Y-axis ticks follow the ranked data order (72 above 68 above 65).
    const card = screen.getByText('Peak Ages').closest('div')!.parentElement!.parentElement!;
    const text = card.textContent ?? '';
    expect(text.indexOf('72')).toBeGreaterThan(-1);
    expect(text.indexOf('72')).toBeLessThan(text.indexOf('68'));
    expect(text.indexOf('68')).toBeLessThan(text.indexOf('65'));
  });
});
