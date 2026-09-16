import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { seniorsAPI } from '../services/api';
import { SeniorCitizen } from '../types';
import ConfirmModal from './ConfirmModal';
import TransitionWrapper from './TransitionWrapper';
import Skeleton from './Skeleton';
import {
  TableHeadCell,
  TableAvatar,
  TableActionButton,
  EmptyTableRow,
  TablePagination,
  scrollMainToTop,
} from './Table';

interface ArchiveViewProps {
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  embedded?: boolean;
}

const ArchiveSkeleton = () => {
  return (
    <table className="w-full text-left">
      <thead className="bg-slate-50/70">
        <tr className="text-[10px] font-bold tracking-widest text-slate-400 uppercase border-b border-slate-100">
          <th className="px-8 py-5">Member Profile</th>
          <th className="px-8 py-5">Age / Gender</th>
          <th className="px-8 py-5">Barangay</th>
          <th className="px-8 py-5">Status</th>
          <th className="px-8 py-5 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {[...Array(15)].map((_, i) => (
          <tr key={i}>
            <td className="px-8 py-4">
              <div className="flex items-center gap-3">
                <Skeleton.Rect className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex flex-col gap-1">
                  <Skeleton.Text className="w-40 h-4" />
                  <Skeleton.Text className="w-20 h-3" />
                </div>
              </div>
            </td>
            <td className="px-8 py-4">
              <div className="flex flex-col gap-1">
                <Skeleton.Text className="w-16 h-4" />
                <Skeleton.Text className="w-12 h-3" />
              </div>
            </td>
            <td className="px-8 py-4"><Skeleton.Text className="w-24 h-4" /></td>
            <td className="px-8 py-4"><Skeleton.Rect className="w-24 h-6 rounded-lg" /></td>
            <td className="px-8 py-4 text-right">
              <Skeleton.Rect className="w-10 h-10 rounded-xl ml-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ArchiveView: React.FC<ArchiveViewProps> = ({ notify, embedded = false }) => {
  const [deletedSeniors, setDeletedSeniors] = useState<SeniorCitizen[]>([]);
  const [deceasedSeniors, setDeceasedSeniors] = useState<SeniorCitizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'deleted' | 'deceased'>('deleted');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const archivePerPage = 15;
  
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

  useEffect(() => {
    scrollMainToTop();
  }, [page]);

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
                className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-systemBlue/50 focus:ring-4 focus:ring-systemBlue/10 transition-all font-semibold shadow-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      )}

      <TransitionWrapper isLoading={loading} skeleton={
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto border-t border-slate-50">
            <ArchiveSkeleton />
          </div>
        </div>
      }>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-xl backdrop-blur-sm border border-slate-200">
              <button 
                onClick={() => { setActiveTab('deleted'); setPage(1); }}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'deleted' ? 'bg-white text-systemBlue shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Deleted
            </button>
              <button 
                onClick={() => { setActiveTab('deceased'); setPage(1); }}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'deceased' ? 'bg-white text-systemBlue shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Deceased
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-50">
          {!loading && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/70">
                <tr className="border-b border-slate-100">
                  <TableHeadCell className="px-8 py-5">Member Profile</TableHeadCell>
                  <TableHeadCell className="px-8 py-5">Age / Gender</TableHeadCell>
                  <TableHeadCell className="px-8 py-5">Barangay</TableHeadCell>
                  <TableHeadCell className="px-8 py-5">{activeTab === 'deleted' ? 'Deleted At' : 'Status'}</TableHeadCell>
                  <TableHeadCell className="px-8 py-5" align="right">Actions</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.slice((page - 1) * archivePerPage, page * archivePerPage).map((senior) => (
                  <tr key={senior.id} className="group hover:bg-slate-50/60 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <TableAvatar name={senior.name} />
                        <div className="min-w-0">
                          <p className="font-bold text-[13px] text-slate-900 uppercase leading-tight truncate">{senior.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{senior.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-sm font-bold text-slate-700 tabular-nums">{senior.age} yrs</p>
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
                      <div className="flex items-center justify-end">
                        {activeTab === 'deleted' ? (
                          <TableActionButton
                            title="Restore Record"
                            tone="success"
                            onClick={() => triggerRestore(senior)}
                          >
                            <RefreshCw size={14} />
                          </TableActionButton>
                        ) : (
                          <TableActionButton
                            title="Revert to Active"
                            tone="success"
                            onClick={() => triggerUnDeceased(senior)}
                          >
                            <RefreshCw size={14} />
                          </TableActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <EmptyTableRow colSpan={5} title="No records found" message="No records found in this category." />
                )}
              </tbody>
            </table>
            )}
        </div>

        {!loading && (
          <TablePagination
            page={page}
            totalPages={Math.max(1, Math.ceil(filteredData.length / archivePerPage))}
            onPage={setPage}
            from={(page - 1) * archivePerPage + 1}
            to={Math.min(page * archivePerPage, filteredData.length)}
            total={filteredData.length}
            noun="records"
          />
        )}
      </div>
      </TransitionWrapper>

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
