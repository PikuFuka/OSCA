import { describe, it, expect } from 'vitest';
import { getFriendlyErrorByStatus } from './client';

describe('getFriendlyErrorByStatus', () => {
  it('maps known statuses to friendly messages', () => {
    expect(getFriendlyErrorByStatus(400)).toBe('Please check the information and try again.');
    expect(getFriendlyErrorByStatus(401)).toBe('Your session has expired. Please sign in again.');
    expect(getFriendlyErrorByStatus(403)).toBe('You do not have permission to do that action.');
    expect(getFriendlyErrorByStatus(404)).toBe('The requested record was not found.');
    expect(getFriendlyErrorByStatus(422)).toBe('Some information is invalid. Please review and try again.');
    expect(getFriendlyErrorByStatus(500)).toBe('Server is temporarily unavailable. Please try again in a moment.');
  });

  it('returns generic message for unknown status and missing status', () => {
    expect(getFriendlyErrorByStatus(999)).toBe('Something went wrong. Please try again.');
    expect(getFriendlyErrorByStatus(undefined)).toBe('Something went wrong. Please try again.');
    expect(getFriendlyErrorByStatus(0)).toBe('Something went wrong. Please try again.');
  });
});
