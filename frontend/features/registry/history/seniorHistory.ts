export type SeniorHistoryKind =
  | 'registered'
  | 'updated'
  | 'id-request'
  | 'id-card'
  | 'request'
  | 'status'
  | 'other';

export interface SeniorHistoryLog {
  id: number;
  action: string;
  timestamp: string | null;
  user: string;
  details: Record<string, any> | null;
}

export interface SeniorHistoryEntry {
  id: number;
  action: string;
  kind: SeniorHistoryKind;
  title: string;
  description: string;
  reason?: string;
  notes?: string;
  user: string;
  timestamp: string;
}

const FIELD_LABELS: Record<string, string> = {
  osca_id: 'OSCA ID',
  first_name: 'First name',
  middle_name: 'Middle name',
  last_name: 'Last name',
  extension_name: 'Extension name',
  date_of_birth: 'Date of birth',
  age: 'Age',
  place_of_birth: 'Place of birth',
  sex: 'Sex',
  mothers_maiden_name: "Mother's maiden name",
  pension_status: 'Pension status',
  barangay: 'Barangay',
  street_address: 'Street address',
  contact_number: 'Contact number',
  emergency_name: 'Emergency contact person',
  emergency_contact: 'Emergency contact number',
  rrn: 'RRN',
  national_id: 'National ID',
  profile_photo_path: 'Profile photo',
  id_config: 'ID card layout',
  status: 'Status',
};

const ACTION_TITLES: Record<string, string> = {
  REGISTERED_SENIOR: 'Registered as senior citizen',
  UPDATED_SENIOR: 'Information updated',
  REQUESTED_NEW_ID: 'Requested a new ID',
  PRINTED_ID: 'ID card printed',
  SUBMITTED_UPDATE_REQUEST: 'Information update submitted',
  APPROVED_REQUEST: 'Request approved',
  REJECTED_REQUEST: 'Request rejected',
  MARKED_DECEASED: 'Marked as deceased',
  REVERTED_DECEASED: 'Deceased status reverted',
  DELETED_SENIOR: 'Record archived',
  RESTORED_SENIOR: 'Record restored',
};

const ACTION_KINDS: Record<string, SeniorHistoryKind> = {
  REGISTERED_SENIOR: 'registered',
  UPDATED_SENIOR: 'updated',
  REQUESTED_NEW_ID: 'id-request',
  PRINTED_ID: 'id-card',
  SUBMITTED_UPDATE_REQUEST: 'request',
  APPROVED_REQUEST: 'request',
  REJECTED_REQUEST: 'request',
  MARKED_DECEASED: 'status',
  REVERTED_DECEASED: 'status',
  DELETED_SENIOR: 'status',
  RESTORED_SENIOR: 'status',
};

const humanize = (value: string): string => {
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const fieldLabel = (field: string): string =>
  FIELD_LABELS[field] ?? humanize(field);

const describeUpdate = (details: Record<string, any>): string => {
  const changedFields = Array.isArray(details.changed_fields)
    ? details.changed_fields.filter((field: unknown): field is string => typeof field === 'string')
    : [];

  if (changedFields.length === 0) return 'Member information was updated.';
  return `Updated ${changedFields.map(fieldLabel).join(', ')}.`;
};

const describeRequest = (details: Record<string, any>): string => {
  const type = typeof details.type === 'string' ? details.type : 'Request';
  return `${type} request approved.`;
};

const describeRejection = (details: Record<string, any>): string => {
  if (typeof details.reason === 'string' && details.reason.trim()) return details.reason;
  return 'The request was rejected.';
};

const describeEntry = (action: string, details: Record<string, any>): string => {
  switch (action) {
    case 'REGISTERED_SENIOR':
      return 'Registered in the OSCA member registry.';
    case 'UPDATED_SENIOR':
      return describeUpdate(details);
    case 'REQUESTED_NEW_ID':
      return typeof details.notes === 'string' && details.notes.trim()
        ? details.notes
        : 'ID replacement requested.';
    case 'PRINTED_ID':
      return 'An OSCA ID card was printed for this member.';
    case 'SUBMITTED_UPDATE_REQUEST':
      return 'An information update request was submitted.';
    case 'APPROVED_REQUEST':
      return describeRequest(details);
    case 'REJECTED_REQUEST':
      return describeRejection(details);
    case 'MARKED_DECEASED':
      return 'The member was marked as deceased.';
    case 'REVERTED_DECEASED':
      return 'The deceased status was reverted.';
    case 'DELETED_SENIOR':
      return 'The member record was moved to the archive.';
    case 'RESTORED_SENIOR':
      return 'The member record was restored from the archive.';
    default:
      return 'Member record activity.';
  }
};

const readReason = (action: string, details: Record<string, any>): string | undefined => {
  if (typeof details.reason !== 'string' || !details.reason.trim()) return undefined;
  if (action === 'REQUESTED_NEW_ID' || action === 'APPROVED_REQUEST') return details.reason;
  return undefined;
};

const normalizeLogs = (payload: unknown): SeniorHistoryLog[] => {
  if (Array.isArray(payload)) return payload as SeniorHistoryLog[];
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as SeniorHistoryLog[];
  }
  return [];
};

const SYSTEM_ACTIONS = new Set(['LOGIN', 'LOGOUT']);

export const mapSeniorHistory = (payload: unknown): SeniorHistoryEntry[] => {
  return normalizeLogs(payload)
    .filter((log) => log && typeof log.action === 'string' && !SYSTEM_ACTIONS.has(log.action))
    .map((log) => {
      const details = log.details ?? {};
      const reason = readReason(log.action, details);
      return {
        id: log.id,
        action: log.action,
        kind: ACTION_KINDS[log.action] ?? 'other',
        title: ACTION_TITLES[log.action] ?? humanize(log.action),
        description: describeEntry(log.action, details),
        reason,
        notes: typeof details.notes === 'string' && details.notes.trim() ? details.notes : undefined,
        user: log.user || 'System',
        timestamp: log.timestamp ?? '',
      };
    })
    .sort((a, b) => {
      const byTime = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (Number.isNaN(byTime) || byTime === 0) return b.id - a.id;
      return byTime;
    });
};
