
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Search, Clock, FileText, User, Eye, MapPin, Calendar, CreditCard, X, Paperclip, Download, Loader2, UserPlus, IdCard } from 'lucide-react';
import ConfirmModal, { ConfirmVariant } from './ConfirmModal';
import { PendingRequest, ViewType } from '../types';
import { requestsAPI, seniorsAPI } from '../services/api';
import { TableSkeleton } from './SkeletonLoader';

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
        senior_id: r.senior_id,
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
      setCurrentPage(response?.current_page ?? page);
      setPagination({
        currentPage: response?.current_page ?? page,
        lastPage: response?.last_page ?? 1,
        perPage: Number(response?.per_page ?? pagination.perPage),
        total: response?.total ?? transformedRequests.length,
        from: response?.from ?? (transformedRequests.length ? ((page - 1) * pagination.perPage) + 1 : 0),
        to: response?.to ?? ((page - 1) * pagination.perPage) + transformedRequests.length,
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
    const refreshRequests = () => {
      if (document.visibilityState === 'visible') {
        fetchRequests(currentPage, true);
      }
    };

    const intervalId = window.setInterval(refreshRequests, 10000);
    window.addEventListener('focus', refreshRequests);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshRequests);
    };
  }, [currentPage, pagination.perPage]);
  
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
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="mt-0.5 text-slate-400"><Icon size={16} /></div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">For Approvals</h2>
          <p className="text-slate-500 font-medium">Review and process new ID applications and updates.</p>
        </div>
        {setView && (
          <button
            onClick={() => setView(ViewType.ADD_MEMBER)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-900 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 w-full sm:w-auto"
          >
            <UserPlus size={18} /> 
            <span className="text-xs sm:text-sm">New Registration</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Search request..."
              className="w-full pl-14 pr-6 py-3 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 text-center md:text-right">
            {pagination.total > 0 ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total}` : 'No records'}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
               <div className="p-20">
                 <TableSkeleton />
               </div>
            ) : (
              <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-50">
                <th className="px-10 py-6">Applicant</th>
                <th className="px-10 py-6">Request Type</th>
                <th className="px-10 py-6">Reason for ID</th>
                <th className="px-10 py-6">Date Submitted</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                        {req.details.profilePicture ? (
                           <img src={req.details.profilePicture} alt={req.name} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-xs font-black text-blue-900 leading-none">
                             {req.name.split(' ').map((n: string) => n[0]).join('')}
                           </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 leading-tight">{req.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{req.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide ${
                      req.type === 'New Application' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <FileText size={12} />
                      {req.type}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide ${
                      req.type === 'New Application' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {req.type === 'New Application' ? 'New Member' : 'New ID'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-sm font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      {req.date}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      req.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-2 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                      <button 
                        onClick={() => triggerConfirm(req.id, 'Reject')}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Reject"
                      >
                        <XCircle size={20} />
                      </button>
                      <button 
                        onClick={() => triggerConfirm(req.id, 'Approve')}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors" title="Approve"
                      >
                        <CheckCircle size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300"><CheckCircle size={32} /></div>
                      <p className="text-slate-400 font-bold text-sm">No pending requests at the moment</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          )}
        </div>

        {!loading && pagination.lastPage > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-slate-100 bg-slate-50/30">
            <p className="text-sm font-semibold text-slate-500">
              Page {pagination.currentPage} of {pagination.lastPage}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.currentPage <= 1}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(pagination.lastPage, prev + 1))}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Application Review</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedRequest.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                {/* Profile Picture Display */}
                <div className="w-20 h-20 rounded-[1.2rem] bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200 shadow-sm shrink-0">
                  {selectedRequest.details.profilePicture ? (
                    <img 
                      src={selectedRequest.details.profilePicture} 
                      alt={selectedRequest.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-blue-900">
                      {selectedRequest.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">{selectedRequest.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-black uppercase tracking-wide">
                      {selectedRequest.type}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">• Submitted: {selectedRequest.date}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <DetailRow icon={Calendar} label="Date of Birth" value={selectedRequest.details.dateOfBirth} />
                <DetailRow icon={User} label="Gender" value={selectedRequest.details.gender || 'N/A'} />
                <DetailRow icon={Clock} label="Age" value={`${selectedRequest.details.age} years old`} />
                <DetailRow icon={MapPin} label="Address" value={selectedRequest.details.address} />
                <DetailRow icon={MapPin} label="Barangay" value={selectedRequest.details.barangay} />
                <DetailRow icon={CreditCard} label="RRN Number" value={selectedRequest.details.rrn} />
                <DetailRow icon={User} label="Emergency Contact" value={selectedRequest.details.emergency} />
              </div>

              {/* Uploaded Documents Section */}
              {selectedRequest.details.documents && selectedRequest.details.documents.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                      <Paperclip size={16} /> Submitted Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedRequest.details.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer">
                                <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                                  doc.type === 'pdf' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-blue-50 border-blue-100 text-blue-500'
                                }`}>
                                  <FileText size={18} />
                                </div>
                                <div className="overflow-hidden min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-700 truncate">{doc.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate">{doc.filename}</p>
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button 
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" 
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
                                      <Eye size={16} />
                                  </button>
                                  <button 
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors" 
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
                                      <Download size={16} />
                                  </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-3 bg-white z-10">
                 <button 
                  onClick={() => setSelectedRequest(null)}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-center order-3 sm:order-1 text-sm bg-slate-50/50 sm:bg-transparent"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => triggerConfirm(selectedRequest.id, 'Reject')}
                  className="w-full sm:w-auto px-4 sm:px-6 py-4 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 order-2 text-sm"
                >
                  <XCircle size={18} /> Reject
                </button>
                <button 
                  onClick={() => triggerConfirm(selectedRequest.id, 'Approve')}
                  className="w-full sm:w-auto px-4 sm:px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 order-1 sm:order-3 text-sm"
                >
                  <CheckCircle size={18} /> Approve
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
            <label htmlFor="confirm-approval-osca-id" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 block">Assign OSCA ID</label>
            <input
              id="confirm-approval-osca-id"
              name="confirmApprovalOscaId"
              type="text"
              placeholder="Enter OSCA ID"
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-bold text-emerald-900 text-lg tracking-wider"
              value={approvalOscaId}
              onChange={e => setApprovalOscaId(e.target.value)}
            />
            <p className="text-xs text-emerald-500 font-bold mt-2">Enter the OSCA ID to assign to this member.</p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default ApprovalView;
