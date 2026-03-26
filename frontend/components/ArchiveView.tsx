import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, UserX, UserMinus, Loader2 } from 'lucide-react';
import { seniorsAPI } from '../services/api';
import { SeniorCitizen } from '../types';
import { TableSkeleton } from './SkeletonLoader';
import ConfirmModal from './ConfirmModal';

interface ArchiveViewProps {
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  embedded?: boolean;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ notify, embedded = false }) => {
  const [deletedSeniors, setDeletedSeniors] = useState<SeniorCitizen[]>([]);
  const [deceasedSeniors, setDeceasedSeniors] = useState<SeniorCitizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'deleted' | 'deceased'>('deleted');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    senior: SeniorCitizen | null;
    type: 'restore' | 'un-deceased' | null;
  }>({ isOpen: false, senior: null, type: null });

  const fetchArchiveData = async () => {
    setLoading(true);
    try {
      const [deletedRes, deceasedRes] = await Promise.all([
        seniorsAPI.getDeleted(),
        seniorsAPI.getDeceased()
      ]);
      setDeletedSeniors(deletedRes.data || []);
      setDeceasedSeniors(deceasedRes.data || []);
    } catch (error) {
      notify("Failed to fetch archive data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveData();
  }, []);

  const triggerRestore = (senior: SeniorCitizen) => {
    setConfirmState({ isOpen: true, senior, type: 'restore' });
  };

  const triggerUnDeceased = (senior: SeniorCitizen) => {
    setConfirmState({ isOpen: true, senior, type: 'un-deceased' });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.senior || !confirmState.type) return;
    
    setIsProcessing(true);
    try {
      if (confirmState.type === 'restore') {
        await seniorsAPI.restore(confirmState.senior.id);
        notify("Member restored successfully", "success");
      } else {
        await seniorsAPI.unDeceased(confirmState.senior.id);
        notify("Member status reverted to Active", "success");
      }
      
      setConfirmState({ isOpen: false, senior: null, type: null });
      fetchArchiveData();
    } catch (error) {
      notify(`Failed to ${confirmState.type} member`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredData = (activeTab === 'deleted' ? deletedSeniors : deceasedSeniors).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {!embedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Archive</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 bg-white/50 w-fit px-3 py-1 rounded-full border border-slate-200 shadow-sm">Inactive Records</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            <div className="relative group w-full sm:w-[350px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-systemBlue/5 rounded-lg flex items-center justify-center text-slate-400 group-focus-within:text-systemBlue transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search archive..."
                className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-ios text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-systemBlue/50 focus:ring-4 focus:ring-systemBlue/10 transition-all font-semibold shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="ios-card shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-ios backdrop-blur-sm border border-slate-200">
            <button 
              onClick={() => setActiveTab('deleted')}
              className={`px-8 py-3 rounded-ios text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'deleted' ? 'bg-white text-systemBlue shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Deleted
            </button>
            <button 
              onClick={() => setActiveTab('deceased')}
              className={`px-8 py-3 rounded-ios text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'deceased' ? 'bg-white text-systemBlue shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Deceased
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-50">
          {loading ? (
             <div className="p-10">
               <TableSkeleton />
             </div>
          ) : (
            <table className="ios-table">
              <thead>
                <tr>
                  <th className="px-8 py-5">Member Profile</th>
                  <th className="px-8 py-5">Age / Gender</th>
                  <th className="px-8 py-5">Barangay</th>
                  <th className="px-8 py-5">{activeTab === 'deleted' ? 'Deleted At' : 'Status'}</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((senior) => (
                  <tr key={senior.id}>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          {activeTab === 'deleted' ? <UserMinus size={20} /> : <UserX size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{senior.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{senior.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-sm font-bold text-slate-700">{senior.age} yrs</p>
                      <p className="text-xs text-slate-500">{senior.gender}</p>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-slate-600">{senior.barangay}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                        activeTab === 'deleted' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeTab === 'deleted' ? (senior as any).deleted_at : 'Deceased'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {activeTab === 'deleted' ? (
                        <button 
                          onClick={() => triggerRestore(senior)}
                          className="w-10 h-10 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-ios border border-emerald-100 flex items-center justify-center transition-all duration-300 shadow-sm ml-auto"
                          title="Restore Record"
                        >
                          <RefreshCw size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => triggerUnDeceased(senior)}
                          className="w-10 h-10 bg-systemBlue/5 hover:bg-systemBlue text-systemBlue hover:text-white rounded-ios border border-systemBlue/10 flex items-center justify-center transition-all duration-300 shadow-sm ml-auto"
                          title="Revert to Active"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-bold">
                      No records found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.type === 'restore' ? "Restore Member Record?" : "Bring Member back to Active?"}
        message={
          confirmState.type === 'restore' 
            ? `Are you sure you want to restore ${confirmState.senior?.name} to the active registry? They will regain their previous status.`
            : `Are you sure you want to revert the status of ${confirmState.senior?.name} to Active? Use this to correct status mistakes.`
        }
        variant={confirmState.type === 'restore' ? "success" : "primary"}
        confirmLabel={confirmState.type === 'restore' ? "Restore Member" : "Revert Status"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ isOpen: false, senior: null, type: null })}
        loading={isProcessing}
      />
    </div>
  );
};

export default ArchiveView;
