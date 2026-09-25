import { describe, it, expect, beforeEach } from 'vitest';
import { authedUrl } from './client';

describe('authedUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not double the /api prefix on backend media paths', () => {
    localStorage.setItem('auth_token', 'abc');
    const url = authedUrl('/api/storage/profiles/photo_1.png');

    expect(url).toBe(`${window.location.origin}/api/storage/profiles/photo_1.png?token=abc`);
    expect(url).not.toContain('/api/api/');
  });

  it('resolves bare filenames against the API base', () => {
    localStorage.setItem('auth_token', 'abc');
    const url = authedUrl('photo_1.png');

    expect(url).toContain('/api/photo_1.png?token=abc');
    expect(url).not.toContain('/api/api/');
  });

  it('passes data: and blob: URLs through untouched', () => {
    localStorage.setItem('auth_token', 'abc');
    expect(authedUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
    expect(authedUrl('blob:http://x/y')).toBe('blob:http://x/y');
  });

  it('appends the token to absolute http URLs', () => {
    localStorage.setItem('auth_token', 'abc');
    expect(authedUrl('https://cdn.example.com/p.png')).toBe('https://cdn.example.com/p.png?token=abc');
  });

  it('returns an empty string for empty input and omits token when logged out', () => {
    expect(authedUrl('')).toBe('');
    expect(authedUrl(null)).toBe('');
    expect(authedUrl(undefined)).toBe('');
    expect(authedUrl('/api/storage/profiles/p.png')).toBe(
      `${window.location.origin}/api/storage/profiles/p.png`
    );
  });
});
