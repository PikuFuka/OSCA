import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import LiveClock from './LiveClock';

describe('LiveClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks every second without re-rendering its parent', () => {
    let parentRenders = 0;
    const Parent: React.FC = () => {
      parentRenders += 1;
      return (
        <div>
          <span>static</span>
          <LiveClock variant="header" />
        </div>
      );
    };
    render(<Parent />);
    expect(parentRenders).toBe(1);
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(61000);
    });

    expect(screen.getByText('10:01 AM')).toBeInTheDocument();
    expect(parentRenders).toBe(1);
  });

  it('renders the backup variant', () => {
    render(<LiveClock variant="backup" />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });
});
