
import React, { useState } from 'react';
import { ArrowRight, User, KeyRound, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginViewProps {
  onRegister: () => void;
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onRegister, notify }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="w-full md:w-1/2 relative bg-white p-6 md:p-10 lg:p-12 flex flex-col justify-center md:max-lg:items-center min-h-screen login-entry-shell">
          <div className="relative z-10 w-full max-w-lg md:mx-auto p-6 md:p-8 lg:p-9 login-entry-card">
            <div className="mb-7 text-center">
              <h2 className="text-3xl md:text-[2.25rem] font-black text-slate-900 tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-500 font-medium text-[1.05rem]">Enter your credentials to access the portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-identifier" className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Email or OSCA ID</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    id="login-identifier"
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="example@osca.gov.ph or 0001"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200/90 bg-slate-50/90 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700 placeholder:font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <KeyRound size={18} />
                  </div>
                  <input 
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200/90 bg-slate-50/90 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700 placeholder:font-semibold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-start">
                 <button type="button" className="text-[0.95rem] font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                    Forgot your password?
                 </button>
               </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-1"
              >
                {loading ? (
                  'Authenticating...'
                ) : (
                  <>Sign In <ArrowRight size={20} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
               <button 
                 onClick={onRegister}
                 className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-[1.02rem] hover:border-slate-800 hover:text-slate-900 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
               >
                 <UserPlus size={18} /> Apply for Senior Citizen ID
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

