import { useEffect, useRef } from 'react';
import { api } from './client';

export const STREAM_RECONNECT_BASE_MS = 2000;
export const STREAM_RECONNECT_MAX_MS = 30000;

/** Mint a short-lived signed SSE URL (bearer token stays in the header). */
export async function fetchStreamUrl(): Promise<string> {
  const response = await api.get('/stream/url');
  return response.data.url as string;
}

type StreamOptions = {
  enabled?: boolean;
  /** Event names that trigger onChange (default: seniors-changed). */
  events?: string[];
  onError?: (error: unknown) => void;
};

/**
 * Subscribe to the registry realtime stream. Calls onChange (silent
 * background refetch at the call site) whenever another device changes
 * senior data. Reconnects with backoff; re-mints the signed URL when the
 * old one expires (EventSource retries alone would loop on a 403).
 */
export function useSeniorStream(onChange: () => void, options: StreamOptions = {}): void {
  const { enabled = true, events = ['seniors-changed'], onError } = options;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return;

    let stopped = false;
    let source: EventSource | null = null;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      if (stopped) return;
      try {
        const url = await fetchStreamUrl();
        if (stopped) return;
        attempts = 0;
        source = new EventSource(url);
        for (const name of events) {
          source.addEventListener(name, () => onChangeRef.current());
        }
        source.onerror = () => {
          // EventSource auto-retries dropped connections itself; only take
          // over when it gives up (e.g. expired signature -> 403 loop).
          if (source && source.readyState === EventSource.CLOSED) {
            source.close();
            scheduleReconnect();
          }
        };
      } catch (error) {
        onErrorRef.current?.(error);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      attempts += 1;
      const delay = Math.min(
        STREAM_RECONNECT_BASE_MS * 2 ** (attempts - 1),
        STREAM_RECONNECT_MAX_MS,
      );
      timer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      source?.close();
    };
    // events array identity would relaunch the stream; join to a stable key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, events.join(',')]);
}
