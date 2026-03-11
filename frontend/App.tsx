
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddMemberForm from './components/AddMemberForm';
import MemberRegistry from './components/MemberRegistry';
import Account from './components/Account';
import HistoryLogView from './components/HistoryLogView';
import ReportView from './components/ReportView';
import BackupView from './components/BackupView';
import ApprovalView from './components/ApprovalView';
import LoginView from './components/LoginView';
import ConfirmModal from './components/ConfirmModal';
import UserDashboard from './components/UserDashboard';
import UserReview from './components/UserReview';
import Toast, { ToastType } from './components/Toast';
import { ViewType } from './types';
import { 
  ArrowLeft, 
  Loader2,
  Clock,
  KeyRound 
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { authAPI } from './services/api';

const App: React.FC = () => {
  const { user: currentUser, loading, logout, isAuthenticated, checkAuth } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Force password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  
  // Track auth globally for background API prevention
  useEffect(() => {
    (window as any).isAuthenticated = isAuthenticated;
  }, [isAuthenticated]);

  // State for public registration flow
  const [isRegistering, setIsRegistering] = useState(false);

  // Logout Modal State
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'success'
  });

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  // Responsive Sidebar Logic
  useEffect(() => {
    const handleResize = () => {
      // < 1024 (lg) covers tablets and mobile.
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine initial view based on role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Senior') {
        setCurrentView(ViewType.USER_DASHBOARD);
      } else {
        setCurrentView(ViewType.DASHBOARD);
      }
      
      // Notify welcome on login
      const hasNotified = sessionStorage.getItem(`welcome_notified_${currentUser.id}`);
      if (!hasNotified) {
        notify(`Welcome, ${currentUser.name}!`, 'success');
        sessionStorage.setItem(`welcome_notified_${currentUser.id}`, 'true');
      }
    }
  }, [currentUser]);

  const requestLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    await logout();
    setIsRegistering(false);
    setIsLogoutConfirmOpen(false);
    notify('You have been logged out.', 'error');
  };

  // Show loading screen while verifying session or performing auth operations
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 flex items-center justify-center border border-slate-100 relative z-10">
              <img 
                src="img/osca_logo.png" 
                alt="OSCA Logo" 
                className="w-16 h-16 object-contain animate-pulse"
              />
            </div>
            {/* Spinning ring */}
            <div className="absolute inset-[-8px] border-4 border-blue-900/5 rounded-[2.5rem]"></div>
            <div className="absolute inset-[-8px] border-4 border-transparent border-t-blue-900 rounded-[2.5rem] animate-spin"></div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-slate-900 font-black text-xl tracking-tight">OSCA Pagsanjan</h2>
            <div className="flex items-center justify-center gap-3">
               <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      // Admin / Staff Views
      case ViewType.DASHBOARD:
        return <Dashboard setView={setCurrentView} />;
      case ViewType.ADD_MEMBER:
        // Used by Seniors (Update) and Staff (Register)
        // If Senior, it acts as "Update Profile"
        return <AddMemberForm 
          currentUser={currentUser} 
          notify={notify}
          onSuccess={() => {
             if (currentUser.role !== 'Senior') {
               setCurrentView(ViewType.MEMBER_REGISTRY);
             } else {
               notify("Update request submitted successfully.", "success");
               setCurrentView(ViewType.USER_DASHBOARD);
             }
          }} 
        />;
      case ViewType.MEMBER_REGISTRY:
        return <MemberRegistry currentUser={currentUser} notify={notify} />;
      case ViewType.ACCOUNT:
        return <Account currentUser={currentUser} notify={notify} />;
      case ViewType.HISTORY:
        return <HistoryLogView notify={notify} />;
      case ViewType.FINAL_REPORT:
        return <ReportView notify={notify} setGlobalLoading={setIsGeneratingReport} />;
      case ViewType.BACKUP:
        return <BackupView notify={notify} />;
      case ViewType.APPROVAL:
        return <ApprovalView notify={notify} setView={setCurrentView} />;
      case ViewType.ARCHIVE:
        return <BackupView notify={notify} initialSection="archive" />;
      
      // Senior User Views
      case ViewType.USER_DASHBOARD:
        return <UserDashboard currentUser={currentUser} notify={notify} />;
      case ViewType.USER_REVIEW:
        return <UserReview currentUser={currentUser} />;
        
      default:
        return <Dashboard />;
    }
  };

  // If not logged in and registering, show Public Registration View
  if (!currentUser && isRegistering) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.show} 
          onClose={closeToast} 
        />
        <div className="max-w-5xl mx-auto">
          {/* Public Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
                {/* OSCA Logo */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full p-0.5 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <img 
                   src="img/osca_logo.png" 
                   alt="OSCA Logo" 
                   className="w-full h-full object-contain rounded-full"
                 />
                </div>
                {/* Seal Logo */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full p-0.5 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                   <img 
                   src="img/pjn_logo.png" 
                   alt="Pagsanjan Seal" 
                   className="w-full h-full object-contain"
                 />
                </div>

                <div className="flex flex-col">
                  <span className="font-black text-xl md:text-2xl tracking-tighter text-blue-900 leading-none">OSCA Pagsanjan</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Online Registration</span>
                </div>
              </div>
              <button 
                onClick={() => setIsRegistering(false)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:border-blue-200 hover:text-blue-900 transition-all shadow-sm"
              >
                <ArrowLeft size={18} /> Back to Login
              </button>
          </div>

          <AddMemberForm 
            notify={notify}
            onSuccess={() => {
              // Not changing view state here immediately to allow user to see success message or decide next step
              setIsRegistering(false);
            }} 
            onCancel={() => setIsRegistering(false)}
          />
        </div>
      </div>
    );
  }

  // If not logged in and not registering, show Login View
  if (!isAuthenticated) {
    return (
      <>
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.show} 
          onClose={closeToast} 
        />
        <LoginView onRegister={() => setIsRegistering(true)} notify={notify} />
      </>
    );
  }

  // Authenticated View

  // Force password change modal for seniors with default password
  if (currentUser?.forcePasswordChange) {
    const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      if (pwForm.newPw !== pwForm.confirm) {
        notify('New passwords do not match.', 'error');
        return;
      }
      if (pwForm.newPw.length < 8) {
        notify('New password must be at least 8 characters.', 'error');
        return;
      }
      setPwLoading(true);
      try {
        await authAPI.changePassword(pwForm.current, pwForm.newPw, pwForm.confirm);
        notify('Password changed successfully!', 'success');
        setPwForm({ current: '', newPw: '', confirm: '' });
        await checkAuth();
      } catch (error: any) {
        notify(error.message || 'Failed to change password.', 'error');
      } finally {
        setPwLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={closeToast} />
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[120px]"></div>
        </div>
        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Change Your Password</h2>
              <p className="text-sm text-slate-500">You must change your default password before continuing.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="force-password-current" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-1 block">Current Password</label>
              <input
                id="force-password-current"
                name="currentPassword"
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                placeholder="Enter your current password"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700"
              />
            </div>
            <div>
              <label htmlFor="force-password-new" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-1 block">New Password</label>
              <input
                id="force-password-new"
                name="newPassword"
                type="password"
                value={pwForm.newPw}
                onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700"
              />
            </div>
            <div>
              <label htmlFor="force-password-confirm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-1 block">Confirm New Password</label>
              <input
                id="force-password-confirm"
                name="confirmPassword"
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 relative">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={closeToast} 
      />

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setCurrentView(view);
          if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile select
        }} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={currentUser}
      />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header 
          viewTitle={currentView.replace(/USER_/g, '').replace(/_/g, ' ')} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUser={currentUser}
          onLogout={requestLogout}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto view-enter" key={currentView}>
            {renderView()}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal - Rendered at App level to cover Sidebar */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        variant="warning"
        confirmLabel="Logout"
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      {/* Global Report Generation Overlay */}
      {isGeneratingReport && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-900 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">GENERATING REPORT</h3>
              <p className="text-sm font-medium text-slate-500">Compiling statistics and masterlists...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
