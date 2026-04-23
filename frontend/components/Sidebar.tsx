
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  UserCircle, 
  History, 
  DatabaseBackup,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  FileCheck,
  Home,
  FileText,
  Edit,
  Printer
} from 'lucide-react';
import { ViewType, CurrentUser } from '../types';
import { seniorsAPI } from '../services/api';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  currentUser: CurrentUser;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, toggleSidebar, currentUser }) => {
  const [seniorStatus, setSeniorStatus] = useState<string>('Pending');

  // Fetch senior status if role is Senior
  useEffect(() => {
    if (currentUser && currentUser.role === 'Senior') {
      const fetchStatus = async () => {
        try {
          const data = await seniorsAPI.getById(currentUser.id as any);
          setSeniorStatus(data.status || 'Pending');
        } catch (error: any) {
          // If 401, AuthProvider will handle global redirect
          if (error.status !== 401) {
             console.error('Failed to fetch senior status', error);
          }
        }
      };
      fetchStatus();
    }
  }, [currentUser]);
  
  // Standard OSCA Items
  const oscaNavItems = [
    // Admin / Staff Items
    { id: ViewType.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff'] },
    { id: ViewType.APPROVAL, label: 'For Approvals', icon: FileCheck, roles: ['Admin', 'Staff'] },
    { id: ViewType.ADD_MEMBER, label: 'Registration', icon: UserPlus, roles: ['Admin', 'Staff'] },
    { id: ViewType.MEMBER_REGISTRY, label: 'Members', icon: Users, roles: ['Admin', 'Staff'] },
    { id: ViewType.BATCH_PRINT, label: 'Batch Print', icon: Printer, roles: ['Admin', 'Staff'] },
    { id: ViewType.FINAL_REPORT, label: 'Reports', icon: FileSpreadsheet, roles: ['Admin', 'Staff'] },
    { id: ViewType.ACCOUNT, label: 'Accounts', icon: UserCircle, roles: ['Admin', 'Staff'] }, 
    { id: ViewType.HISTORY, label: 'System Logs', icon: History, roles: ['Admin'] },
    { id: ViewType.BACKUP, label: 'Backup', icon: DatabaseBackup, roles: ['Admin'] },

    // Senior User Items
    { id: ViewType.USER_DASHBOARD, label: 'Home', icon: Home, roles: ['Senior'] },
    { id: ViewType.USER_REVIEW, label: 'My Record', icon: FileText, roles: ['Senior'], requiresApproval: true },
    { id: ViewType.ADD_MEMBER, label: 'Update Info', icon: Edit, roles: ['Senior'] },
  ];

  // Filter based on role and approval status
  const navItems = oscaNavItems.filter(item => {
    if (!item.roles.includes(currentUser.role)) return false;
    // Hide "My Record" for pending seniors
    if (item.requiresApproval && currentUser.role === 'Senior' && seniorStatus !== 'Active') {
      return false;
    }
    return true;
  });

  return (
    <aside 
      className={`
        no-print fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-ios border-r border-slate-200/50 flex flex-col transition-all duration-300 shadow-xl md:shadow-none
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 md:translate-x-0 md:w-24'}
        md:static md:h-full
      `}
    >
      <div className={`p-8 flex items-center ${isOpen ? 'justify-start px-8' : 'justify-center px-0'} min-h-[140px]`}>
        {isOpen ? (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-systemBlue/20 to-transparent rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-2.5 shadow-ios transition-transform group-hover:scale-105 active:scale-95">
                 <img 
                   src="img/osca_logo.png" 
                   alt="OSCA Logo" 
                   className="w-full h-full object-contain"
                 />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 leading-none">OSCA</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                {currentUser.role === 'Senior' ? 'PORTAL' : 'MANAGEMENT'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-2 shadow-ios">
             <img 
               src="img/osca_logo.png" 
               alt="OSCA Logo" 
               className="w-full h-full object-contain"
             />
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center transition-all duration-200 group relative
                ${isOpen ? 'gap-4 px-4 py-3' : 'justify-center py-3.5 px-0'} 
                ${isActive 
                  ? 'bg-systemBlue text-white font-bold shadow-lg shadow-systemBlue/20 rounded-2xl' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-2xl'
                }`}
              title={!isOpen ? item.label : ''}
            >
              <div className={!isOpen ? 'w-full flex justify-center' : 'shrink-0'}>
                <Icon 
                   size={isActive ? 22 : 20} 
                  className={`transition-all ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} 
                />
              </div>
              <span className={`text-[13px] font-bold whitespace-nowrap transition-all duration-300 origin-left
                ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute pointer-events-none'}`}>
                {item.label}
              </span>
              
              {isActive && !isOpen && (
                <div className="absolute right-0 w-1 h-6 bg-systemBlue rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-4">
        {isOpen && (
          <div className="bg-white/5 p-3 rounded-ios border border-white/5 hidden md:block">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-slate-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SECURE SYSTEM</span>
            </div>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-ios hover:bg-white/70 text-slate-500 transition-colors hidden md:flex"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
