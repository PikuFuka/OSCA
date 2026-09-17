import React, { useState, useEffect, memo } from 'react';
import { Calendar } from 'lucide-react';

// Self-contained ticking clocks (2.5). Previously Header and BackupView each
// kept a 1-second interval in their own state, re-rendering the ENTIRE
// component (search results, dropdowns, backup panels) every second. These
// memoized children own the interval, so only the clock pixels re-render.

const useNow = (intervalMs = 1000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
};

const HeaderClockInner: React.FC = () => {
  const now = useNow();
  return (
    <div className="hidden xl:flex items-center gap-4 pr-5 border-r border-slate-200">
      <div className="flex flex-col items-end justify-center h-full">
        <p className="text-[13px] font-bold text-slate-800 tracking-tight leading-none mb-1">
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

const BackupClockInner: React.FC = () => {
  const now = useNow();
  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-2">
        <h4 className="text-5xl font-black text-slate-900 tracking-tighter">
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
        </h4>
        <div className="flex flex-col items-start text-left">
          <span className="text-blue-600 font-black text-xl leading-none">
            {now.getSeconds().toString().padStart(2, '0')}
          </span>
          <span className="text-slate-400 font-black text-[10px] uppercase leading-none mt-1">
            {now.getHours() >= 12 ? 'PM' : 'AM'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <div className="h-px w-6 bg-gradient-to-r from-transparent to-slate-200" />
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={12} className="text-slate-300" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="h-px w-6 bg-gradient-to-l from-transparent to-slate-200" />
      </div>
    </div>
  );
};

export const HeaderClock = memo(HeaderClockInner);
export const BackupClock = memo(BackupClockInner);

const LiveClock: React.FC<{ variant?: 'header' | 'backup' }> = ({ variant = 'header' }) =>
  variant === 'backup' ? <BackupClock /> : <HeaderClock />;

export default LiveClock;
