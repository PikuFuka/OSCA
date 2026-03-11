
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
  Edit
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
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl md:shadow-none
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 md:translate-x-0 md:w-24'}
        md:static md:h-full
      `}
    >
      <div className={`p-6 flex items-center ${isOpen ? 'justify-center' : 'justify-center'} min-h-[140px]`}>
        {isOpen ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 bg-white rounded-full border border-slate-200 flex items-center justify-center p-1 overflow-hidden shadow-sm shrink-0">
                 <img 
                   src="img/osca_logo.png" 
                   alt="OSCA Logo" 
                   className="w-full h-full object-contain rounded-full"
                 />
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-black text-xl tracking-tighter text-slate-900 whitespace-nowrap leading-none">OSCA SYSTEM</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {currentUser.role === 'Senior' ? 'MEMBER PORTAL' : 'MANAGEMENT PANEL'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden shadow-sm">
             <img 
               src="img/osca_logo.png" 
               alt="OSCA Logo" 
               className="w-full h-full object-contain rounded-full"
             />
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center transition-all duration-200 group relative
                ${isOpen ? 'gap-3 px-4 py-3' : 'justify-center py-3 px-0'} 
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100 rounded-xl' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl'
                }`}
              title={!isOpen ? item.label : ''}
            >
              <div className={!isOpen ? 'w-full flex justify-center' : 'shrink-0'}>
                <Icon 
                  size={22} 
                  className={`transition-all ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                />
              </div>
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 origin-left
                ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0 overflow-hidden absolute'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4">
        {isOpen && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 hidden md:block">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SECURE SYSTEM</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Protected Personal Data</p>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors hidden md:flex"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
