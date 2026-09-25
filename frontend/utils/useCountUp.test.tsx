import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useCountUp } from './useCountUp';

const Harness = ({ target, duration }: { target: number; duration?: number }) => {
  const count = useCountUp(target, duration);
  return <span data-testid="count">{count}</span>;
};

describe('useCountUp', () => {
  let now = 0;

  beforeEach(() => {
    now = 0;
    const raf = (cb: FrameRequestCallback) => {
      now += 1000;
      const t = now;
      window.setTimeout(() => cb(t), 0);
      return 0;
    };
    vi.stubGlobal('requestAnimationFrame', raf);
    (window as any).requestAnimationFrame = raf;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts at 0 on first render', () => {
    render(<Harness target={100} duration={800} />);
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('reaches the target quickly with mocked rAF', async () => {
    render(<Harness target={100} duration={800} />);
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('100');
    });
  });

  it('handles a zero target', async () => {
    render(<Harness target={0} duration={800} />);
    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('0');
    });
  });
});
