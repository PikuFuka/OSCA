
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
import BatchPrint from './components/BatchPrint';
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
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { authAPI } from './services/api';

type ReportSection = 'masterlist' | 'centenarians' | 'deceased' | 'newly-registered';

const TECHNICAL_MESSAGE_PATTERN = /(axios|network error|request failed|sqlstate|exception|trace|stack|typeerror|syntaxerror|referenceerror|unauthorized|forbidden|http\s*\d{3}|status\s*\d{3}|csrf|token|cannot read properties)/i;

const toUserFriendlyMessage = (message: string, type: ToastType) => {
  if (type !== 'error') return message;
  if (TECHNICAL_MESSAGE_PATTERN.test(message)) {
    return 'Something went wrong. Please try again.';
  }
  return message;
};

const App: React.FC = () => {
  const { user: currentUser, loading, logout, isAuthenticated, checkAuth } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [reportSection, setReportSection] = useState<ReportSection | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Force password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  const pwHasMin = pwForm.newPw.length >= 8;
  const pwHasNumber = /[0-9]/.test(pwForm.newPw);
  const pwHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwForm.newPw);
  const isPasswordRuleComplete = pwHasMin && pwHasNumber && pwHasSpecial;
  const nextPasswordRequirement = !pwHasMin
    ? 'At least 8 characters'
    : !pwHasNumber
    ? 'Contains at least one number'
    : !pwHasSpecial
    ? 'Contains at least one special character'
    : 'All password requirements met';
  const pwMatches = pwForm.confirm.length > 0 && pwForm.newPw === pwForm.confirm;
  const canSubmitPasswordChange = Boolean(
    pwForm.current && pwHasMin && pwHasNumber && pwHasSpecial && pwMatches && !pwLoading
  );
  
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
    const safeMessage = toUserFriendlyMessage(message, type);
    if (type === 'error' && safeMessage !== message) {
      console.error('Technical error message hidden from user:', message);
    }
    setToast({ show: true, message: safeMessage, type });
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
      } else if (currentUser.email === 'print@osca.gov.ph') {
        setCurrentView(ViewType.BATCH_PRINT);
      } else {
        setCurrentView(ViewType.DASHBOARD);
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
        return (
          <Dashboard
            setView={setCurrentView}
            onCardNavigate={(view, targetSection) => {
              if (view === ViewType.FINAL_REPORT && targetSection) {
                setReportSection(targetSection);
              }
              setCurrentView(view);
            }}
          />
        );
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
        return <MemberRegistry currentUser={currentUser} notify={notify} setView={setCurrentView} />;
      case ViewType.ACCOUNT:
        return <Account currentUser={currentUser} notify={notify} />;
      case ViewType.HISTORY:
        return <HistoryLogView notify={notify} />;
      case ViewType.FINAL_REPORT:
        return (
          <ReportView
            notify={notify}
            setGlobalLoading={setIsGeneratingReport}
            initialSection={reportSection ?? undefined}
          />
        );
      case ViewType.BACKUP:
        return <BackupView notify={notify} />;
      case ViewType.APPROVAL:
        return <ApprovalView notify={notify} setView={setCurrentView} />;
      case ViewType.ARCHIVE:
        return <BackupView notify={notify} initialSection="archive" />;
      case ViewType.BATCH_PRINT:
        return <BatchPrint currentUser={currentUser} notify={notify} />;
      
      // Senior User Views
      case ViewType.USER_DASHBOARD:
        return <UserDashboard currentUser={currentUser} notify={notify} />;
      case ViewType.USER_REVIEW:
        return <UserReview currentUser={currentUser} />;
        
      default:
        return <Dashboard />;
    }
  };

  const navigateToView = (view: ViewType) => {
    if (view !== ViewType.FINAL_REPORT) {
      setReportSection(null);
    }
    setCurrentView(view);
  };

  // If not logged in and registering, show Public Registration View
  if (!currentUser && isRegistering) {
    return (
      <div className="min-h-screen bg-systemGray-50 p-4 md:p-8 relative">
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isVisible={toast.show} 
          onClose={closeToast} 
        />
        <div className="max-w-5xl mx-auto signup-entry-shell">
          {/* Public Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 signup-entry-header">
             <div className="flex items-center gap-4">
                {/* OSCA Logo */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-ios p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <img 
                   src="img/osca_logo.png" 
                   alt="OSCA Logo" 
                   className="w-full h-full object-contain rounded-ios"
                 />
                </div>
                {/* Seal Logo */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-ios p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                   <img 
                   src="img/pjn_logo.png" 
                   alt="Pagsanjan Seal" 
                   className="w-full h-full object-contain"
                 />
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 leading-none">OSCA Pagsanjan</span>
                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Online Registration</span>
                </div>
              </div>
              <button 
                onClick={() => setIsRegistering(false)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 rounded-ios font-semibold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowLeft size={18} /> Back to Login
              </button>
          </div>

          <div className="ios-card p-6 md:p-10 shadow-ios-lg signup-entry-card">
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

  if (!currentUser) {
    return null;
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
      if (!pwHasNumber || !pwHasSpecial) {
        notify('New password must include at least one number and one special character.', 'error');
        return;
      }
      setPwLoading(true);
      try {
        await authAPI.changePassword(pwForm.current, pwForm.newPw, pwForm.confirm);
        notify('Password changed successfully!', 'success');
        setPwForm({ current: '', newPw: '', confirm: '' });
        await checkAuth();
      } catch (error: any) {
        console.error('Failed to change password:', error);
        notify('Unable to change password right now. Please try again.', 'error');
      } finally {
        setPwLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-systemGray-50 p-4 md:p-8 relative overflow-hidden">
        <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={closeToast} />

        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-ios p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="img/osca_logo.png"
                  alt="OSCA Logo"
                  className="w-full h-full object-contain rounded-ios"
                />
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-ios p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="img/pjn_logo.png"
                  alt="Pagsanjan Seal"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 leading-none">OSCA Pagsanjan</span>
                <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Account Security</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
              <div className="px-5 py-2.5 bg-white text-slate-600 rounded-ios font-semibold border border-slate-200 shadow-sm text-center md:text-left">
                Password Update Required
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (pwLoading) return;
                  await logout();
                  setIsRegistering(false);
                }}
                className="px-5 py-2.5 bg-white text-slate-700 rounded-ios font-semibold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto ios-card p-8 md:p-10 shadow-ios-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-systemBlue/20 rounded-ios flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-systemBlue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security Update</h2>
                <p className="text-sm text-slate-500">Please update your password to continue.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="force-password-current" className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 pl-1 mb-1 block">Current Password</label>
                <div className="relative">
                  <input
                    id="force-password-current"
                    name="currentPassword"
                    type={showPw.current ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-800 placeholder-slate-400 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPw.current ? 'Hide current password' : 'Show current password'}
                  >
                    {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="force-password-new" className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 pl-1 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    id="force-password-new"
                    name="newPassword"
                    type={showPw.next ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-800 placeholder-slate-400 font-semibold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(prev => ({ ...prev, next: !prev.next }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPw.next ? 'Hide new password' : 'Show new password'}
                  >
                    {showPw.next ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className={`mt-2 text-xs font-semibold pl-1 flex items-center gap-1 ${isPasswordRuleComplete ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isPasswordRuleComplete ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {nextPasswordRequirement}
                </p>
              </div>
              <div>
                <label htmlFor="force-password-confirm" className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 pl-1 mb-1 block">Confirm New</label>
                <div className="relative">
                  <input
                    id="force-password-confirm"
                    name="confirmPassword"
                    type={showPw.confirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                    className={`w-full rounded-2xl bg-white px-4 py-3 pr-12 text-slate-800 placeholder-slate-400 font-semibold focus:ring-4 transition-all ${
                      pwForm.confirm.length === 0
                        ? 'border border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                        : pwMatches
                        ? 'border border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                        : 'border border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPw.confirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pwForm.confirm.length > 0 && (
                  <p className={`mt-2 text-xs font-semibold pl-1 flex items-center gap-1 ${pwMatches ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {pwMatches ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {pwMatches ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={!canSubmitPasswordChange}
                className={`w-full py-3.5 mt-2 rounded-ios font-semibold flex items-center justify-center gap-2 transition-all ${
                  canSubmitPasswordChange
                    ? 'ios-btn-primary'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {pwLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-systemGray-50 overflow-hidden text-slate-900 relative">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={closeToast} 
      />

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          navigateToView(view);
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
          setView={navigateToView}
          onSelectSenior={(senior) => {
            navigateToView(ViewType.MEMBER_REGISTRY);
            // Dispatch custom event with a short delay so MemberRegistry can pick it up after mount
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('header-search-senior', { detail: senior }));
            }, 150);
          }}
        />
        
        <main className="flex-1 overflow-y-auto print:overflow-visible p-4 md:p-6 lg:p-8">
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
