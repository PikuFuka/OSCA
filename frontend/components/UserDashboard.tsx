
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Clock,
  XCircle,
  ShieldCheck,
  Trash2,
  Upload,
  Loader2,
  Eye
} from 'lucide-react';
import { CurrentUser } from '../types';
import { seniorsAPI } from '../services/api';
import { UserDashboardSkeleton } from './SkeletonLoader';
import ConfirmModal from './ConfirmModal';

interface UserDashboardProps {
  currentUser: CurrentUser;
  notify?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, notify }) => {
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    docId: number | null;
    type: string | null;
    label: string;
  }>({
    isOpen: false,
    docId: null,
    type: null,
    label: ''
  });

  const fetchMemberData = async () => {
    try {
      setFetchError(null);
      // Always fetch fresh — stale cache would hide newly uploaded documents
      const data = await seniorsAPI.getByIdFresh(currentUser.id as any);
      setMemberDetails(data);
    } catch (error: any) {
      setFetchError(error?.message || 'Failed to load your data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [currentUser.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setActionLoading(type);
      await seniorsAPI.uploadDocument(currentUser.id, file, type);
      if (notify) notify(`${file.name} uploaded successfully`, 'success');
      await fetchMemberData();
    } catch (error: any) {
      if (notify) notify(error.message || 'Upload failed', 'error');
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.docId || !deleteModal.type) return;

    try {
      const { docId, type } = deleteModal;
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
      setActionLoading(type);
      await seniorsAPI.deleteDocument(currentUser.id, docId);
      if (notify) notify('Document deleted successfully', 'success');
      await fetchMemberData();
    } catch (error: any) {
      if (notify) notify(error.message || 'Delete failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDocument = (docId: number, type: string, label: string) => {
    setDeleteModal({
      isOpen: true,
      docId,
      type,
      label
    });
  };

  if (loading) {
    return <UserDashboardSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="p-6 bg-rose-50 rounded-full">
          <AlertCircle className="text-rose-500" size={48} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-black text-slate-900 mb-2">Could not load your data</h2>
          <p className="text-slate-500 font-medium text-sm mb-4">{fetchError}</p>
          <button
            onClick={fetchMemberData}
            className="px-6 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const status = memberDetails?.status || 'Pending';
  const pensionType = memberDetails?.pensionStatus || 'N/A';
  
  // Get actual documents from member data
  const uploadedDocs = memberDetails?.documents || [];
  
  // Requirements based on actual uploaded documents
  const requirements = [
    { label: 'Birth Certificate', type: 'birthCert', doc: uploadedDocs.find((d: any) => (d.type === 'birthCert' || d.document_type === 'birthCert')) },
    { label: 'Barangay Clearance', type: 'brgyCert', doc: uploadedDocs.find((d: any) => (d.type === 'brgyCert' || d.document_type === 'brgyCert')) },
    { label: '1x1 ID Picture', type: 'idPicture', doc: uploadedDocs.find((d: any) => (d.type === 'idPicture' || d.document_type === 'idPicture')) }, 
    { label: 'Cedula / CTC', type: 'cedula', doc: uploadedDocs.find((d: any) => (d.type === 'cedula' || d.document_type === 'cedula')) },     
  ];

  const missingCount = requirements.filter(r => !r.doc).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-200 font-bold uppercase tracking-widest text-xs">
              <span className={`w-2 h-2 rounded-full animate-pulse ${status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {status === 'Active' ? 'Verified Member' : 'Application Pending'}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Hello, {currentUser.name.split(' ')[0]}!</h1>
            <p className="text-blue-100 text-lg max-w-xl leading-relaxed">Welcome to your OSCA online portal.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[120px]">
             <p className="text-xs font-bold text-blue-200 uppercase mb-1">OSCA ID</p>
             <p className="text-2xl font-black text-white tracking-widest">{currentUser.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Application Status Card */}
           <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-blue-900" size={24} /> Application Status
                </h3>
                
                {/* Progress Stepper */}
                <div className="relative flex items-center justify-between mb-8 px-4">
                    {/* Background Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0"></div>
                    {/* Active Line */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all duration-1000`} 
                         style={{ width: status === 'Active' ? '100%' : '50%' }}></div>

                    {/* Step 1: Submitted */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 ring-4 ring-white">
                        <CheckCircle size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-white px-2 rounded-full">Sent</span>
                    </div>

                    {/* Step 2: Review */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ring-4 ring-white
                        ${status === 'Active' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>
                        {status === 'Active' ? <CheckCircle size={16} /> : <Clock size={16} />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider bg-white px-2 rounded-full
                        ${status === 'Active' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        Review
                      </span>
                    </div>

                    {/* Step 3: Approved */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ring-4 ring-white
                        ${status === 'Active' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                        {status === 'Active' ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-slate-400 rounded-full"></div>}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider bg-white px-2 rounded-full
                        ${status === 'Active' ? 'text-emerald-600' : 'text-slate-300'}`}>
                        OK
                      </span>
                    </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex items-start gap-3 ${status === 'Active' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>
                 {status === 'Active' 
                   ? <CheckCircle className="shrink-0 mt-0.5" size={20} />
                   : <Clock className="shrink-0 mt-0.5" size={20} />
                 }
                 <div>
                    <p className="font-black text-sm">
                      {status === 'Active' ? 'Ready to use!' : 'Under Review'}
                    </p>
                    <p className="text-xs opacity-80 mt-1 leading-tight">
                      {status === 'Active' 
                        ? 'Congratulations! You are now a verified member.' 
                        : 'Staff are checking your papers.'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Pension Category Card */}
           <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Pension Type</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0
                    ${pensionType === 'Social Pensioner' ? 'bg-blue-50 text-blue-900' : 
                      pensionType === 'Indigent' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                    <Activity size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{pensionType}</h3>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                   {pensionType === 'Indigent' ? 'Local assistance & medical help.' : 
                    pensionType === 'Social Pensioner' ? 'DSWD Social Pension Program.' :
                    'Private or Government pensioner.'}
                </p>
              </div>
           </div>
      </div>

      {/* Full Width Requirements Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="text-blue-900" size={24} /> Document List
              </h3>
              {missingCount > 0 ? (
                <span className="bg-rose-100 text-rose-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  {missingCount} more needed
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                  All Complete
                </span>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {requirements.map((req, idx) => (
                <div key={idx} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4
                  ${req.doc ? 'bg-slate-50 border-slate-100' : 'bg-white border-blue-100 shadow-md shadow-blue-50'}`}>
                   
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                          ${req.doc ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none mb-1">{req.label}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest
                            ${req.doc ? 'text-emerald-500' : 'text-blue-500'}`}>
                            {req.doc ? 'Finish' : 'Need'}
                          </p>
                        </div>
                     </div>
                     {req.doc && (
                        <div className="bg-emerald-500 text-white p-1 rounded-full">
                          <CheckCircle size={14} />
                        </div>
                     )}
                   </div>

                   {req.doc && (
                      <div className="bg-white/50 p-2 rounded-xl border border-slate-200/50 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                          File Ready
                        </span>
                      </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-2 mt-auto">
                     {actionLoading === req.type ? (
                       <div className="col-span-2 flex items-center justify-center py-2 bg-slate-100 rounded-xl">
                         <Loader2 size={20} className="text-blue-600 animate-spin" />
                       </div>
                     ) : req.doc ? (
                       <>
                         <a 
                           href={seniorsAPI.getDocumentUrl(currentUser.id, req.doc.id)} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center justify-center gap-2 py-2.5 bg-blue-900 text-white rounded-xl font-black text-xs hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 sm:flex-1"
                         >
                           <Eye size={16} /> VIEW
                         </a>
                         <button 
                           onClick={() => handleDeleteDocument(req.doc.id, req.type, req.label)}
                           className="flex items-center justify-center gap-2 py-2.5 bg-white text-rose-600 border-2 border-rose-50 rounded-xl font-black text-xs hover:bg-rose-50 hover:border-rose-100 transition-all sm:flex-1"
                         >
                           <Trash2 size={16} /> CLEAR
                         </button>
                       </>
                     ) : (
                       <label htmlFor={`user-document-upload-${req.type}`} className="col-span-2 cursor-pointer flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-black text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]">
                         <Upload size={20} /> UPLOAD
                         <input 
                           id={`user-document-upload-${req.type}`}
                           name={`documentUpload-${req.type}`}
                           type="file" 
                           className="hidden" 
                           onChange={(e) => handleFileUpload(e, req.type)}
                           accept="image/*,.pdf"
                         />
                       </label>
                     )}
                   </div>
                </div>
              ))}
           </div>

           {missingCount > 0 ? (
             <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
               <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wide mb-2">
                 <AlertCircle size={16} /> Action Required
               </div>
               <p className="text-xs text-rose-600 leading-relaxed font-medium">
                 Please submit the missing documents to the OSCA office to proceed with your application.
               </p>
             </div>
           ) : (
             <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
               <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide mb-2">
                 <CheckCircle size={16} /> All Set
               </div>
               <p className="text-xs text-emerald-600 leading-relaxed font-medium">
                 You have submitted all required documents. No further action is needed at this time.
               </p>
             </div>
           )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Document"
        message={`Are you sure you want to delete your ${deleteModal.label}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UserDashboard;
