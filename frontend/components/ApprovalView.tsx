
import React, { useState, useEffect } from 'react';
import TransitionWrapper from './TransitionWrapper';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, XCircle, Search, Clock, FileText, User, Eye, MapPin, 
  Calendar, CreditCard, X, Paperclip, Download, Loader2, UserPlus, 
  IdCard, ChevronLeft, ChevronRight, Filter, ArrowUpRight, 
  ShieldCheck, AlertTriangle, Inbox
} from 'lucide-react';
import {
  TableHeadCell,
  TableAvatar,
  StatusPill,
  TableActionButton,
  ShowingText,
  PageJump,
  scrollMainToTop,
} from './Table';
import ConfirmModal, { ConfirmVariant } from './ConfirmModal';
import { PendingRequest, ViewType } from '../types';
import { requestsAPI, seniorsAPI } from '../services/api';
import Skeleton from './Skeleton';
import { ApprovalSkeleton } from './skeletons';
interface ApprovalViewProps {
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setView?: (view: ViewType) => void;
}

const ApprovalView: React.FC<ApprovalViewProps> = ({ notify, setView }) => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
    from: 0,
    to: 0,
  });

  const fetchRequests = async (page = currentPage, background = false) => {
    if (!background) {
      setLoading(true);
    }
    try {
      const response = await requestsAPI.getPending(page, pagination.perPage);
      const requestsData = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];

      const transformedRequests: PendingRequest[] = requestsData.map((r: any) => ({
        id: r.id.toString(),
        senior_id: r.senior_osca_id || r.senior?.osca_id || null,
        name: r.name || r.senior?.full_name || `${r.senior?.first_name || ''} ${r.senior?.last_name || ''}${r.senior?.extension_name ? ' ' + r.senior.extension_name : ''}`.trim() || 'Unknown',
        type: r.type || 'New Application',
        date: r.date || new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: r.status || 'Pending',
        details: r.details ? {
          ...r.details,
          dateOfBirth: r.details.dateOfBirth || r.senior?.date_of_birth,
          gender: r.details.gender || r.senior?.sex,
          address: r.details.streetAddress || r.senior?.street_address || 'N/A',
          documents: (r.details.documents || r.senior?.documents || []).map((d: any) => ({
            id: d.id,
            name: d.name || d.type || d.document_type || 'Document',
            filename: d.filename || d.fileName || d.file_name || 'unknown.file',
            type: d.type || (d.fileName?.endsWith('.pdf') ? 'pdf' : 'image')
          }))
        } : {
          dateOfBirth: r.senior?.date_of_birth || '',
          gender: r.senior?.sex || '',
          age: r.senior?.age || 0,
          address: r.senior?.street_address || 'N/A',
          barangay: r.senior?.barangay || 'N/A',
          rrn: r.senior?.rrn || '',
          emergency: r.senior?.emergency_name || '',
          profilePicture: r.senior?.profile_photo_path ? `${import.meta.env.VITE_API_URL || '/api'}/../storage/${r.senior.profile_photo_path}` : '',
          documents: (r.senior?.documents || []).map((d: any) => ({
            id: d.id,
            name: d.document_type || 'Document',
            filename: d.file_name || 'unknown.file',
            type: d.mime_type?.includes('pdf') ? 'pdf' : 'image'
          })),
        },
      }));

      setRequests(transformedRequests);
      const meta = response?.meta ?? response ?? {};
      setCurrentPage(meta.current_page ?? page);
      setPagination({
        currentPage: meta.current_page ?? page,
        lastPage: meta.last_page ?? 1,
        perPage: Number(meta.per_page ?? pagination.perPage),
        total: meta.total ?? transformedRequests.length,
        from: meta.from ?? (transformedRequests.length ? ((page - 1) * pagination.perPage) + 1 : 0),
        to: meta.to ?? ((page - 1) * pagination.perPage) + transformedRequests.length,
      });
    } catch (error) {
      const savedRequests = localStorage.getItem('pendingRequests');
      if (savedRequests) {
        const parsed = JSON.parse(savedRequests);
        setRequests(parsed);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          lastPage: 1,
          total: parsed.length,
          from: parsed.length ? 1 : 0,
          to: parsed.length,
        }));
      } else {
        setRequests([]);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          lastPage: 1,
          total: 0,
          from: 0,
          to: 0,
        }));
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };
  
  // Real-time data fetching from Laravel API
  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage]);

  useEffect(() => {
    scrollMainToTop();
  }, [currentPage]);
  
  // Confirmation state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'Approve' | 'Reject' | null;
    id: string | null;
  }>({ isOpen: false, type: null, id: null });

  // OSCA ID input for approval
  const [approvalOscaId, setApprovalOscaId] = useState('');

  // Filter requests based on search term
  const filteredRequests = requests.filter(req => 
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const triggerConfirm = (id: string, action: 'Approve' | 'Reject') => {
    if (action === 'Approve') setApprovalOscaId('');
    setConfirmState({ isOpen: true, type: action, id });
  };

  const handleAction = async () => {
    const { id, type } = confirmState;
    if (id && type) {
      setIsProcessing(true);
      try {
        if (type === 'Approve') {
          await requestsAPI.approve(parseInt(id), approvalOscaId || undefined);
        } else {
          await requestsAPI.reject(parseInt(id));
        }
        const nextPage = requests.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(nextPage);
        await fetchRequests(nextPage);
        setSelectedRequest(null);
        notify(`Request ${type}d successfully.`, type === 'Approve' ? 'success' : 'info');
      } catch (error) {
        notify(`Failed to ${type?.toLowerCase()} request.`, 'error');
      } finally {
        setIsProcessing(false);
        setApprovalOscaId('');
        setConfirmState({ isOpen: false, type: null, id: null });
      }
    }
  };

  const DetailRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-colors">
      <div className="mt-0.5 w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-0.5">{label}</p>
        <p className="text-[13px] font-semibold text-slate-800 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  };

  const getTypeConfig = (type: string) => {
    if (type === 'New Application') {
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' };
    }
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' };
  };

  const getReasonConfig = (type: string) => {
    if (type === 'New Application') {
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'New Member' };
    }
    return { bg: 'bg-violet-50', text: 'text-violet-700', label: 'New ID' };
  };

  return (
    <div className="space-y-8">
      {/* Page Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        {/* Search Bar */}
        <div className="relative group flex-1 sm:max-w-md">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-systemBlue transition-colors pointer-events-none">
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, ID, or type..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-systemBlue/50 focus:ring-3 focus:ring-systemBlue/10 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Pending Count Badge */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[12px] font-bold text-amber-700">
              {pagination.total} Pending
            </span>
          </div>

          {/* New Registration Button */}
          {setView && (
            <button
              onClick={() => setView(ViewType.ADD_MEMBER)}
              className="px-5 py-2.5 bg-systemBlue text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 text-[13px] active:scale-[0.97] whitespace-nowrap"
            >
              <UserPlus size={16} strokeWidth={2.5} /> 
              <span>New Registration</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card — auto height to content */}
      <TransitionWrapper isLoading={loading} skeleton={
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <ApprovalSkeleton />
          </div>
        </div>
      }>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 ease-out">
        <div className="overflow-x-auto">
          {!loading && filteredRequests.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50/70">
                <tr className="border-b border-slate-100">
                  <TableHeadCell className="px-5">Applicant</TableHeadCell>
                  <TableHeadCell className="px-5" align="center">OSCA ID</TableHeadCell>
                  <TableHeadCell className="px-5" align="center">Request Type</TableHeadCell>
                  <TableHeadCell className="px-5" align="center">Reason</TableHeadCell>
                  <TableHeadCell className="px-5" align="center">Submitted</TableHeadCell>
                  <TableHeadCell className="px-5" align="center">Status</TableHeadCell>
                  <TableHeadCell className="px-6" align="right">Actions</TableHeadCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((req, idx) => {
                  const typeConfig = getTypeConfig(req.type);
                  const reasonConfig = getReasonConfig(req.type);
                  return (
                    <tr 
                      key={req.id} 
                      className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      {/* Applicant */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0">
                            {req.details.profilePicture ? (
                              <img src={req.details.profilePicture} alt={req.name} className="w-full h-full object-cover" />
                            ) : (
                              <TableAvatar name={req.name} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 leading-tight truncate uppercase group-hover:text-systemBlue transition-colors">{req.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5 tabular-nums">#{req.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* OSCA ID */}
                      <td className="px-5 py-4">
                        {req.senior_id ? (
                          <span className="text-[13px] font-bold text-slate-800 tabular-nums">{req.senior_id}</span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Request Type */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${typeConfig.bg} ${typeConfig.text} border ${typeConfig.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
                          {req.type}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${reasonConfig.bg} ${reasonConfig.text}`}>
                          {reasonConfig.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-300" />
                          <span className="text-[12px] font-medium text-slate-600">{req.date}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center">
                          <StatusPill status={req.status} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <TableActionButton
                            title="View Details"
                            tone="view"
                            onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                          >
                            <Eye size={14} strokeWidth={2.5} />
                          </TableActionButton>
                          <TableActionButton
                            title="Reject"
                            tone="danger"
                            onClick={(e) => { e.stopPropagation(); triggerConfirm(req.id, 'Reject'); }}
                          >
                            <XCircle size={14} strokeWidth={2.5} />
                          </TableActionButton>
                          <TableActionButton
                            title="Approve"
                            tone="success"
                            onClick={(e) => { e.stopPropagation(); triggerConfirm(req.id, 'Approve'); }}
                          >
                            <CheckCircle size={14} strokeWidth={2.5} />
                          </TableActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 px-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
                <Inbox size={28} className="text-slate-300" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-700 mb-1">All Clear</h3>
              <p className="text-[13px] text-slate-400 font-medium text-center max-w-xs">
                {searchTerm ? `No requests matching "${searchTerm}"` : 'No pending requests at the moment. New submissions will appear here.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <ShowingText from={pagination.from} to={pagination.to} total={pagination.total} noun="requests" />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.currentPage <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-systemBlue hover:text-systemBlue transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Page Numbers */}
              {(() => {
                const windowStart = Math.max(1, Math.min(pagination.currentPage - 2, Math.max(1, pagination.lastPage - 4)));
                const windowPages: number[] = [];
                for (let p = windowStart; p <= Math.min(pagination.lastPage, windowStart + 4); p++) windowPages.push(p);
                return windowPages.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center ${
                      pagination.currentPage === pageNum
                        ? 'bg-systemBlue text-white shadow-sm shadow-blue-500/20'
                        : 'border border-slate-200 bg-white text-slate-500 hover:border-systemBlue hover:text-systemBlue'
                    }`}
                  >
                    {pageNum}
                  </button>
                ));
              })()}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(pagination.lastPage, prev + 1))}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-systemBlue hover:text-systemBlue transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
              <PageJump page={pagination.currentPage} totalPages={pagination.lastPage} onJump={setCurrentPage} />
            </div>
          </div>
        )}
      </div>
      </TransitionWrapper>

      {/* Detail Modal */}
      {selectedRequest && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl shadow-slate-900/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <FileText size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Application Review</h3>
                  <p className="text-[11px] font-medium text-slate-400">Request #{selectedRequest.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {/* Applicant Header Card */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl border border-slate-100/80 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 shadow-sm">
                  {selectedRequest.details.profilePicture ? (
                    <img 
                      src={selectedRequest.details.profilePicture} 
                      alt={selectedRequest.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-extrabold text-slate-400">
                      {getInitials(selectedRequest.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight truncate">{selectedRequest.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {(() => {
                      const tc = getTypeConfig(selectedRequest.type);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${tc.bg} ${tc.text} border ${tc.border}`}>
                          <span className={`w-1 h-1 rounded-full ${tc.dot}`} />
                          {selectedRequest.type}
                        </span>
                      );
                    })()}
                    <span className="text-[11px] text-slate-400 font-medium">Submitted {selectedRequest.date}</span>
                  </div>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <DetailRow icon={Calendar} label="Date of Birth" value={selectedRequest.details.dateOfBirth} />
                <DetailRow icon={User} label="Gender" value={selectedRequest.details.gender || 'N/A'} />
                <DetailRow icon={Clock} label="Age" value={`${selectedRequest.details.age} years old`} />
                <DetailRow icon={MapPin} label="Address" value={selectedRequest.details.address} />
                <DetailRow icon={MapPin} label="Barangay" value={selectedRequest.details.barangay} />
                <DetailRow icon={CreditCard} label="RRN Number" value={selectedRequest.details.rrn} />
                <DetailRow icon={User} label="Emergency Contact" value={selectedRequest.details.emergency} />
              </div>

              {/* Documents Section */}
              {selectedRequest.details.documents && selectedRequest.details.documents.length > 0 && (
                <div className="pt-5 border-t border-slate-100">
                  <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">
                    <Paperclip size={12} /> Attached Documents
                    <span className="ml-auto text-[9px] font-bold text-slate-300 normal-case">{selectedRequest.details.documents.length} file(s)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedRequest.details.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                          doc.type === 'pdf' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-blue-50 border-blue-100 text-blue-500'
                        }`}>
                          <FileText size={16} />
                        </div>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-slate-700 truncate">{doc.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 truncate">{doc.filename}</p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center" 
                            title="View"
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              if (selectedRequest.senior_id && doc.id) {
                                try {
                                  const blob = await seniorsAPI.viewDocument(selectedRequest.senior_id, doc.id);
                                  const url = URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                  setTimeout(() => URL.revokeObjectURL(url), 60000);
                                } catch (err) { notify("Error opening file", "error"); }
                              } else {
                                notify(`Viewing ${doc.filename}`, 'info'); 
                              }
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center" 
                            title="Download"
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              if (selectedRequest.senior_id && doc.id) {
                                try {
                                  const blob = await seniorsAPI.viewDocument(selectedRequest.senior_id, doc.id);
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', doc.filename);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  setTimeout(() => URL.revokeObjectURL(url), 60000);
                                } catch (err) { notify("Download failed", "error"); }
                              } else {
                                notify(`Downloading ${doc.filename}`, 'success'); 
                              }
                            }}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 bg-slate-50/30">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors text-center order-3 sm:order-1 text-[13px]"
              >
                Close
              </button>
              <button 
                onClick={() => triggerConfirm(selectedRequest.id, 'Reject')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 order-2 text-[13px]"
              >
                <XCircle size={16} /> Reject
              </button>
              <button 
                onClick={() => triggerConfirm(selectedRequest.id, 'Approve')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 order-1 sm:order-3 text-[13px]"
              >
                <CheckCircle size={16} /> Approve
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Confirmation Modal Integration */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`${confirmState.type} Application?`}
        message={`Are you sure you want to ${confirmState.type?.toLowerCase()} this request? This will finalize the member record in the registry.`}
        variant={confirmState.type === 'Approve' ? 'success' : 'danger'}
        confirmLabel={confirmState.type === 'Approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        onConfirm={handleAction}
        onCancel={() => { setApprovalOscaId(''); setConfirmState({ isOpen: false, type: null, id: null }); }}
        loading={isProcessing}
      >
        {confirmState.type === 'Approve' && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <label htmlFor="confirm-approval-osca-id" className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 mb-2 block">Assign OSCA ID</label>
            <input
              id="confirm-approval-osca-id"
              name="confirmApprovalOscaId"
              type="text"
              placeholder="Enter OSCA ID"
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-bold text-emerald-900 text-lg tracking-wider"
              value={approvalOscaId}
              onChange={e => setApprovalOscaId(e.target.value)}
            />
            <p className="text-[11px] text-emerald-500 font-semibold mt-2">Enter the OSCA ID to assign to this member.</p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default ApprovalView;
