
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Menu, LogOut, Settings, ChevronDown, Lock, X, Save } from 'lucide-react';
import { CurrentUser } from '../types';

interface HeaderProps {
  viewTitle: string;
  toggleSidebar: () => void;
  currentUser: CurrentUser;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewTitle, toggleSidebar, currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dateTime, setDateTime] = useState(new Date());

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="bg-white border-b border-slate-100 h-16 md:h-24 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={toggleSidebar} className="p-2 md:p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-blue-900 active:bg-blue-50">
          <Menu size={24} />
        </button>
        <div className="h-6 md:h-10 w-[1px] bg-slate-100"></div>
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter truncate max-w-[200px] md:max-w-none">
            {viewTitle.replace(/_/g, ' ')}
          </h1>
          <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">OSCA Management Suite</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-10">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Real-time Date & Time */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="text-xs font-black text-slate-800 tracking-tight leading-none">
              {dateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-[11px] font-bold text-slate-400 tabular-nums mt-0.5">
              {dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          
          <div className="h-8 md:h-12 w-[1px] bg-slate-100 mx-0 md:mx-2"></div>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 md:gap-4 cursor-pointer p-1 md:p-1.5 rounded-2xl hover:bg-slate-50 transition-all text-left"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-black text-slate-900 leading-none">{currentUser.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                   <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                     currentUser.role === 'Admin' ? 'bg-blue-100 text-blue-900' :
                     currentUser.role === 'Staff' ? 'bg-purple-100 text-purple-900' :
                     'bg-emerald-100 text-emerald-900'
                   }`}>
                     {currentUser.role}
                   </span>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.barangay}</p>
                </div>
              </div>
              <div className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-blue-900 flex items-center justify-center text-white shadow-xl shadow-blue-100 transition-transform overflow-hidden">
                {currentUser.idPhoto ? (
                  <img src={currentUser.idPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="md:w-6 md:h-6" />
                )}
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform hidden md:block ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-4 border-b border-slate-50 lg:hidden bg-slate-50">
                   <p className="font-bold text-slate-900">{currentUser.name}</p>
                   <p className="text-xs text-slate-500">{currentUser.email || 'No email'}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Settings size={18} /> Account Settings
                  </button>
                  <button 
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Account Settings</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage your profile</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSettingsSave}>
              <div className="p-8 space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">User Information</p>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] font-bold text-slate-400">Name</label>
                       <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400">Role</label>
                       <p className="text-sm font-bold text-slate-800">{currentUser.role}</p>
                     </div>
                     <div className="col-span-2">
                       <label className="text-[10px] font-bold text-slate-400">Email</label>
                       <p className="text-sm font-bold text-slate-800">{currentUser.email || 'N/A'}</p>
                     </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Lock size={16} /> Change Password
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </header>
  );
};

export default Header;
