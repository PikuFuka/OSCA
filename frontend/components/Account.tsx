import React, { useState, useMemo, useEffect } from 'react';
import TransitionWrapper from './TransitionWrapper';
import { createPortal } from 'react-dom';
import { Search, Edit2, Plus, Users, Shield, FileText, Lock, X, Save, User, UserCheck, UserX, AlertOctagon, UserCog, UserPlus, Loader2 } from 'lucide-react';
import { BARANGAYS } from '../types';
import { usersAPI, seniorsAPI } from '../services/api';
import { CurrentUser } from '../types';
import ConfirmModal from './ConfirmModal';
import Skeleton from './Skeleton';

// Unified Account Type for Display
interface UnifiedAccount {
  id: string;
  name: string;
  role: string;
  barangay: string;
  status: string;
  email: string;
  type: 'User' | 'Senior';
  originalData: any;
}

interface AccountProps {
    currentUser: CurrentUser;
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const AccountSkeleton = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <Skeleton.Text className="w-64 h-9 mb-1.5" />
           <Skeleton.Text className="w-80 h-3.5" />
        </div>
        {isAdmin && <Skeleton.Button className="w-44 h-11 rounded-2xl" />}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Tab Navigation Skeleton */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex gap-2 bg-slate-50/50">
          {[...Array(4)].map((_, i) => (
             <Skeleton.Rect key={i} className="w-28 h-8 rounded-full" />
          ))}
        </div>
        
