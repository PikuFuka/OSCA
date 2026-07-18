
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Menu, LogOut, Settings, ChevronDown, Lock, X, Save,
  Search, Bell, MessageSquare, Plus, FileCheck, FileSpreadsheet,
  Printer, DatabaseBackup, CloudSun, UserCircle, Activity,
  UserPlus, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { CurrentUser } from '../types';
import { requestsAPI, activityLogsAPI, seniorsAPI } from '../services/api';

interface NotificationItem {
  id: string;
  type: 'approval' | 'registration' | 'alert' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface HeaderProps {
  viewTitle: string;
  toggleSidebar: () => void;
  currentUser: CurrentUser;
  onLogout: () => void;
}

const getHeaderContent = (viewTitle: string) => {
  const normalized = viewTitle.replace(/_/g, ' ');
  const map: Record<string, { title: string, subtitle: string }> = {
    'DASHBOARD': { title: 'Dashboard', subtitle: 'Manage senior citizen registrations, approvals, reports, and member records.' },
    'ADD MEMBER': { title: 'Registration', subtitle: 'Register a new senior citizen into the system.' },
    'MEMBER REGISTRY': { title: 'Members', subtitle: 'View and manage all senior citizen records.' },
    'APPROVAL': { title: 'For Approvals', subtitle: 'Review and approve pending registrations.' },
    'BATCH PRINT': { title: 'Batch Print', subtitle: 'Print multiple ID cards and documents simultaneously.' },
    'FINAL REPORT': { title: 'Reports', subtitle: 'Generate and export system reports.' },
    'ACCOUNT': { title: 'Accounts', subtitle: 'Manage system users and access controls.' },
    'HISTORY': { title: 'System Logs', subtitle: 'Monitor system activities and audit trails.' },
    'BACKUP': { title: 'Backup', subtitle: 'Manage database backups and system restoration.' },
    'USER DASHBOARD': { title: 'Home', subtitle: 'Welcome to your senior citizen portal.' },
    'USER REVIEW': { title: 'My Record', subtitle: 'View your personal senior citizen record.' },
  };
  return map[normalized] || { title: normalized, subtitle: 'View and manage system information.' };
};

const Header: React.FC<HeaderProps> = ({ viewTitle, toggleSidebar, currentUser, onLogout }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [dateTime, setDateTime] = useState(new Date());

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Search Debounce Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await seniorsAPI.getAll({ search: searchQuery });
          const items = res.data || res || [];
          setSearchResults(items.slice(0, 4));
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch real notifications data
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const newNotifications: NotificationItem[] = [];
        
        // Only fetch if admin or staff
        if (currentUser?.role === 'Admin' || currentUser?.role === 'Staff') {
           // Fetch pending requests
           try {
             const pendingData = await requestsAPI.getPending(1, 1);
             const totalPending = pendingData.total || pendingData.data?.length || 0;
             if (totalPending > 0) {
                newNotifications.push({
                  id: 'pending-reqs',
                  type: 'approval',
                  title: `${totalPending} Pending Approvals`,
                  message: 'New senior citizen registrations require your review.',
                  time: 'Just now',
                  isRead: false
                });
             }
           } catch (e) {
             console.error("Failed to fetch pending requests", e);
           }

           // Fetch recent activity
           try {
             const logsData = await activityLogsAPI.getAll({ per_page: 3 });
             const logs = logsData.data || [];
             logs.forEach((log: any, index: number) => {
                newNotifications.push({
                  id: `log-${log.id || index}`,
                  type: (log.action === 'CREATE' || log.action === 'REGISTER') ? 'registration' : 'system',
                  title: log.action === 'CREATE' ? 'New Record Added' : 'System Activity',
                  message: log.description || `Performed ${log.action} action.`,
                  time: new Date(log.created_at || Date.now()).toLocaleDateString(),
                  isRead: true
                });
             });
           } catch (e) {
             console.error("Failed to fetch activity logs", e);
           }
        }
        
        // If empty, put a default empty state or keep it empty
        setNotifications(newNotifications);
      } catch (error) {
        console.error('Failed to aggregate notifications', error);
      }
    };
    
    fetchNotifications();
    
    // Optional polling every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const { title, subtitle } = getHeaderContent(viewTitle);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Close menu and search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    // Simulate API call
    setTimeout(() => {
      alert("Account settings updated successfully.");
      setIsSettingsOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 500);
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 h-[88px] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-all no-print">
      
      {/* Left Section: Context */}
      <div className="flex items-center gap-5 shrink-0">
        <button onClick={toggleSidebar} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-900 md:hidden">
          <Menu size={22} />
        </button>
        
        <div className="hidden md:flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 tracking-wide mb-1">
             <span className="hover:text-slate-600 cursor-pointer transition-colors">Home</span>
             <span>/</span>
             <span className="text-systemBlue">{title}</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-none">
            {title}
          </h1>
        </div>
      </div>

      {/* Center Section: Search */}
      <div className="flex-1 max-w-2xl px-6 lg:px-12 hidden lg:flex" ref={searchRef}>
        <div className="relative w-full">
          <div className={`flex items-center w-full bg-slate-50 border transition-all duration-200 rounded-2xl overflow-hidden shadow-sm group ${isSearchFocused ? 'border-systemBlue/50 ring-4 ring-systemBlue/5 bg-white' : 'border-slate-200/80 hover:border-slate-300'}`}>
            <div className={`pl-4 pr-3 transition-colors ${isSearchFocused ? 'text-systemBlue' : 'text-slate-400 group-hover:text-slate-500'}`}>
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Senior Citizen, OSCA ID, Action..." 
              className="w-full bg-transparent border-none outline-none py-2.5 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
              onFocus={() => setIsSearchFocused(true)}
            />
            <div className="pr-4 flex gap-1">
               <kbd className="hidden xl:inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Ctrl</kbd>
               <kbd className="hidden xl:inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.05)]">K</kbd>
            </div>
          </div>
          
          {/* Search Dropdown / Palette */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-[18px] shadow-xl shadow-slate-200/50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden flex flex-col max-h-[400px]">
              
              {searchQuery.length === 0 ? (
                <div className="px-4 py-4 flex flex-col items-center justify-center gap-2 text-slate-400 opacity-80">
                   <Search size={24} strokeWidth={2} />
                   <p className="text-[12px] font-medium">Type anything to search the system...</p>
                </div>
              ) : (
                <div className="overflow-y-auto no-scrollbar flex flex-col">
                  
                  {/* Senior Citizens Result */}
                  {(searchResults.length > 0 || isSearching) && (
                    <div className="flex flex-col pb-1">
                      <span className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 border-y border-slate-100/50 sticky top-0 z-10 backdrop-blur-md">Senior Citizens</span>
                      {isSearching ? (
                        <div className="px-4 py-3 text-[12px] text-slate-500 font-medium">Searching records...</div>
                      ) : (
                        searchResults.map(senior => (
                          <button key={senior.id} className="flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors group">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-systemBlue/10 group-hover:text-systemBlue transition-colors shrink-0">
                               <User size={14} />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[13px] font-semibold text-slate-800">{senior.first_name} {senior.last_name}</span>
                               <span className="text-[11px] font-medium text-slate-500">{senior.osca_id || 'Pending ID'} • Brgy. {senior.barangay}</span>
                             </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Quick Actions Result */}
                  <div className="flex flex-col pb-1">
                    <span className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 border-y border-slate-100/50 sticky top-0 z-10 backdrop-blur-md">Quick Actions</span>
                    <button className="flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors group">
                       <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                         <UserPlus size={14} />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[13px] font-semibold text-slate-800 group-hover:text-systemBlue transition-colors">Register New Senior</span>
                         <span className="text-[11px] font-medium text-slate-500">Go to registration form</span>
                       </div>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors group">
                       <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                         <FileSpreadsheet size={14} />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[13px] font-semibold text-slate-800 group-hover:text-systemBlue transition-colors">Generate Reports</span>
                         <span className="text-[11px] font-medium text-slate-500">Export active members to CSV/Excel</span>
                       </div>
                    </button>
                  </div>
                  
                  {/* Views/Pages */}
                  <div className="flex flex-col pb-1">
                    <span className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 border-y border-slate-100/50 sticky top-0 z-10 backdrop-blur-md">Pages</span>
                    <button className="flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors group">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                         <Settings size={14} className="text-slate-500" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[13px] font-semibold text-slate-800 group-hover:text-systemBlue transition-colors">System Settings</span>
                         <span className="text-[11px] font-medium text-slate-500">Navigate to Preferences</span>
                       </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Utilities & Profile */}
      <div className="flex items-center gap-4 shrink-0" ref={menuRef}>
        
        {/* Date & Time */}
        <div className="hidden xl:flex items-center gap-4 pr-5 border-r border-slate-200">
           <div className="flex flex-col items-end justify-center h-full">
              <p className="text-[13px] font-bold text-slate-800 tracking-tight leading-none mb-1">
                {dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {dateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
           </div>
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-1.5">
          {/* Quick Actions */}
          <div className="relative">
            <button onClick={() => toggleDropdown('quick')} className={`p-2.5 rounded-xl transition-all duration-200 ${openDropdown === 'quick' ? 'bg-systemBlue/10 text-systemBlue shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Plus size={20} strokeWidth={2.5} />
            </button>
            {openDropdown === 'quick' && (
               <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200/80 rounded-[16px] shadow-xl shadow-slate-200/40 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Actions</span>
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <UserPlus size={16} /> Register Senior
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <FileCheck size={16} /> Approve Applications
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <FileSpreadsheet size={16} /> Generate Report
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <Printer size={16} /> Print Batch IDs
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <DatabaseBackup size={16} /> Backup Database
                  </button>
               </div>
            )}
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => toggleDropdown('notifications')} className={`relative p-2.5 rounded-xl transition-all duration-200 ${openDropdown === 'notifications' ? 'bg-systemBlue/10 text-systemBlue shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Bell size={20} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {openDropdown === 'notifications' && (
               <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-slate-200/80 rounded-[18px] shadow-xl shadow-slate-200/40 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between mb-1">
                    <span className="text-[13px] font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span onClick={markAllAsRead} className="text-[11px] font-semibold text-systemBlue cursor-pointer hover:underline">Mark all read</span>
                    )}
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar flex flex-col">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">No notifications</div>
                    ) : (
                      notifications.map(notification => (
                        <button 
                          key={notification.id} 
                          onClick={() => markAsRead(notification.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors relative ${notification.isRead ? 'opacity-70 hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'}`}
                        >
                           {!notification.isRead && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-systemBlue rounded-r-full"></div>}
                           
                           <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                             notification.type === 'approval' ? 'bg-systemBlue/10 text-systemBlue' :
                             notification.type === 'registration' ? 'bg-emerald-500/10 text-emerald-600' :
                             notification.type === 'alert' ? 'bg-amber-500/10 text-amber-600' :
                             'bg-slate-100 text-slate-500'
                           }`}>
                             {notification.type === 'approval' && <FileCheck size={14} />}
                             {notification.type === 'registration' && <UserPlus size={14} />}
                             {notification.type === 'alert' && <ShieldAlert size={14} />}
                             {notification.type === 'system' && <CheckCircle2 size={14} />}
                           </div>
                           
                           <div className="flex flex-col">
                             <span className={`text-[13px] text-slate-800 ${notification.isRead ? 'font-medium' : 'font-semibold'}`}>{notification.title}</span>
                             <span className="text-[11px] font-medium text-slate-500 mt-0.5">{notification.message}</span>
                             <span className={`text-[10px] mt-1 ${notification.isRead ? 'text-slate-400 font-medium' : 'text-systemBlue font-bold'}`}>{notification.time}</span>
                           </div>
                        </button>
                      ))
                    )}
                  </div>
                  
                  <div className="px-4 py-2 border-t border-slate-100 mt-1">
                    <button className="w-full text-center text-[12px] font-bold text-slate-500 hover:text-slate-700 transition-colors">View all notifications</button>
                  </div>
               </div>
            )}
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

        {/* Admin Profile */}
        <div className="relative">
            <button onClick={() => toggleDropdown('profile')} className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 rounded-[16px] hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all text-left group">
                <div className="h-10 w-10 bg-slate-100 border border-slate-200/60 rounded-[12px] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                   {currentUser.idPhoto ? (
                     <img src={currentUser.idPhoto} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <User size={18} className="text-slate-600" />
                   )}
                   <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="hidden md:flex flex-col">
                   <span className="text-[13px] font-bold text-slate-900 leading-none mb-1.5">{currentUser.name}</span>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-systemBlue bg-systemBlue/10 px-1.5 py-0.5 rounded-md leading-none">
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">{currentUser.barangay}</span>
                   </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ml-1 hidden lg:block ${openDropdown === 'profile' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'profile' && (
               <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200/80 rounded-[18px] shadow-xl shadow-slate-200/40 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1 lg:hidden">
                    <span className="text-[13px] font-bold text-slate-900 leading-none block mb-1">{currentUser.name}</span>
                    <span className="text-[11px] font-medium text-slate-500">{currentUser.email || 'Administrator'}</span>
                  </div>
                  
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <UserCircle size={16} /> Profile
                  </button>
                  <button 
                    onClick={() => { setIsSettingsOpen(true); setOpenDropdown(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors"
                  >
                     <Settings size={16} /> Preferences
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-systemBlue transition-colors">
                     <Activity size={16} /> Activity Logs
                  </button>
                  
                  <div className="my-1 border-t border-slate-100"></div>
                  
                  <button 
                    onClick={() => { onLogout(); setOpenDropdown(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                     <LogOut size={16} /> Logout
                  </button>
               </div>
            )}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[24px] w-full max-w-lg p-6 md:p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 shadow-2xl">
             {/* Modal Header */}
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-systemBlue/10 rounded-2xl flex items-center justify-center">
                      <Settings size={24} className="text-systemBlue" strokeWidth={2.5} />
                   </div>
                   <div>
                       <h2 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none mb-1">Preferences</h2>
                       <p className="text-[13px] font-medium text-slate-500">Manage your system settings</p>
                   </div>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                   <X size={20} strokeWidth={2.5} />
                </button>
             </div>

             <div className="space-y-8">
                {/* Information Section */}
                <div className="space-y-3">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Professional Identity</h3>
                   <div className="bg-slate-50/50 rounded-[16px] p-5 border border-slate-200/60 space-y-3.5">
                      <div className="flex justify-between items-center">
                       <span className="text-[13px] font-medium text-slate-500">Legal Name</span>
                       <span className="text-[13px] font-bold text-slate-900">{currentUser.name}</span>
                      </div>
                     <div className="h-[1px] bg-slate-200/60"></div>
                      <div className="flex justify-between items-center">
                       <span className="text-[13px] font-medium text-slate-500">System Identifier</span>
                       <span className="text-[13px] font-bold text-slate-900 lowercase">{currentUser.email}</span>
                      </div>
                     <div className="h-[1px] bg-slate-200/60"></div>
                      <div className="flex justify-between items-center">
                       <span className="text-[13px] font-medium text-slate-500">Authorization Tier</span>
                       <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-700 uppercase tracking-wider">{currentUser.role}</span>
                      </div>
                   </div>
                </div>

                {/* Security Section (Change Password) */}
                <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Security Update</h3>
                      <form onSubmit={handleSettingsSave} className="bg-slate-50/50 rounded-[16px] p-5 border border-slate-200/60 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-systemBlue/20 focus:border-systemBlue transition-all shadow-sm"
                          placeholder="Required to authorize changes"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">New Password</label>
                            <input
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-systemBlue/20 focus:border-systemBlue transition-all shadow-sm"
                              placeholder="Security minimum 8"
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">Confirm New</label>
                            <input
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-systemBlue/20 focus:border-systemBlue transition-all shadow-sm"
                              placeholder="Match new password"
                            />
                         </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 mt-2 flex items-center justify-center gap-2 bg-systemBlue hover:bg-blue-600 text-white text-[13px] font-bold rounded-xl transition-colors shadow-[0_2px_10px_rgba(0,122,255,0.2)]"
                      >
                         <Save size={16} strokeWidth={2.5} />
                         Commit Security Changes
                      </button>
                   </form>
                </div>
             </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </header>
  );
};

export default Header;
