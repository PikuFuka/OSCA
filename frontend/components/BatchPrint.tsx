import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Printer, X, Loader2, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { SeniorCitizen, INITIAL_ID_CONFIG, CurrentUser } from '../types';
import { seniorsAPI } from '../services/api';
import Skeleton from './Skeleton';
import { BatchPrintSkeleton } from './skeletons';
import TransitionWrapper from './TransitionWrapper';
import { ProfilePhoto } from '../shared/components/ProfilePhoto';

interface BatchPrintProps {
  currentUser: CurrentUser;
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const StaticLabel = ({ text, config, className = "" }: { text: string, config: { x: number, y: number, fontSize: number }, className?: string }) => (
  <div
    className={`absolute select-none whitespace-nowrap leading-none z-20 ${className}`}
    style={{ left: config.x, top: config.y, fontSize: config.fontSize }}
  >
    {text}
  </div>
);

const MAX_CARDS = 12;
const CARD_WIDTH = 480;
const CARD_HEIGHT = 300;

const BatchPrint: React.FC<BatchPrintProps> = ({ notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SeniorCitizen[]>([]);
  const [selectedSeniors, setSelectedSeniors] = useState<SeniorCitizen[]>([]);
  const [searching, setSearching] = useState(false);

  const formatName = (senior: SeniorCitizen) => {
    if (!senior) return '';
    const last = (senior.lastName || (senior as any).last_name)?.trim() || '';
    const first = (senior.firstName || (senior as any).first_name)?.trim() || '';
    const mid = (senior.middleName || (senior as any).middle_name)?.trim() || '';
    const ext = (senior.extensionName || (senior as any).extension_name)?.trim() || '';
    const ordered = [last ? `${last},` : '', first, ext, mid].filter(Boolean).join(' ');
    if (ordered) return ordered;
    if (senior.name) {
      if (ext && !senior.name.toLowerCase().includes(ext.toLowerCase())) {
        return `${senior.name} ${ext}`.trim();
      }
      return senior.name;
    }
    return '';
  };

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await seniorsAPI.getAll({ search: searchTerm, per_page: 10, fresh: true });
        const data = response?.data || response || [];
        // We no longer filter out selected IDs so they appear checked in the table
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const addSenior = (senior: SeniorCitizen) => {
    if (selectedSeniors.length >= MAX_CARDS) {
      notify(`Maximum ${MAX_CARDS} cards per batch.`, 'warning');
      return;
    }
    setSelectedSeniors(prev => [...prev, senior]);
  };

  const removeSenior = (id: string) => {
    setSelectedSeniors(prev => prev.filter(s => s.id !== id));
  };

  const clearAllSelected = () => {
    if (selectedSeniors.length === 0) return;
    setSelectedSeniors([]);
    notify('Cleared all selected seniors.', 'info');
  };

  const handleBatchPrint = () => {
    if (selectedSeniors.length === 0) {
      notify('Select at least one senior to print.', 'warning');
      return;
    }
    const originalTitle = document.title;
    document.title = `OSCA_Batch_Print_${selectedSeniors.length}_cards`;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);

    setTimeout(() => window.print(), 300);
  };

  const renderFrontCard = (senior: SeniorCitizen) => {
    const rawConfig = senior.idConfig || INITIAL_ID_CONFIG;
    // Honor the shared config verbatim (same values the registry preview and
    // UserReview render) — only fall back when a value is missing entirely.
    const config = {
      ...rawConfig,
      dateIssued: {
        ...rawConfig.dateIssued,
        y: rawConfig.dateIssued?.y ?? INITIAL_ID_CONFIG.dateIssued.y,
      }
    };

    const formattedDob = senior.dateOfBirth
      ? new Date(senior.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      : (senior.age ? new Date(new Date().getFullYear() - senior.age, 0, 1).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A');

    const formattedGender = (senior as any).sex || senior.gender || '';

    return (
      <div className="relative w-full h-full overflow-hidden bg-white select-none">
        <img src="img/FRONT.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="Front ID template" />
        <div className="absolute inset-0 z-10">
          <div className="absolute" style={{ left: '12px', top: '139px', width: '125px', height: '127px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {senior.idPhoto ? (
              <ProfilePhoto src={senior.idPhoto} name={senior.name} alt={senior.name} />
            ) : null}
          </div>
          <div className="absolute inset-0 z-20">
            <StaticLabel text={formatName(senior)} config={config.name} className="font-black text-slate-900 uppercase" />
            <StaticLabel text={`Brgy. ${senior.barangay}`} config={config.barangay} className="font-black text-slate-900 uppercase" />
            <StaticLabel text="Pagsanjan, Laguna" config={config.city} className="font-black text-slate-900 uppercase" />
            <StaticLabel text={String(senior.age)} config={config.age} className="font-black text-slate-900" />
            <StaticLabel text={formattedDob} config={config.dob} className="font-black text-slate-900" />
            <StaticLabel text={formattedGender} config={config.gender} className="font-black text-slate-900 uppercase" />
            <StaticLabel text={new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} config={config.dateIssued} className="font-black text-slate-900" />
            <StaticLabel text={senior.oscaId || senior.id} config={config.id} className="font-black text-rose-600 tracking-tighter" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search + Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-[28rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search senior by name or OSCA ID..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-blue-600 text-sm font-extrabold">{selectedSeniors.length}</span> / {MAX_CARDS} Selected
            </div>
            {selectedSeniors.length > 0 && (
              <button
                type="button"
                onClick={clearAllSelected}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 hover:text-rose-700 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border border-rose-200/60 shadow-sm"
              >
                <Trash2 size={15} />
                Clear All Selected
              </button>
            )}
            <button
              onClick={handleBatchPrint}
              disabled={selectedSeniors.length === 0}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-systemBlue text-white font-bold text-sm hover:bg-blue-800 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Printer size={16} />
              Print Batch
            </button>
          </div>
        </div>

        {/* Selected Chips */}
        {selectedSeniors.length > 0 && (
          <div className="mb-6 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Selected for Batch Printing ({selectedSeniors.length} of {MAX_CARDS})
              </span>
              <button
                type="button"
                onClick={clearAllSelected}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} />
                Clear all selected
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSeniors.map((s, idx) => (
                <div key={s.id} className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-lg px-2.5 py-1.5 break-all group">
                  <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                  <span className="text-xs font-bold text-slate-700">{s.name}</span>
                  <button onClick={() => removeSenior(s.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-0.5 rounded transition-colors ml-1" title="Remove"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results as Responsive Cards */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:p-6">
          <TransitionWrapper isLoading={searching} skeleton={<BatchPrintSkeleton />}>
          {!searching && (
            searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map(senior => {
                const isSelected = selectedSeniors.some(s => s.id === senior.id);
                const isMaxedOut = selectedSeniors.length >= MAX_CARDS && !isSelected;

                return (
                  <div key={senior.id} className={`rounded-xl border p-5 transition-all ${isSelected ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">OSCA ID</p>
                        <p className="font-mono text-xs font-bold text-slate-600 mb-2">{senior.id}</p>
                        <p className="font-black text-slate-900 truncate tracking-tight text-sm">{senior.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{senior.barangay}</p>
                      </div>
                      <button
                        disabled={isMaxedOut}
                        onClick={() => {
                          if (isSelected) removeSenior(senior.id);
                          else addSenior(senior);
                        }}
                        className={`shrink-0 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${isSelected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-systemBlue text-white hover:bg-blue-800 shadow-sm hover:shadow-md'}`}
                      >
                        {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                        {isSelected ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchTerm ? (
            <div className="py-12 text-center text-slate-400 text-sm font-bold">No results found for "{searchTerm}"</div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm font-bold italic">Type to search for seniors...</div>
          ))}
          </TransitionWrapper>
        </div>
      </div>

      {/* On-screen ID Preview */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Batch ID Preview</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsive front/back preview, aligned for A4 print output.</p>
          </div>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest">
            Match to final print layout
          </span>
        </div>

        {selectedSeniors.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-16 text-center text-slate-400 font-bold text-sm">
            Select seniors above to generate the ID preview.
          </div>
        ) : (
          <div className="space-y-6">
            {selectedSeniors.map((senior) => (
              <div key={`preview-${senior.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm md:text-base font-black text-slate-900 truncate tracking-tight">{formatName(senior)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">ID: <span className="text-slate-700 font-mono ml-1">{senior.id}</span></p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {/* Back Card (Left) */}
                  <div className="w-full rounded-lg border border-slate-300 overflow-hidden bg-white">
                    <div className="relative w-full" style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}>
                      <img src="img/BACK.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Back ID template" />
                    </div>
                  </div>

                  {/* Front Card (Right) */}
                  <div className="w-full rounded-lg border border-slate-300 overflow-hidden bg-white">
                    <div className="relative w-full" style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}>
                      <svg viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`} className="w-full h-full block">
                        <foreignObject width={CARD_WIDTH} height={CARD_HEIGHT}>
                          {renderFrontCard(senior)}
                        </foreignObject>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print-only content: portaled to <body> so app layout (h-screen,
          overflow-hidden ancestors) can neither shrink nor clip it. Natural
          flow paginates ~4 ID rows per A4 page: 12 cards = 3 pages, one job. */}
      {createPortal(
      <div className="hidden print:block">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body * { visibility: hidden; }
            .batch-print-area, .batch-print-area * { visibility: visible; }
            .batch-print-area {
              position: static;
              width: 100%;
              display: block !important;
              padding: 0;
            }
            .batch-row {
              display: flex;
              flex-direction: row;
              justify-content: center;
              gap: 0;
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 4mm;
            }
            .batch-card {
              width: 3.5in;
              height: 2.3in;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              position: relative;
              overflow: hidden;
              border: 0.1mm solid #ccc;
            }
            .batch-card-content {
              width: 480px;
              height: 300px;
              transform: scale(calc(3.5in / 480px), calc(2.3in / 300px));
              transform-origin: top left;
              position: relative;
            }
          }
        `}</style>
        <div className="batch-print-area">
          {selectedSeniors.map(senior => {
            return (
              <div key={senior.id} className="batch-row">
                {/* Back card */}
                <div className="batch-card">
                  <div className="batch-card-content">
                    <img src="img/BACK.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                  </div>
                </div>
                {/* Front card */}
                <div className="batch-card">
                  <div className="batch-card-content">
                    {renderFrontCard(senior)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>,
      document.body
      )}
    </div>
  );
};

export default BatchPrint;
