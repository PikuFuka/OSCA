import React, { useEffect, useRef, useState } from 'react';
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
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<number | null>(null);
  const { login } = useAuth();

  useEffect(() => {
    return () => {
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, password, rememberMe);
    } catch (error: any) {
      console.error(error);
      notify('Invalid credentials. Please check your ID/Email and password.', 'error');
      setShake(false);
      window.requestAnimationFrame(() => setShake(true));
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
      shakeTimer.current = window.setTimeout(() => setShake(false), 480);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell min-h-screen bg-[#F6F8FB] flex flex-col overflow-hidden selection:bg-orange-100">
      {/* Mobile top bar - minimal */}
      <div className="login-rise flex md:hidden items-center gap-3 px-5 h-[56px] bg-white/90 backdrop-blur border-b border-slate-200 shrink-0" style={{ animationDelay: '40ms' }}>
        <img src="img/pjn_logo.png" alt="Pagsanjan" className="login-seal h-7 w-7 object-contain" style={{ animationDelay: '120ms' }} />
        <img src="img/osca_logo.png" alt="OSCA" className="login-seal h-7 w-7 object-contain" style={{ animationDelay: '160ms' }} />
        <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-700 uppercase">OSCA Pagsanjan</span>
      </div>

      <div className="login-rise flex flex-1 min-h-0 flex-col md:flex-row" style={{ animationDelay: '60ms' }}>
        {/* LEFT — image, 2-column preserved */}
        <div className="hidden md:flex md:w-[50%] lg:w-[52%] relative overflow-hidden bg-[#0B1220]">
          <div
            className="login-photo absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
            style={{ backgroundImage: 'url("img/arch.jpg")' }}
            aria-hidden
          />
          {/* refined color: deep ink veil + warm amber lift — no blue cast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/90 via-[#0B1220]/55 to-[#0B1220]/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-amber-900/15" />
          <div className="absolute inset-0 ring-1 ring-white/10 ring-inset" />

          {/* single light pass across the photo on open */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="login-photo-sweep absolute -inset-y-24 left-0 w-[38%] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-end p-8 lg:p-10 xl:p-12">
            {/* Bottom branding */}
            <div className="login-rise max-w-[520px]" style={{ animationDelay: '220ms' }}>
              <div className="flex items-start gap-4">
                <div className="relative hidden lg:flex items-center gap-3 shrink-0 pt-1">
                  <span className="login-logo-glow pointer-events-none absolute -inset-3 rounded-full bg-[#E87722]/25 blur-xl" aria-hidden />
                  <img src="img/pjn_logo.png" alt="Pagsanjan Seal" className="login-seal relative h-11 w-11 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" style={{ animationDelay: '300ms' }} />
                  <img src="img/osca_logo.png" alt="OSCA Logo" className="login-seal relative h-11 w-11 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" style={{ animationDelay: '360ms' }} />
                </div>
                <div className="relative pl-4">
                  <span className="login-rule absolute left-0 top-0 h-full w-[3px] origin-top bg-[#E87722]" aria-hidden />
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
          <div className="login-rise pointer-events-none absolute inset-0 overflow-hidden" aria-hidden style={{ animationDelay: '120ms' }}>
            <div className="login-drift-a absolute -top-24 -right-24 h-[460px] w-[460px] rounded-full bg-[#FFF1E6] blur-[75px] opacity-90" />
            <div className="login-drift-b absolute -bottom-32 -left-16 h-[560px] w-[560px] rounded-full bg-[#EAF0F8] blur-[85px] opacity-70" />
          </div>

          <div className="login-card relative w-full max-w-[420px]" style={{ animationDelay: '80ms' }}>
            <div className={`relative bg-white rounded-[24px] border border-slate-200/70 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.14),0_10px_18px_-10px_rgba(15,23,42,0.06)] overflow-hidden ${shake ? 'login-shake' : ''}`}>
              {/* refined hairline: warm amber to cool slate, with one light pass */}
              <div className="relative h-[3px] w-full overflow-hidden bg-slate-100">
                <div className="login-bar absolute inset-0 origin-left bg-gradient-to-r from-[#E87722] via-[#F59E0B] to-[#334155]" />
                <div className="login-bar-sheen absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden />
              </div>

              <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-7 sm:pb-8">
                <div className="login-reveal mb-7" style={{ animationDelay: '120ms' }}>
                  <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0F172A] leading-none">Sign In</h1>
                  <p className="mt-2 text-[13px] leading-5 text-slate-500 font-medium">Enter your credentials to access the workspace.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="group/field login-reveal space-y-1.5" style={{ animationDelay: '160ms' }}>
                    <label htmlFor="login-identifier" className="block text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase transition-colors duration-200 group-focus-within/field:text-[#C46218]">
                      Username
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-all duration-200 group-focus-within/field:-translate-y-[calc(50%+1px)] group-focus-within/field:scale-110 group-focus-within/field:text-[#E87722]">
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
                        className="login-input w-full rounded-[14px] border border-slate-200 bg-[#FCFCFD] py-[12.5px] pl-[42px] pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-200 hover:border-slate-300 hover:bg-white"
                      />
                      <span className="login-underline pointer-events-none absolute inset-x-5 bottom-[1px] h-[2px] origin-left rounded-full bg-[#E87722]/80" aria-hidden />
                    </div>
                  </div>

                  <div className="group/field login-reveal space-y-1.5" style={{ animationDelay: '200ms' }}>
                    <label htmlFor="login-password" className="block text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase transition-colors duration-200 group-focus-within/field:text-[#C46218]">
                      Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-all duration-200 group-focus-within/field:-translate-y-[calc(50%+1px)] group-focus-within/field:scale-110 group-focus-within/field:text-[#E87722]">
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
                        className="login-input w-full rounded-[14px] border border-slate-200 bg-[#FCFCFD] py-[12.5px] pl-[42px] pr-[46px] text-[14px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-200 hover:border-slate-300 hover:bg-white"
                      />
                      <span className="login-underline pointer-events-none absolute inset-x-5 bottom-[1px] h-[2px] origin-left rounded-full bg-[#E87722]/80" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E87722]/25"
                      >
                        <span key={showPassword ? 'visible' : 'hidden'} className="login-icon-pop inline-flex">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="login-reveal flex items-center justify-between pt-0.5" style={{ animationDelay: '240ms' }}>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" />
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-[6px] border border-slate-300 bg-white transition-all duration-200 peer-checked:bg-[#E87722] peer-checked:border-[#E87722] peer-checked:shadow-[0_2px_8px_rgba(232,119,34,0.35)] peer-focus-visible:ring-2 peer-focus-visible:ring-[#E87722]/20 peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100 group-hover:border-slate-400">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="scale-0 opacity-0 transition-all duration-150"><path d="M2.5 6L4.9 8.4L9.5 3.1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span className="text-[12.5px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Remember Me</span>
                    </label>
                    <button type="button" className="text-[12.5px] font-semibold text-[#E87722] hover:text-[#C46218] underline-offset-4 hover:underline transition-colors">
                      Forgot Password?
                    </button>
                  </div>

                  <div className="login-reveal" style={{ animationDelay: '280ms' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full overflow-hidden inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#E87722] px-5 py-[13.5px] text-[12px] font-extrabold tracking-[0.08em] text-white uppercase shadow-[0_10px_22px_-12px_rgba(232,119,34,0.95)] hover:bg-[#D86918] hover:shadow-[0_14px_28px_-14px_rgba(232,119,34,0.9)] hover:-translate-y-[0.5px] active:translate-y-[0.5px] active:shadow-[0_6px_14px_-10px_rgba(232,119,34,0.9)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE8D3]"
                    >
                      <span className="login-btn-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[220%] -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[320%]" aria-hidden />
                      <span className="relative z-10 inline-flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Authenticating...
                          </>
                        ) : (
                          <>
                            <LogIn size={16} strokeWidth={2.1} className="-ml-0.5 transition-transform group-hover:translate-x-0.5" />
                            Sign In
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                <div className="login-reveal mt-6" style={{ animationDelay: '320ms' }}>
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
        .login-shell {
          animation: loginFade 260ms ease-out both;
        }
        .login-rise {
          animation: loginRise 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .login-reveal {
          animation: loginReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .login-card {
          animation: loginCardIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .login-photo {
          animation:
            loginPhotoIn 620ms ease-out both,
            loginKenBurns 18s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .login-photo-sweep {
          transform: translateX(-170%) skewX(-14deg);
          animation: loginPhotoSweep 1500ms cubic-bezier(0.22, 1, 0.36, 1) 260ms both;
        }

        .login-seal {
          animation: loginSealPop 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .login-logo-glow {
          animation: loginGlow 1400ms ease-out 320ms both;
        }
        .login-rule {
          animation: loginRule 420ms cubic-bezier(0.22, 1, 0.36, 1) 360ms both;
        }

        .login-drift-a {
          animation: loginDriftA 19s ease-in-out infinite alternate;
        }
        .login-drift-b {
          animation: loginDriftB 24s ease-in-out infinite alternate;
        }

        .login-bar {
          animation: loginBarDraw 480ms cubic-bezier(0.22, 1, 0.36, 1) 140ms both;
        }
        .login-bar-sheen {
          transform: translateX(-160%);
          animation: loginBarSheen 900ms cubic-bezier(0.4, 0, 0.2, 1) 520ms both;
        }

        .login-underline {
          transform: scaleX(0);
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .group\\/field:focus-within .login-underline {
          transform: scaleX(1);
        }

        .login-input:focus {
          background-color: #ffffff !important;
          border-color: rgba(232, 119, 34, 0.45) !important;
          box-shadow: 0 0 0 4px #FFF1E6 !important;
          caret-color: #E87722;
        }
        .login-input::selection {
          background-color: #FFE2C7;
        }

        .login-icon-pop {
          animation: loginIconPop 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .login-shake {
          animation: loginShake 440ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes loginFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loginRise {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes loginReveal {
          from { opacity: 0; transform: translate3d(0, 8px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes loginCardIn {
          from { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.98); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes loginPhotoIn {
          from { opacity: 0.25; }
          to { opacity: 1; }
        }
        @keyframes loginKenBurns {
          from { transform: scale(1.08) translate3d(0, 0, 0); }
          to { transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes loginPhotoSweep {
          from { transform: translateX(-170%) skewX(-14deg); }
          to { transform: translateX(420%) skewX(-14deg); }
        }
        @keyframes loginSealPop {
          from { opacity: 0; transform: scale(0.82) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes loginGlow {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes loginRule {
          from { opacity: 0; transform: scaleY(0.2); }
          to { opacity: 1; transform: scaleY(1); }
        }
        @keyframes loginDriftA {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(-28px, 22px, 0) scale(1.06); }
        }
        @keyframes loginDriftB {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(24px, -18px, 0) scale(1.05); }
        }
        @keyframes loginBarDraw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes loginBarSheen {
          from { transform: translateX(-160%); }
          to { transform: translateX(320%); }
        }
        @keyframes loginIconPop {
          from { opacity: 0; transform: scale(0.7) rotate(-8deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes loginShake {
          0%, 100% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(-6px, 0, 0); }
          40% { transform: translate3d(5px, 0, 0); }
          60% { transform: translate3d(-3px, 0, 0); }
          80% { transform: translate3d(2px, 0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-shell,
          .login-rise,
          .login-reveal,
          .login-card,
          .login-photo,
          .login-photo-sweep,
          .login-seal,
          .login-logo-glow,
          .login-rule,
          .login-drift-a,
          .login-drift-b,
          .login-bar,
          .login-bar-sheen,
          .login-icon-pop,
          .login-shake {
            animation: none !important;
          }
          .login-underline,
          .login-photo,
          .login-drift-a,
          .login-drift-b {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginView;
