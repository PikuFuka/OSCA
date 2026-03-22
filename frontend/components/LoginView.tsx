
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
    <div className="min-h-screen flex items-center justify-center p-6 py-16 md:p-4 relative overflow-hidden bg-slate-900">
      {/* Background Image - Pagsanjan Arch */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: 'url("img/arch.jpg")' }}
        ></div>
        {/* Overlays for better readability and branding */}
        <div className="absolute inset-0 bg-blue-900/28 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-900/10 to-amber-900/20"></div>
      </div>

      <div className="max-w-4xl w-full bg-white/95 rounded-3xl md:rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border border-white/20 relative z-10 backdrop-blur-md">

        
        {/* Left Side - Branding */}
        <div className="md:w-1/2 bg-blue-900 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Curves */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8 justify-center md:justify-start">
              {/* OSCA Logo */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full p-1 flex items-center justify-center shadow-lg shadow-blue-900/50 hover:scale-105 transition-transform duration-500">
                 {/* REPLACE SRC WITH YOUR LOCAL IMAGE */}
                 <img 
                   src="img/osca_logo.png" 
                   alt="OSCA Logo" 
                   className="w-full h-full object-contain rounded-full"
                 />
              </div>
              {/* Pagsanjan Seal */}
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full p-1 flex items-center justify-center shadow-lg shadow-blue-900/50 hover:scale-105 transition-transform duration-500">
                 <img 
                   src="img/pjn_logo.png" 
                   alt="Pagsanjan Seal" 
                   className="w-full h-full object-contain"
                 />
              </div>
            </div>
            
            <div className="space-y-1 mb-2 text-center md:text-left">
              <p className="text-blue-300 font-bold uppercase tracking-widest text-xs">Republic of the Philippines</p>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">Municipality of <br/>Pagsanjan</h1>
            </div>
            <div className="h-1 w-20 bg-amber-500 rounded-full mb-4 mx-auto md:mx-0"></div>
            <p className="text-blue-100 font-medium text-lg leading-relaxed text-center md:text-left">Office for Senior Citizens' Affairs Management Information System</p>
          </div>

          <div className="relative z-10 space-y-4 mt-8 hidden md:block">
            <div className="p-4 bg-blue-800/40 rounded-2xl border border-blue-400/20 backdrop-blur-md">
              <div className="flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 animate-pulse"></div>
                 <div>
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">System Status</p>
                    <p className="text-sm text-white font-medium">RA 9994 Compliance modules active. Database synchronized.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 pb-12 md:p-12 flex flex-col justify-center relative bg-white">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-slate-500 font-medium mt-2">Enter your credentials to access the secure portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="login-identifier" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Email or OSCA ID</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-900 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  id="login-identifier"
                  name="identifier"
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g., 2024-0001"
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-300/80 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 placeholder:font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Password</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-900 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input 
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border border-slate-300/80 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end pr-1">
                <button type="button" className="text-[11px] text-blue-800 font-bold hover:text-blue-900 transition-colors">
                  Forgot your password?
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center space-y-6">
             <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-slate-400">Not registered yet?</span>
             </div>
             <button 
               onClick={onRegister}
               className="w-full bg-white border-2 border-blue-900/60 text-blue-900 py-3 rounded-2xl font-bold hover:bg-blue-50 hover:border-blue-900 hover:text-blue-900 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
             >
               <UserPlus size={18} /> Apply for Senior Citizen ID
             </button>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-4 md:bottom-8 left-0 w-full text-center z-10 pointer-events-none px-4">
        <p className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-[0.2em] drop-shadow-md">
           Official System of the Municipality of Pagsanjan
        </p>
      </div>
    </div>
  );
};

export default LoginView;

