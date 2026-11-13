import { describe, it, expect } from 'vitest';
import { mapSeniorHistory, type SeniorHistoryLog } from './seniorHistory';

const makeLog = (overrides: Partial<SeniorHistoryLog> = {}): SeniorHistoryLog => ({
  id: 1,
  action: 'UPDATED_SENIOR',
  timestamp: '2026-11-13T10:00:00+08:00',
  user: 'Staff Ana',
  details: {},
  ...overrides,
});

describe('mapSeniorHistory', () => {
  it('sorts entries newest first', () => {
    const entries = mapSeniorHistory([
      makeLog({ id: 1, action: 'PRINTED_ID', timestamp: '2026-11-01T08:00:00+08:00' }),
      makeLog({ id: 2, action: 'REQUESTED_NEW_ID', timestamp: '2026-11-12T08:00:00+08:00' }),
    ]);

    expect(entries.map((entry) => entry.id)).toEqual([2, 1]);
  });

  it('describes a profile update using readable changed field names', () => {
    const [entry] = mapSeniorHistory([
      makeLog({
        action: 'UPDATED_SENIOR',
        details: { changed_fields: ['contact_number', 'street_address'] },
      }),
    ]);

    expect(entry.kind).toBe('updated');
    expect(entry.title).toBe('Information updated');
    expect(entry.description).toBe('Updated Contact number, Street address.');
  });

  it('falls back to a generic update description when no fields are recorded', () => {
    const [entry] = mapSeniorHistory([makeLog({ details: {} })]);

    expect(entry.title).toBe('Information updated');
    expect(entry.description).toBe('Member information was updated.');
  });

  it('humanizes unknown changed field keys', () => {
    const [entry] = mapSeniorHistory([
      makeLog({ details: { changed_fields: ['custom_field'] } }),
    ]);

    expect(entry.description).toBe('Updated Custom field.');
  });

  it('maps a new ID request with its reason and notes', () => {
    const [entry] = mapSeniorHistory([
      makeLog({
        action: 'REQUESTED_NEW_ID',
        details: { reason: 'Lost ID', notes: 'Lost wallet at the market.' },
      }),
    ]);

    expect(entry.kind).toBe('id-request');
    expect(entry.title).toBe('Requested a new ID');
    expect(entry.reason).toBe('Lost ID');
    expect(entry.notes).toBe('Lost wallet at the market.');
    expect(entry.description).toBe('Lost wallet at the market.');
  });

  it('maps a damaged ID request reason', () => {
    const [entry] = mapSeniorHistory([
      makeLog({ action: 'REQUESTED_NEW_ID', details: { reason: 'Damaged ID' } }),
    ]);

    expect(entry.reason).toBe('Damaged ID');
    expect(entry.description).toBe('ID replacement requested.');
  });

  it('keeps the reason on an approved ID replacement', () => {
    const [entry] = mapSeniorHistory([
      makeLog({
        action: 'APPROVED_REQUEST',
        details: { type: 'ID Replacement', reason: 'Damaged ID' },
      }),
    ]);

    expect(entry.kind).toBe('request');
    expect(entry.title).toBe('Request approved');
    expect(entry.reason).toBe('Damaged ID');
    expect(entry.description).toBe('ID Replacement request approved.');
  });

  it('describes an approved information update', () => {
    const [entry] = mapSeniorHistory([
      makeLog({ action: 'APPROVED_REQUEST', details: { type: 'Information Update' } }),
    ]);

    expect(entry.description).toBe('Information Update request approved.');
    expect(entry.reason).toBeUndefined();
  });

  it('describes a rejected request with its reason', () => {
    const [entry] = mapSeniorHistory([
      makeLog({
        action: 'REJECTED_REQUEST',
        details: { reason: 'Incomplete requirements' },
      }),
    ]);

    expect(entry.title).toBe('Request rejected');
    expect(entry.description).toBe('Incomplete requirements');
  });

  it('maps printed IDs and lifecycle events', () => {
    const entries = mapSeniorHistory([
      makeLog({ id: 1, action: 'PRINTED_ID' }),
      makeLog({ id: 2, action: 'MARKED_DECEASED' }),
      makeLog({ id: 3, action: 'DELETED_SENIOR' }),
    ]);

    expect(entries.map((entry) => entry.title)).toEqual([
      'Record archived',
      'Marked as deceased',
      'ID card printed',
    ]);
    expect(entries.map((entry) => entry.kind)).toEqual(['status', 'status', 'id-card']);
  });

  it('humanizes unknown actions instead of hiding them', () => {
    const [entry] = mapSeniorHistory([makeLog({ action: 'VIEWED_REPORT' })]);

    expect(entry.kind).toBe('other');
    expect(entry.title).toBe('Viewed report');
  });

  it('carries the actor and timestamp through', () => {
    const [entry] = mapSeniorHistory([
      makeLog({ user: 'Admin Cruz', timestamp: '2026-11-13T09:15:00+08:00' }),
    ]);

    expect(entry.user).toBe('Admin Cruz');
    expect(entry.timestamp).toBe('2026-11-13T09:15:00+08:00');
  });

  it('hides login and logout system activity', () => {
    const entries = mapSeniorHistory([
      makeLog({ id: 1, action: 'LOGIN' }),
      makeLog({ id: 2, action: 'LOGOUT' }),
      makeLog({ id: 3, action: 'UPDATED_SENIOR' }),
    ]);

    expect(entries.map((entry) => entry.action)).toEqual(['UPDATED_SENIOR']);
  });

  it('accepts a payload wrapper with a data array', () => {
    const entries = mapSeniorHistory({
      data: [makeLog({ id: 7, action: 'REGISTERED_SENIOR' })],
    } as any);

    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Registered as senior citizen');
  });
});
