import { describe, it, expect } from 'vitest';
import { getFriendlyErrorByStatus, TECHNICAL_MESSAGE_PATTERN } from './client';

describe('getFriendlyErrorByStatus', () => {
  it('maps auth failures to a re-login prompt without leaking details', () => {
    expect(getFriendlyErrorByStatus(401)).toMatch(/sign in again/i);
    expect(getFriendlyErrorByStatus(403)).toMatch(/permission/i);
  });

  it('maps server failures to a generic retry message', () => {
    expect(getFriendlyErrorByStatus(500)).toMatch(/temporarily unavailable/i);
    expect(getFriendlyErrorByStatus(undefined)).toMatch(/went wrong/i);
  });
});

describe('TECHNICAL_MESSAGE_PATTERN', () => {
  it('flags raw server internals so the UI can substitute safe messages', () => {
    expect(TECHNICAL_MESSAGE_PATTERN.test('SQLSTATE[23000]: duplicate entry')).toBe(true);
    expect(TECHNICAL_MESSAGE_PATTERN.test('Network Error')).toBe(true);
    expect(TECHNICAL_MESSAGE_PATTERN.test('Request failed with status 500')).toBe(true);
  });

  it('lets plain user-facing messages through', () => {
    expect(TECHNICAL_MESSAGE_PATTERN.test('The provided credentials are incorrect.')).toBe(false);
    expect(TECHNICAL_MESSAGE_PATTERN.test('Password changed successfully.')).toBe(false);
  });
});
