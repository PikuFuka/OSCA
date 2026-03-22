
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, AlertCircle, RefreshCcw, User, Loader2, Search, Trash2, Info } from 'lucide-react';
import { activityLogsAPI } from '../services/api';
import { TableSkeleton } from './SkeletonLoader';
import ConfirmModal from './ConfirmModal';

interface HistoryLogViewProps {
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface ActivityLog {
  id: number;
  action: string;
  time: string;
  type: string;
  user: string;
}

const HistoryLogView: React.FC<HistoryLogViewProps> = ({ notify }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 30000) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const mapActionToType = (action: string): string => {
    if (action.includes('APPROVED') || action.includes('REGISTERED')) return 'success';
    if (action.includes('REJECTED') || action.includes('DECEASED') || action.includes('CLEARED') || action.includes('DELETE')) return 'warning';
    if (action.includes('BACKUP') || action.includes('IMPORT') || action.includes('EXPORT')) return 'system';
    return 'info';
  };

  const fetchLogs = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      const response = await activityLogsAPI.getAll(params);
      if (response.data && Array.isArray(response.data)) {
        const transformedLogs: ActivityLog[] = response.data.map((log: any) => {
          let actionText = log.action;
          if (log.action === 'APPROVED_REQUEST') actionText = `Approved request for ${log.details?.senior_name || 'Senior'}`;
          if (log.action === 'REJECTED_REQUEST') actionText = `Rejected request for ${log.details?.senior_name || 'Senior'}`;
          if (log.action === 'SUBMITTED_UPDATE_REQUEST') actionText = `Submitted update request for ${log.details?.name || 'Senior'}`;
          if (log.action === 'REGISTERED_SENIOR') actionText = `Registered new senior: ${log.details?.name || 'Unknown'}`;
          if (log.action === 'UPDATED_SENIOR') actionText = `Updated details for ${log.details?.name || 'Senior'}`;
          if (log.action === 'MARKED_DECEASED') actionText = `Marked senior as deceased: ${log.details?.name || 'Senior'}`;
          if (log.action === 'LOGIN') actionText = `User logged in`;
          if (log.action === 'LOGOUT') actionText = `User logged out`;
          if (log.action === 'CLEARED_LOGS') actionText = `Activity logs cleared`;
          if (log.action === 'DATABASE_EXPORT') actionText = `Database exported`;
          if (log.action === 'DATABASE_IMPORT') actionText = `Database restored from backup`;
          if (log.action === 'PRINTED_ID') actionText = `Printed ID card for ${log.details?.name || 'Senior'}`;

          return {
            id: log.id,
            action: actionText,
            time: formatTimeAgo(new Date(log.timestamp || log.created_at)),
            type: mapActionToType(log.action),
            user: log.user?.name || log.user || 'System'
          };
        });
        setLogs(transformedLogs);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(searchTerm || undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchLogs]);

  const handleClearLogs = async () => {
    setConfirmClear(false);
    setClearing(true);
    try {
      await activityLogsAPI.clear();
      setLogs([]);
      notify('All activity logs have been cleared.', 'success');
    } catch (error: any) {
      console.error(error); notify('Failed to clear logs.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'warning': return <AlertCircle className="text-rose-500" size={18} />;
      case 'system': return <RefreshCcw className="text-indigo-500" size={18} />;
      default: return <Clock className="text-sky-500" size={18} />;
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Activity History</h2>
          <p className="text-slate-500 font-medium mt-1">System events and user actions are logged here.</p>
        </div>
        <button
          onClick={() => setConfirmClear(true)}
          disabled={clearing || logs.length === 0}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Trash2 size={16} /> 
          <span className="hidden sm:inline">Clear All Logs</span>
        </button>
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
        <Info size={16} className="text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700 font-bold">Logs older than 24 hours are automatically deleted to keep the system clean.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input
              type="text"
              placeholder="Search logs by action, user, or keyword…"
              className="w-full pl-14 pr-6 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span className="ml-10">Activity Details</span>
          <span>Time & User</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-slate-400 mb-2" size={24} />
              <p className="text-sm text-slate-400">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Clock size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="font-bold">No activity logs found.</p>
              {searchTerm && <p className="text-xs mt-1">Try a different search term.</p>}
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-5 flex items-start justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getIcon(log.type)}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Reference ID: #ACT-{String(log.id).padStart(6, '0')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[11px] font-bold text-slate-600 mb-0.5" title={new Date(log.time).toLocaleString()}>
                    {log.time}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 py-1 px-2.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    <User size={10} className="text-slate-400" />
                    {log.user}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmClear}
        title="Clear All Logs?"
        message="This will permanently delete all activity history records. This action cannot be undone."
        variant="danger"
        confirmLabel="Yes, Clear All"
        onConfirm={handleClearLogs}
        onCancel={() => setConfirmClear(false)}
        loading={clearing}
      />
    </div>
  );
};

export default HistoryLogView;

