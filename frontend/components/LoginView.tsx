
import React, { useState } from 'react';
import { ArrowRight, User, Lock, UserPlus, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginViewProps {
  onRegister: () => void;
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onRegister, notify }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(identifier, password);
      // login success is handled by AuthContext state change, which App.tsx listens to
    } catch (error: any) {
      console.error(error); notify('Invalid credentials. Please check your ID/Email and password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 overflow-hidden">
      {/* Background Image - Blurred Arch */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 blur-sm brightness-[0.35]"
          style={{ backgroundImage: 'url("img/arch.jpg")' }}
        ></div>
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-blue-950/70"></div>
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col md:flex-row">
        
        {/* Left Side - Branding */}
        <div className="hidden md:flex md:w-1/2 relative p-8 md:p-12 lg:p-16 flex-col justify-between overflow-hidden min-h-screen">
          {/* Image Background for Left Panel */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105 brightness-[0.62] contrast-125 saturate-90"
            style={{ backgroundImage: 'url("img/arch.jpg")' }}
          ></div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-900/76 to-blue-900/58 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-blue-950/36 backdrop-blur-[1.6px]"></div>

          {/* Top Subdued Badge */}
          <div className="relative z-10 flex items-center gap-2">
            <div className="px-3.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-blue-100 uppercase tracking-widest">
              Republic of the Philippines
            </div>
          </div>

          <div className="relative z-10 mt-auto brand-entry">
            <div className="flex items-center gap-4 border-l-4 border-amber-400 pl-4 py-1">
              <div className="flex items-center gap-3 brand-entry-logos">
                <img src="img/pjn_logo.png" alt="Pagsanjan Seal" className="w-10 h-10 lg:w-12 lg:h-12 drop-shadow-md object-contain" />
                <img src="img/osca_logo.png" alt="OSCA Logo" className="w-10 h-10 lg:w-12 lg:h-12 drop-shadow-md object-contain" />
              </div>
              <p className="text-xl lg:text-2xl font-semibold text-blue-50 drop-shadow-md leading-tight max-w-xl brand-entry-title">
                Office for Senior Citizens' Affairs<br/>Management Information System
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 relative bg-white p-6 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center min-h-screen login-entry-shell">
          
          <div className="relative z-10 w-full max-w-sm mx-auto login-entry-card">
            
            {/* Mobile Branding Header */}
            <div className="flex md:hidden items-center gap-3.5 mb-8 brand-entry border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2 shrink-0">
                <img src="img/pjn_logo.png" alt="Pagsanjan Seal" className="w-9 h-9 object-contain drop-shadow-sm" />
                <img src="img/osca_logo.png" alt="OSCA Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
              </div>
              <div className="text-left">
                <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">Office for Senior Citizens' Affairs</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Management Information System</p>
              </div>
            </div>

            {/* Desktop Form Title */}
            <div className="mb-8 text-left hidden md:block">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Sign In</h2>
              <p className="text-slate-500 font-medium text-sm">Enter your credentials to access the workspace.</p>
            </div>

            {/* Mobile Form Title */}
            <div className="mb-6 text-left md:hidden">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">Sign In</h2>
              <p className="text-slate-500 font-medium text-xs">Enter your credentials to access the workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-identifier" className="text-xs font-bold uppercase tracking-wider text-slate-500 block pl-0.5">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e27c22] transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    id="login-identifier"
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="example@osca.gov.ph or 0001"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-[#e27c22] transition-all duration-200 font-semibold text-slate-800 placeholder-slate-400 placeholder:font-normal text-[15px] outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-slate-500 block pl-0.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e27c22] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-[#e27c22] transition-all duration-200 font-semibold text-slate-800 placeholder-slate-400 placeholder:font-normal text-[15px] outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#e27c22] transition-colors focus:outline-none p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#e27c22] focus:ring-0 focus:ring-offset-0 accent-[#e27c22] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500">Remember Me</span>
                </label>
                <button 
                  type="button" 
                  className="text-xs font-bold text-[#e27c22] hover:text-[#c86313] transition-colors hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative overflow-hidden bg-[#e27c22] hover:bg-[#c86313] text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <LogIn size={16} />
                    SIGN IN
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">New to OSCA?</p>
              <button 
                type="button"
                onClick={onRegister}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-orange-200 hover:text-[#e27c22] text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
              >
                <UserPlus size={16} className="text-slate-400 group-hover:text-[#e27c22]" /> Apply for Senior Citizen ID
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

