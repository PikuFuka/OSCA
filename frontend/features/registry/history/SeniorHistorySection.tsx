import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Archive,
  BadgeCheck,
  FileClock,
  IdCard,
  Pencil,
  Printer,
  UserPlus,
  UserRound,
} from 'lucide-react';
import ConfirmModal from '../../../components/ConfirmModal';
import { seniorsAPI } from '../api/seniorsApi';
import {
  mapSeniorHistory,
  type SeniorHistoryEntry,
  type SeniorHistoryKind,
} from './seniorHistory';

export type IdRequestReason = 'Lost ID' | 'Damaged ID' | 'Others';

interface SeniorHistorySectionProps {
  seniorId: number | string;
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const KIND_ICONS: Record<SeniorHistoryKind, React.ReactNode> = {
  registered: <UserPlus size={16} />,
  updated: <Pencil size={16} />,
  'id-request': <IdCard size={16} />,
  'id-card': <Printer size={16} />,
  request: <BadgeCheck size={16} />,
  status: <Archive size={16} />,
  other: <Activity size={16} />,
};

const KIND_STYLES: Record<SeniorHistoryKind, string> = {
  registered: 'bg-blue-50 text-blue-600',
  updated: 'bg-sky-50 text-sky-600',
  'id-request': 'bg-amber-50 text-amber-600',
  'id-card': 'bg-emerald-50 text-emerald-600',
  request: 'bg-indigo-50 text-indigo-600',
  status: 'bg-slate-100 text-slate-500',
  other: 'bg-slate-100 text-slate-500',
};

const REASON_STYLES: Record<string, string> = {
  'Lost ID': 'bg-amber-50 text-amber-700 border-amber-200',
  'Damaged ID': 'bg-rose-50 text-rose-700 border-rose-200',
  Others: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const ReasonBadge: React.FC<{ reason?: string }> = ({ reason }) => {
  if (!reason) return <span className="text-slate-300">—</span>;
  const style = REASON_STYLES[reason] ?? REASON_STYLES.Others;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${style}`}
    >
      <FileClock size={11} />
      {reason}
    </span>
  );
};

const SeniorHistorySection: React.FC<SeniorHistorySectionProps> = ({ seniorId, notify }) => {
  const [entries, setEntries] = useState<SeniorHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reason, setReason] = useState<IdRequestReason>('Lost ID');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const payload = await seniorsAPI.getHistory(seniorId);
      setEntries(mapSeniorHistory(payload));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [seniorId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const closeRequestForm = () => {
    if (submitting) return;
    setRequestOpen(false);
    setReason('Lost ID');
    setNotes('');
  };

  const submitIdRequest = async () => {
    setSubmitting(true);
    try {
      await seniorsAPI.requestNewId(seniorId, {
        reason,
        notes: notes.trim() || undefined,
      });
      notify('ID replacement request recorded.', 'success');
      setRequestOpen(false);
      setReason('Lost ID');
      setNotes('');
      await loadHistory();
    } catch {
      notify('Unable to record the ID request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Member history"
      className="mt-8 rounded-2xl border border-slate-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100/50 bg-blue-50 text-blue-600">
            <FileClock size={18} />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900">History Log</h3>
            <p className="text-xs font-medium text-slate-500">
              Information updates, ID requests, and other member activity.
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center justify-end self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-systemBlue px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IdCard size={15} />
            Request New ID
          </button>
        </div>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="space-y-3 px-5 py-6">
          <span className="sr-only">Loading history...</span>
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
              <div className="h-3 w-1/4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="px-5 py-8 text-center">
          <p className="text-sm font-bold text-slate-700">Unable to load history.</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={loadHistory}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:border-systemBlue hover:text-systemBlue"
          >
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <UserRound className="mx-auto text-slate-300" size={28} />
          <p className="mt-2 text-sm font-bold text-slate-600">No history recorded yet.</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Updates and ID requests will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Date &amp; Time
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Activity
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Reason
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={`${entry.id}-${entry.action}`}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${KIND_STYLES[entry.kind]}`}
                      >
                        {KIND_ICONS[entry.kind]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{entry.title}</p>
                        <p className="text-xs font-medium text-slate-500">{entry.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ReasonBadge reason={entry.reason} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-500">
                    {entry.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={requestOpen}
        onCancel={closeRequestForm}
        onConfirm={submitIdRequest}
        title="Request New ID"
        message="Record a replacement ID request for this member and select the reason."
        confirmLabel="Record request"
        cancelLabel="Cancel"
        variant="warning"
        loading={submitting}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="id-request-reason"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Reason
            </label>
            <select
              id="id-request-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as IdRequestReason)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-systemBlue focus:ring-2 focus:ring-blue-100"
            >
              <option value="Lost ID">Lost ID</option>
              <option value="Damaged ID">Damaged ID</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="id-request-notes"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Notes (optional)
            </label>
            <textarea
              id="id-request-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add details about the lost or damaged ID."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-systemBlue focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </ConfirmModal>
    </section>
  );
};

export default SeniorHistorySection;
