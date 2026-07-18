
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
  Printer,
  CircleDot
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
    { id: ViewType.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff'], group: 'OVERVIEW' },
    { id: ViewType.APPROVAL, label: 'For Approvals', icon: FileCheck, roles: ['Admin', 'Staff'], group: 'OPERATIONS' },
    { id: ViewType.ADD_MEMBER, label: 'Registration', icon: UserPlus, roles: ['Admin', 'Staff'], group: 'OPERATIONS' },
    { id: ViewType.MEMBER_REGISTRY, label: 'Members', icon: Users, roles: ['Admin', 'Staff'], group: 'OPERATIONS' },
    { id: ViewType.BATCH_PRINT, label: 'Batch Print', icon: Printer, roles: ['Admin', 'Staff'], group: 'DOCUMENTS' },
    { id: ViewType.FINAL_REPORT, label: 'Reports', icon: FileSpreadsheet, roles: ['Admin', 'Staff'], group: 'DOCUMENTS' },
    { id: ViewType.ACCOUNT, label: 'Accounts', icon: UserCircle, roles: ['Admin', 'Staff'], group: 'SYSTEM' }, 
    { id: ViewType.HISTORY, label: 'System Logs', icon: History, roles: ['Admin'], group: 'SYSTEM' },
    { id: ViewType.BACKUP, label: 'Backup', icon: DatabaseBackup, roles: ['Admin'], group: 'SYSTEM' },

    // Senior User Items
    { id: ViewType.USER_DASHBOARD, label: 'Home', icon: Home, roles: ['Senior'], group: 'PORTAL' },
    { id: ViewType.USER_REVIEW, label: 'My Record', icon: FileText, roles: ['Senior'], requiresApproval: true, group: 'PORTAL' },
    { id: ViewType.ADD_MEMBER, label: 'Update Info', icon: Edit, roles: ['Senior'], group: 'PORTAL' },
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

  // Group items logically
  const groupedNavItems = navItems.reduce((acc, item) => {
    const group = item.group || 'OTHER';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <aside 
      className={`
        no-print fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl md:shadow-none
        ${isOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[280px] md:translate-x-0 md:w-[84px]'}
        md:static md:h-full
      `}
    >
      <div className={`p-6 flex items-center ${isOpen ? 'justify-start' : 'justify-center px-0'} min-h-[110px] border-b border-slate-100`}>
        {isOpen ? (
          <div className="flex items-center gap-3 w-full">
            <div className="relative shrink-0 w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
               <img 
                 src="img/osca_logo.png" 
                 alt="OSCA Logo" 
                 className="w-full h-full object-contain"
               />
               <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Online"></div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-[15px] text-slate-900 truncate leading-tight tracking-tight">OSCA Management</span>
              <span className="text-[11px] text-slate-500 truncate leading-tight mt-0.5 font-medium">Office for Senior Citizens Affairs</span>
              <span className="text-[11px] text-slate-400 truncate leading-tight">Municipality of Pagsanjan</span>
            </div>
          </div>
        ) : (
          <div className="relative w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
             <img 
               src="img/osca_logo.png" 
               alt="OSCA Logo" 
               className="w-full h-full object-contain"
             />
             <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar flex flex-col gap-6">
        {Object.entries(groupedNavItems).map(([group, items]) => (
          <div key={group} className="flex flex-col gap-1.5">
            {isOpen && (
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {group}
              </span>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center transition-all duration-200 group relative
                    ${isOpen ? 'gap-3.5 px-3 py-2.5' : 'justify-center py-3 px-0'} 
                    ${isActive 
                      ? 'bg-slate-50 text-slate-900 rounded-lg shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-transparent'
                    }`}
                  title={!isOpen ? item.label : ''}
                >
                  <div className={!isOpen ? 'w-full flex justify-center' : 'shrink-0'}>
                    <Icon 
                      size={20} 
                      className={`transition-all duration-200 ${isActive ? 'text-systemBlue' : 'text-slate-400 group-hover:text-slate-600'}`} 
                      strokeWidth={isActive ? 2.5 : 2}
                      fill={isActive ? 'currentColor' : 'none'}
                      fillOpacity={isActive ? 0.1 : 0}
                    />
                  </div>
                  <span className={`text-[13px] font-medium whitespace-nowrap transition-all duration-200 origin-left
                    ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute pointer-events-none'}`}>
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] bg-systemBlue rounded-r-full ${isOpen ? 'h-5' : 'h-6'}`} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col">
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors hidden md:flex"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