        {/* Search Bar Skeleton */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
          <Skeleton.Rect className="w-full max-w-[360px] h-[42px] rounded-xl" />
          <Skeleton.Text className="w-16 h-3 ml-auto hidden sm:block" />
        </div>

        {/* Table Skeleton */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                <th className="px-6 py-4 w-[34%]">Account Identity</th>
                <th className="px-5 py-4 w-[14%] text-center">Access Role</th>
                <th className="px-5 py-4 w-[22%] text-center">Assigned Unit/Area</th>
                <th className="px-5 py-4 w-[14%] text-center">Status</th>
                <th className="px-6 py-4 w-[16%] text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton.Rect className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="w-full max-w-[180px]">
                        <Skeleton.Text className="w-3/4 h-3.5 mb-1" />
                        <Skeleton.Text className="w-1/2 h-2.5" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="flex justify-center"><Skeleton.Rect className="w-16 h-5 rounded-lg" /></div></td>
                  <td className="px-5 py-4"><Skeleton.Text className="w-20 h-3 mx-auto" /></td>
                  <td className="px-5 py-4"><div className="flex justify-center"><Skeleton.Rect className="w-16 h-5 rounded-full" /></div></td>
                  <td className="px-6 py-4"><div className="flex justify-end"><Skeleton.Rect className="w-7 h-7 rounded-lg" /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Skeleton */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
           <Skeleton.Text className="w-32 h-3" />
           <div className="flex items-center gap-1.5">
             <Skeleton.Rect className="w-8 h-8 rounded-lg" />
             <Skeleton.Text className="w-16 h-3" />
             <Skeleton.Rect className="w-8 h-8 rounded-lg" />
           </div>
        </div>
      </div>
    </div>
  );
};

const Account: React.FC<AccountProps> = ({ currentUser, notify }) => {
  const [accounts, setAccounts] = useState<UnifiedAccount[]>([]);
  const isAdmin = currentUser.role === 'Admin';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Admin' | 'Staff' | 'Senior'>('All');
  const [selectedAccount, setSelectedAccount] = useState<UnifiedAccount | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchAccounts = async (background = false) => {
    if (!background) {
      setLoading(true);
    }
    setError(null);
    try {
      const [usersResponse, seniorsResponse] = await Promise.all([
        usersAPI.getAll(),
        seniorsAPI.getAll({ per_page: -1, fresh: true })
      ]);

      const usersData = Array.isArray(usersResponse)
        ? usersResponse
        : (usersResponse?.data || []);
      const seniorsData = Array.isArray(seniorsResponse)
        ? seniorsResponse
        : (seniorsResponse?.data || []);

      const unifiedAccounts: UnifiedAccount[] = [
        ...(Array.isArray(usersData) ? usersData : []).filter(u => u && typeof u === 'object').map((u: any) => ({
          id: `user-${u.id || Math.random()}`,
          name: String(u.name || 'Unknown'),
          role: String(u.role || 'Staff'),
          barangay: String(u.barangay_assignment || u.barangay || 'All'),
          status: String(u.status || 'Active'),
          email: String(u.email || ''),
          type: 'User' as const,
          originalData: u
        })),
        ...(Array.isArray(seniorsData) ? seniorsData : []).filter(s => s && typeof s === 'object').map((s: any) => ({
          id: `senior-${s.osca_id || s.id || Math.random()}`,
          name: String(s.name || `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || 'Unknown'),
          role: 'Senior Citizen',
          barangay: String(s.barangay || 'Unknown'),
          status: (s.status === 'approved' || s.status === 'Active') ? 'Active' : String(s.status || 'Pending'),
          email: String(s.email || `senior-${s.osca_id || s.id}@osca.ph`),
          type: 'Senior' as const,
          originalData: s
        }))
      ];

      setAccounts(unifiedAccounts);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      if (!background) {
        notify("Could not sync with database. Please check your connection.", "error");
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };
  
  // Fetch accounts from API
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  // Confirmation state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    barangay: '',
    status: '',
    password: '',
    confirmPassword: ''
  });

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'Staff',
    barangay: BARANGAYS[0],
    password: '',
    confirmPassword: ''
  });

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = (acc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (acc.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Admin') matchesTab = acc.role === 'Admin';
      if (activeTab === 'Staff') matchesTab = acc.role === 'Staff';
      if (activeTab === 'Senior') matchesTab = acc.type === 'Senior';

      return matchesSearch && matchesTab;
    });
  }, [accounts, searchTerm, activeTab]);

  const displayedAccounts = filteredAccounts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / itemsPerPage));

  const tabCounts = useMemo(() => ({
    All: accounts.length,
    Admin: accounts.filter(a => a.role === 'Admin').length,
    Staff: accounts.filter(a => a.role === 'Staff').length,
    Senior: accounts.filter(a => a.type === 'Senior').length
  }), [accounts]);

  const tabs = [
    { id: 'All', label: 'All Accounts', icon: Users, count: tabCounts.All },
    { id: 'Admin', label: 'Administrators', icon: Shield, count: tabCounts.Admin },
    { id: 'Staff', label: 'Staff', icon: UserCog, count: tabCounts.Staff },
    { id: 'Senior', label: 'Senior Citizens', icon: User, count: tabCounts.Senior },
  ] as const;

  const isDataLoading = loading;

  if (error && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl mb-2">
          <AlertOctagon size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Unable to Load Accounts</h2>
        <div className="text-slate-500 max-w-md font-medium">
          {typeof error === 'string' ? error : 'A system error occurred. Please check your connection or contact support.'}
        </div>
        <div className="flex gap-3 mt-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-systemBlue text-white hover:bg-blue-800 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-md hover:shadow-lg rounded-xl px-6 py-3"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'Admin': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Staff': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Senior Citizen': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleEditClick = (account: UnifiedAccount) => {
    setSelectedAccount(account);
    setEditForm({
      name: account.name,
      email: account.email,
      role: account.role,
      barangay: account.barangay,
      status: account.status,
      password: '',
      confirmPassword: ''
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      notify("Passwords do not match!", "error");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      notify("Passwords do not match!", "error");
      return;
    }
    
    try {
      const response = await usersAPI.create({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role as 'Admin' | 'Staff',
        barangay_assignment: createForm.barangay,
      });

      // Handle backend response format: { user: ... }
      const userData = response.user || response.data || response;
      
      const newAccount: UnifiedAccount = {
        id: `user-${userData.id}`,
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        barangay: createForm.barangay,
        status: 'Active',
        type: 'User',
        originalData: userData
      };

      setAccounts([newAccount, ...accounts]);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        role: 'Staff',
        barangay: BARANGAYS[0],
        password: '',
        confirmPassword: ''
      });
      notify(`New ${createForm.role} account created successfully!`, "success");
    } catch (error: any) {
      console.error(error); notify("Failed to create account on the server.", "error");
    }
  };

  const handleConfirmSave = async () => {
    if (selectedAccount) {
      try {
        const idParts = selectedAccount.id.split('-');
        const realId = idParts[1]; // Get the actual ID

        if (selectedAccount.type === 'User') {
          await usersAPI.update(Number(realId), {
             name: editForm.name,
             email: editForm.email,
             role: editForm.role,
             barangay_assignment: editForm.barangay,
             status: editForm.status,
             ...(editForm.password ? { password: editForm.password } : {})
          });
        } else if (selectedAccount.type === 'Senior') {
          await seniorsAPI.update(realId, {
            status: editForm.status,
            ...(editForm.password ? { password: editForm.password } : {})
          });
        }
        
        // Update local state only after successful API call
        setAccounts(prev => prev.map(acc => 
          acc.id === selectedAccount.id ? { 
            ...acc, 
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
            barangay: editForm.barangay,
            status: editForm.status 
          } : acc
        ));
        
        notify('Account updated successfully!', 'success');
      } catch (error) {
        notify("Failed to update account. Please try again.", "error");
      }
    }
    setIsConfirmOpen(false);
    setSelectedAccount(null);
  };

  return (
    <TransitionWrapper isLoading={isDataLoading} skeleton={<AccountSkeleton isAdmin={isAdmin} />}>
      {!isDataLoading && (
        <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Accounts Management</h2>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1.5 bg-white/50 w-fit px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm uppercase">System Users • {accounts.length} accounts</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0F172A] hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create New Staff
          </button>
        )}
      </div>

      {/* ... Rest of the component (Tables, Modals) is largely identical structure, just wrapped in the same render ... */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Filters + Search — single compact bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-nowrap overflow-x-auto gap-2 no-scrollbar shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border shrink-0 ${
                    isActive 
                      ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon size={13} strokeWidth={2.5} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative group w-full lg:w-[300px] lg:ml-auto shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0F172A] transition-colors pointer-events-none">
              <Search size={14} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder="Search name, ID, email…"
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-full text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-3 focus:ring-slate-100 transition-all font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
            {searchTerm ? (
              <button onClick={() => { setSearchTerm(''); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <span className="text-[11px] leading-none">✕</span>
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline text-[10px] font-medium text-slate-400 pointer-events-none">{filteredAccounts.length}</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[34%]">Account Identity</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[14%] text-center">Access Role</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[22%] text-center">Assigned Unit/Area</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[14%] text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] w-[16%] text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayedAccounts.length > 0 ? displayedAccounts.map(acc => (
                <tr key={acc.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 flex items-center justify-center font-extrabold text-[10px] border border-slate-200 shadow-sm shrink-0 overflow-hidden">
                          {acc.type === 'Senior' && acc.originalData.idPhoto ? (
                             <img src={acc.originalData.idPhoto} alt={acc.name} className="w-full h-full object-cover" />
                          ) : (
                             (acc.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${acc.status === 'Active' ? 'bg-emerald-500' : acc.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate group-hover:text-[#0F172A] transition-colors">{acc.name || 'Unknown'}</p>
                        <p className="text-[11px] font-medium text-slate-400 tracking-wide truncate">{acc.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg border whitespace-nowrap ${getRoleBadgeColor(acc.role)}`}>
                        {acc.role === 'Admin' && <Shield size={11} strokeWidth={2.5} />}
                        {acc.role === 'Senior Citizen' ? 'Senior' : acc.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-[12px] font-medium text-slate-600 truncate">{acc.barangay}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                          acc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          acc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                          acc.status === 'Deceased' ? 'bg-slate-900 text-white border-slate-900' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${acc.status === 'Active' ? 'bg-emerald-500' : acc.status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                        {acc.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      {isAdmin ? (
                        <button 
                          onClick={() => handleEditClick(acc)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-[#0F172A] hover:text-white text-slate-400 hover:shadow-md hover:shadow-slate-900/10 flex items-center justify-center transition-all border border-slate-100 hover:border-[#0F172A] active:scale-95"
                          title="Manage Access"
                        >
                          <Lock size={13} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">View Only</span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                        <Users size={20} className="text-slate-300" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-600">No accounts found.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Try adjusting search or tab filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
          {/* Pagination — matches MemberRegistry */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
           <p className="text-[12px] font-medium text-slate-400">
             Showing <span className="font-bold text-slate-600">{displayedAccounts.length}</span> of <span className="font-bold text-slate-600">{filteredAccounts.length}</span> results
           </p>
           <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="text-[12px] font-semibold text-slate-500 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
           </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      {selectedAccount && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {selectedAccount.type === 'Senior' && selectedAccount.originalData.idPhoto ? (
                    <img src={selectedAccount.originalData.idPhoto} alt="" className="w-full h-full object-cover" />
                  ) : selectedAccount.type === 'User' ? (
                    <UserCog size={24} /> 
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Manage Account</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedAccount.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                    value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} readOnly={selectedAccount.type === 'Senior'} />
                  {selectedAccount.type === 'Senior' && <p className="text-xs text-slate-400 italic">To edit Senior name, go to Registry.</p>}
                </div>
                {/* ... Role/Barangay Inputs ... */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                    {selectedAccount.type === 'User' ? (
                      <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} >
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                      </select>
                    ) : (
                      <input type="text" value="Senior Citizen" readOnly className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-500 cursor-not-allowed"/>
                    )}
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment / Unit</label>
                     {selectedAccount.type === 'User' ? (
                       <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={editForm.barangay} onChange={(e) => setEditForm({...editForm, barangay: e.target.value})}>
                        <option value="Municipal Hall">Municipal Hall</option>
                        {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                     ) : (
                        <input type="text" value={editForm.barangay} readOnly className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-500 cursor-not-allowed"/>
                     )}
                  </div>
                </div>
                 {/* ... Status Input ... */}
                 <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    {selectedAccount.type === 'Senior' && (<><option value="Pending">Pending Approval</option><option value="Deceased">Deceased</option></>)}
                  </select>
                </div>
                 {/* ... Password Reset ... */}
                 <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-800 mb-4">Reset Password</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                      <input type="password" placeholder="Set new password..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</label>
                      <input type="password" placeholder="Confirm new password..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={editForm.confirmPassword} onChange={(e) => setEditForm({...editForm, confirmPassword: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setSelectedAccount(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-systemBlue text-white font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> 
                  <span className="hidden sm:inline">Update Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Create Account Modal */}
      {isCreateOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl"><UserPlus size={24} /></div>
                <div><h3 className="text-lg font-black text-slate-900">Create Staff Account</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add new system user</p></div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              <div className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label><input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label><input type="email" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label><select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={createForm.role} onChange={(e) => setCreateForm({...createForm, role: e.target.value})}><option value="Admin">Admin</option><option value="Staff">Staff</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment / Unit</label><select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={createForm.barangay} onChange={(e) => setCreateForm({...createForm, barangay: e.target.value})}><option value="Municipal Hall">Municipal Hall</option>{BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                </div>
                <div className="pt-4 border-t border-slate-100"><p className="text-sm font-bold text-slate-800 mb-4">Set Password</p><div className="space-y-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label><input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</label><input type="password" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={createForm.confirmPassword} onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})} /></div></div></div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-systemBlue text-white font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> 
                  <span className="hidden sm:inline">Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Account Settings Confirmation */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Update Account Settings?"
        message="Are you sure you want to save these changes to the account? This will update access permissions and status immediately."
        variant="primary"
        confirmLabel="Save Changes"
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
      )}
    </TransitionWrapper>
  );
};

export default Account;

