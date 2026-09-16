import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export const scrollMainToTop = () => {
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
};

export const TABLE_ROW_CLASS = 'group hover:bg-slate-50/60 transition-colors';

export const TABLE_HEAD_CELL = 'px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]';

const AVATAR_TONES = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
];

export const avatarToneFor = (name: string = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

export const getInitials = (name: string = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const TableHeadCell = ({
  children,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) => (
  <th
    className={`${TABLE_HEAD_CELL} ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''} ${className}`}
  >
    {children}
  </th>
);

export const RowNumber = ({ value }: { value: number }) => (
  <td className="pl-6 pr-2 py-4 text-[12px] font-medium text-slate-400 tabular-nums whitespace-nowrap">
    {value}
  </td>
);

export const TableAvatar = ({
  name,
  photo,
  className = '',
}: {
  name: string;
  photo?: string;
  className?: string;
}) => {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        width={36}
        height={36}
        className={`w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-50 ${className}`}
      />
    );
  }
  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs border border-black/5 shrink-0 ${avatarToneFor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-700 border-amber-100',
  Rejected: 'bg-rose-50 text-rose-600 border-rose-100',
  Deceased: 'bg-slate-900 text-white border-slate-900',
};

const STATUS_DOT: Record<string, string> = {
  Active: 'bg-emerald-500',
  Approved: 'bg-emerald-500',
  Pending: 'bg-amber-500 animate-pulse',
  Rejected: 'bg-rose-500',
  Deceased: 'bg-slate-400',
};

export const StatusPill = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border whitespace-nowrap ${
      STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`} />
    {status}
  </span>
);

export const CategoryPill = ({ label }: { label: string }) => (
  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 whitespace-nowrap">
    {label}
  </span>
);

type ActionTone = 'view' | 'neutral' | 'success' | 'warning' | 'danger';

const ACTION_TONES: Record<ActionTone, string> = {
  view: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-systemBlue hover:text-white hover:border-systemBlue hover:shadow-md hover:shadow-blue-500/15',
  neutral:
    'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-600',
  success:
    'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/15',
  warning:
    'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-500 hover:text-white hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/15',
  danger:
    'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-md hover:shadow-rose-500/15',
};

const ACTION_SIZES = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-9 h-9 rounded-[10px]',
};

export const TableActionButton = ({
  title,
  onClick,
  tone = 'neutral',
  size = 'sm',
  children,
  disabled = false,
  className = '',
}: {
  title: string;
  onClick?: (e: React.MouseEvent) => void;
  tone?: ActionTone;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`${ACTION_SIZES[size]} flex items-center justify-center transition-all border shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${ACTION_TONES[tone]} ${className}`}
  >
    {children}
  </button>
);

export const EmptyTableRow = ({
  colSpan,
  title,
  message,
}: {
  colSpan: number;
  title: string;
  message?: string;
}) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-20 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
          <Inbox size={26} className="text-slate-300" />
        </div>
        <p className="text-[14px] font-bold text-slate-600">{title}</p>
        {message && <p className="text-[12px] text-slate-400 font-medium mt-1 max-w-xs">{message}</p>}
      </div>
    </td>
  </tr>
);

export const ShowingText = ({
  from,
  to,
  total,
  noun,
}: {
  from: number;
  to: number;
  total: number;
  noun: string;
}) => (
  <p className="text-[12px] font-medium text-slate-400">
    Showing <span className="font-bold text-slate-600">{from}</span> to{' '}
    <span className="font-bold text-slate-600">{to}</span> of{' '}
    <span className="font-bold text-slate-600">{total}</span> {noun}
  </p>
);

export const PageJump = ({
  page,
  totalPages,
  onJump,
}: {
  page: number;
  totalPages: number;
  onJump: (page: number) => void;
}) => {
  const [value, setValue] = useState('');
  const commit = () => {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) onJump(Math.max(1, Math.min(totalPages, n)));
    setValue('');
  };
  return (
    <div className="flex items-center gap-1.5 ml-1 pl-3 border-l border-slate-200">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
        placeholder={String(page)}
        aria-label="Go to page number"
        inputMode="numeric"
        className="w-11 h-8 text-center text-[12px] font-bold text-slate-700 tabular-nums rounded-lg border border-slate-200 bg-white outline-none placeholder:text-slate-300 focus:border-systemBlue transition-colors"
      />
      <button
        type="button"
        onClick={commit}
        className="h-8 px-2.5 rounded-lg text-[12px] font-bold text-slate-500 border border-slate-200 bg-white hover:border-systemBlue hover:text-systemBlue transition-all"
      >
        Go
      </button>
    </div>
  );
};

export const TablePagination = ({
  page,
  totalPages,
  onPage,
  from,
  to,
  total,
  noun,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  from: number;
  to: number;
  total: number;
  noun: string;
}) => {
  const windowStart = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pageNumbers: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pageNumbers.push(p);
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
      <ShowingText from={from} to={to} total={total} noun={noun} />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-systemBlue hover:text-systemBlue transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPage(pageNum)}
            className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center ${
              page === pageNum
                ? 'bg-systemBlue text-white shadow-sm shadow-blue-500/20'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-systemBlue hover:text-systemBlue'
            }`}
          >
            {pageNum}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-systemBlue hover:text-systemBlue transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
        <PageJump page={page} totalPages={totalPages} onJump={onPage} />
      </div>
    </div>
  );
};
