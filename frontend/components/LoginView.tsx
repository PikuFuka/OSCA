import React, { useState } from 'react';
import { User, Lock, UserPlus, Eye, EyeOff, LogIn } from 'lucide-react';
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
    } catch (error: any) {
      console.error(error);
      notify('Invalid credentials. Please check your ID/Email and password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col overflow-hidden selection:bg-orange-100 animate-[loginFade_680ms_cubic-bezier(0.16,1,0.3,1)_both]">
      {/* Mobile top bar - minimal */}
      <div className="flex md:hidden items-center gap-3 px-5 h-[56px] bg-white/90 backdrop-blur border-b border-slate-200 shrink-0 animate-[fadeIn_500ms_80ms_both]">
        <img src="img/pjn_logo.png" alt="Pagsanjan" className="h-7 w-7 object-contain" />
        <img src="img/osca_logo.png" alt="OSCA" className="h-7 w-7 object-contain" />
        <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-700 uppercase">OSCA Pagsanjan</span>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row animate-[softFade_720ms_cubic-bezier(0.16,1,0.3,1)_80ms_both]">
        {/* LEFT — image, 2-column preserved */}
        <div className="hidden md:flex md:w-[50%] lg:w-[52%] relative overflow-hidden bg-[#0B1220] animate-[fadeIn_600ms_100ms_both]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform animate-[kenburns_18s_ease-in-out_both]"
            style={{ backgroundImage: 'url("img/arch.jpg")' }}
            aria-hidden
          />
          {/* refined color: deep ink veil + warm amber lift — no blue cast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/90 via-[#0B1220]/55 to-[#0B1220]/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-amber-900/15" />
          <div className="absolute inset-0 ring-1 ring-white/10 ring-inset" />

          <div className="relative z-10 flex h-full w-full flex-col justify-end p-8 lg:p-10 xl:p-12">
            {/* Bottom branding — animation: slide up */}
            <div className="max-w-[520px] animate-[slideUp_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
              <div className="flex items-start gap-4">
                <div className="hidden lg:flex items-center gap-3 shrink-0 pt-1">
                  <img src="img/pjn_logo.png" alt="Pagsanjan Seal" className="h-11 w-11 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
                  <img src="img/osca_logo.png" alt="OSCA Logo" className="h-11 w-11 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
                <div className="border-l-[3px] border-[#E87722] pl-4">
                  <h2 className="text-[22px] xl:text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                    Office for Senior Citizens&apos; Affairs
                    <span className="block font-light text-white/85">Management Information System</span>
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="flex flex-1 min-w-0 items-center justify-center bg-[#F6F8FB] relative px-4 py-8 sm:px-6 sm:py-10 md:px-8 lg:px-12">
          {/* refined palette: warm peach + cool slate, softer than before */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -top-24 -right-24 h-[460px] w-[460px] rounded-full bg-[#FFF1E6] blur-[75px] opacity-90" />
            <div className="absolute -bottom-32 -left-16 h-[560px] w-[560px] rounded-full bg-[#EAF0F8] blur-[85px] opacity-70" />
          </div>

          <div className="relative w-full max-w-[420px] animate-[cardIn_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="relative bg-white rounded-[24px] border border-slate-200/70 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.14),0_10px_18px_-10px_rgba(15,23,42,0.06)] overflow-hidden">
              {/* refined hairline: warm amber to cool slate, subtle */}
              <div className="h-[3px] w-full bg-gradient-to-r from-[#E87722] via-[#F59E0B] to-[#334155]" />

              <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-7 sm:pb-8">
                <div className="mb-7 animate-[fadeIn_500ms_120ms_both]">
                  <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0F172A] leading-none">Sign In</h1>
                  <p className="mt-2 text-[13px] leading-5 text-slate-500 font-medium">Enter your credentials to access the workspace.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5 animate-[fadeIn_500ms_180ms_both]">
                    <label htmlFor="login-identifier" className="block text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                      Username
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E87722] transition-colors duration-200">
                        <User size={17} strokeWidth={1.9} />
                      </div>
                      <input
                        id="login-identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="example@osca.gov.ph or 0001"
                        autoComplete="username"
                        required
                        className="w-full rounded-[14px] border border-slate-200 bg-[#FCFCFD] py-[12.5px] pl-[42px] pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-200 focus:bg-white focus:border-[#E87722]/30 focus:ring-[4px] focus:ring-[#FFF1E6] hover:border-slate-300 hover:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 animate-[fadeIn_500ms_240ms_both]">
                    <label htmlFor="login-password" className="block text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E87722] transition-colors duration-200">
                        <Lock size={17} strokeWidth={1.9} />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        required
                        className="w-full rounded-[14px] border border-slate-200 bg-[#FCFCFD] py-[12.5px] pl-[42px] pr-[46px] text-[14px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-200 focus:bg-white focus:border-[#E87722]/30 focus:ring-[4px] focus:ring-[#FFF1E6] hover:border-slate-300 hover:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E87722]/25"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 animate-[fadeIn_500ms_300ms_both]">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" />
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-[6px] border border-slate-300 bg-white transition-all duration-200 peer-checked:bg-[#E87722] peer-checked:border-[#E87722] peer-checked:shadow-[0_2px_8px_rgba(232,119,34,0.35)] peer-focus-visible:ring-2 peer-focus-visible:ring-[#E87722]/20 group-hover:border-slate-400">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="opacity-0 peer-checked:opacity-100 transition-opacity duration-150"><path d="M2.5 6L4.9 8.4L9.5 3.1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span className="text-[12.5px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Remember Me</span>
                    </label>
                    <button type="button" className="text-[12.5px] font-semibold text-[#E87722] hover:text-[#C46218] underline-offset-4 hover:underline transition-colors">
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#E87722] px-5 py-[13.5px] text-[12px] font-extrabold tracking-[0.08em] text-white uppercase shadow-[0_10px_22px_-12px_rgba(232,119,34,0.95)] hover:bg-[#D86918] hover:shadow-[0_14px_28px_-14px_rgba(232,119,34,0.9)] hover:-translate-y-[0.5px] active:translate-y-[0.5px] active:shadow-[0_6px_14px_-10px_rgba(232,119,34,0.9)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE8D3] animate-[fadeIn_500ms_360ms_both]"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <LogIn size={16} strokeWidth={2.1} className="-ml-0.5 transition-transform group-hover:translate-x-0.5" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 animate-[fadeIn_500ms_420ms_both]">
                  <div className="relative flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-slate-200/80" />
                    <span className="text-[10.5px] font-bold tracking-[0.16em] text-slate-400 uppercase">New to OSCA?</span>
                    <div className="h-px flex-1 bg-slate-200/80" />
                  </div>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-5 py-[13px] text-[12px] font-bold tracking-[0.07em] text-slate-700 uppercase hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 hover:-translate-y-[0.5px] active:translate-y-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                  >
                    <UserPlus size={16} strokeWidth={1.9} className="text-slate-400" />
                    Apply for Senior Citizen ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loginFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes softFade {
          from { opacity: 0; transform: translate3d(0,12px,0); }
          to { opacity: 1; transform: translate3d(0,0,0); }
        }
        @keyframes kenburns {
          from { transform: scale(1.06) translate3d(0,0,0); }
          to { transform: scale(1) translate3d(0,0,0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate3d(0,14px,0); }
          to { opacity: 1; transform: translate3d(0,0,0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translate3d(0,16px,0) scale(0.985); }
          to { opacity: 1; transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate3d(0,6px,0); }
          to { opacity: 1; transform: translate3d(0,0,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginView;
