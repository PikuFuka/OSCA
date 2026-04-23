
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
    <header className="bg-systemGray-50/80 backdrop-blur-ios border-b border-slate-200/80 h-16 md:h-20 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40 transition-all no-print">
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={toggleSidebar} className="p-2 md:p-3 hover:bg-white/70 rounded-ios transition-all text-slate-500 hover:text-slate-900 active:bg-white/90">
          <Menu size={22} />
        </button>
        <div className="h-6 md:h-8 w-[1px] bg-slate-200"></div>
        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate max-w-[200px] md:max-w-none">
            {viewTitle.replace(/_/g, ' ')}
          </h1>
          <p className="hidden md:block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">OSCA Pagsanjan</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Real-time Date & Time */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="text-xs font-bold text-slate-700 tracking-tight leading-none">
              {dateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 tabular-nums mt-1.5">
              {dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="h-8 md:h-10 w-[1px] bg-slate-200 mx-0 md:mx-2"></div>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 md:gap-4 cursor-pointer p-1.5 rounded-ios hover:bg-white/70 transition-all text-left"
            >
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                   <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                     currentUser.role === 'Admin' ? 'bg-systemBlue text-white' :
                     currentUser.role === 'Staff' ? 'bg-slate-300 text-slate-800' :
                     'bg-slate-100 text-slate-600'
                   }`}>
                     {currentUser.role}
                   </span>
                   <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">{currentUser.barangay}</p>
                </div>
              </div>
              <div className="h-9 w-9 md:h-11 md:w-11 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center p-0.5 relative shadow-sm hover:scale-105 transition-transform duration-300 overflow-hidden">
                {currentUser.idPhoto ? (
                  <img src={currentUser.idPhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User size={20} className="text-slate-700" />
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-systemGray-50 rounded-full shadow-sm"></div>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform hidden md:block ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-ios shadow-ios-lg py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                <div className="p-4 border-b border-slate-200 lg:hidden bg-slate-50/80">
                   <p className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</p>
                   <p className="text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-tight">{currentUser.email || 'No email'}</p>
                </div>
                <div className="px-2 pt-2">
                  <button 
                    onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-ios text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-ios bg-systemBlue/20 flex items-center justify-center">
                      <Settings size={16} className="text-systemBlue" />
                    </div>
                    Account Settings
                  </button>
                </div>
                <div className="px-4 py-2 opacity-60">
                  <div className="h-[1px] bg-slate-200"></div>
                </div>
                <div className="px-2 pb-2">
                  <button 
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-ios text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-ios bg-rose-500/20 flex items-center justify-center">
                      <LogOut size={16} className="text-rose-400" />
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="ios-card w-full max-w-lg p-6 md:p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 shadow-ios-lg">
             {/* Modal Header */}
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-systemBlue/20 rounded-ios flex items-center justify-center">
                      <Settings size={28} className="text-systemBlue" />
                   </div>
                   <div>
                       <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Preferences</h2>
                       <p className="text-sm text-slate-500">Manage your system settings</p>
                   </div>
                </div>
                   <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                   <X size={24} />
                </button>
             </div>

             <div className="space-y-8">
                {/* Information Section */}
                <div className="space-y-4">
                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1">Professional Identity</h3>
                   <div className="bg-slate-50 rounded-ios p-5 border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center py-1">
                       <span className="text-sm text-slate-500">Legal Name</span>
                       <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                      </div>
                     <div className="h-[1px] bg-slate-200"></div>
                      <div className="flex justify-between items-center py-1">
                       <span className="text-sm text-slate-500">System Identifier</span>
                       <span className="text-sm font-bold text-slate-900 lowercase">{currentUser.email}</span>
                      </div>
                     <div className="h-[1px] bg-slate-200"></div>
                      <div className="flex justify-between items-center py-1">
                       <span className="text-sm text-slate-500">Authorization Tier</span>
                       <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wider">{currentUser.role}</span>
                      </div>
                   </div>
                </div>

                {/* Security Section (Change Password) */}
                <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1">Security Update</h3>
                      <form onSubmit={handleSettingsSave} className="bg-slate-50 rounded-ios p-5 border border-slate-200 space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight ml-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="ios-input"
                          placeholder="Required to authorize changes"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight ml-1">New Password</label>
                            <input
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              className="ios-input"
                              placeholder="Security minimum 8"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight ml-1">Confirm New</label>
                            <input
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              className="ios-input"
                              placeholder="Match new password"
                            />
                         </div>
                      </div>

                      <button 
                        type="submit"
                        className="ios-btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2"
                      >
                         <Save size={18} />
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
