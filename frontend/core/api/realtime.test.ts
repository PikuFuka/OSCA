import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { fetchStreamUrl, useSeniorStream } from './realtime';
import { api } from './client';

vi.mock('./client', () => ({
  api: { get: vi.fn() },
}));

// Minimal EventSource stand-in: captures instances + listeners.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState = FakeEventSource.CONNECTING;
  onerror: (() => void) | null = null;
  private listeners = new Map<string, Array<() => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(name: string, cb: () => void) {
    const list = this.listeners.get(name) ?? [];
    list.push(cb);
    this.listeners.set(name, list);
  }

  emit(name: string) {
    for (const cb of this.listeners.get(name) ?? []) cb();
  }

  fail() {
    this.readyState = FakeEventSource.CLOSED;
    this.onerror?.();
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
}

describe('fetchStreamUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: { url: 'http://x/stream?signature=abc' } });
  });

  it('returns the server-signed url using the header-authenticated client', async () => {
    await expect(fetchStreamUrl()).resolves.toBe('http://x/stream?signature=abc');
    expect(api.get).toHaveBeenCalledWith('/stream/url');
  });
});

describe('useSeniorStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource as unknown as typeof EventSource);
    vi.mocked(api.get).mockResolvedValue({ data: { url: 'http://x/stream?signature=abc' } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('calls onChange when a seniors-changed event arrives', async () => {
    const onChange = vi.fn();
    renderHook(() => useSeniorStream(onChange));

    await act(async () => {});
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => {
      FakeEventSource.instances[0].emit('seniors-changed');
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('re-mints the url and reconnects after the stream dies', async () => {
    const onChange = vi.fn();
    renderHook(() => useSeniorStream(onChange));

    await act(async () => {});
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => {
      FakeEventSource.instances[0].fail();
    });
    // Backoff (2s) elapses -> second connection with a fresh signed url.
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(FakeEventSource.instances).toHaveLength(2);
  });
});
