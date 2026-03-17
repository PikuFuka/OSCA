import React, { useState, useEffect } from 'react';
import { Search, Printer, X, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { SeniorCitizen, INITIAL_ID_CONFIG, CurrentUser } from '../types';
import { seniorsAPI } from '../services/api';

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

const MAX_CARDS = 4;
const CARD_WIDTH = 480;
const CARD_HEIGHT = 300;

const BatchPrint: React.FC<BatchPrintProps> = ({ notify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SeniorCitizen[]>([]);
  const [selectedSeniors, setSelectedSeniors] = useState<SeniorCitizen[]>([]);
  const [searching, setSearching] = useState(false);

  const formatName = (senior: SeniorCitizen) => {
    const last = senior.lastName?.trim() || '';
    const first = senior.firstName?.trim() || '';
    const mid = senior.middleName?.trim() || '';
    const ext = senior.extensionName?.trim() || '';
    return [last ? `${last},` : '', first, ext, mid].filter(Boolean).join(' ') || senior.name;
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
    const config = senior.idConfig || INITIAL_ID_CONFIG;

    return (
      <div className="relative w-full h-full overflow-hidden">
        <img src="img/FRONT.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="Front ID template" />
        <div className="absolute inset-0 z-10">
          <div className="absolute" style={{ left: '12px', top: '139px', width: '125px', height: '127px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {senior.idPhoto && <img src={senior.idPhoto} className="w-full h-full object-cover" alt={senior.name} />}
          </div>
          <div className="absolute inset-0 z-20">
            <StaticLabel text={formatName(senior)} config={config.name} className="font-black text-slate-900 uppercase" />
            <StaticLabel text={`Brgy. ${senior.barangay}`} config={config.barangay} className="font-black text-slate-900 uppercase" />
            <StaticLabel text="Pagsanjan, Laguna" config={config.city} className="font-black text-slate-900 uppercase" />
            <StaticLabel text={String(senior.age)} config={config.age} className="font-black text-slate-900" />
            <StaticLabel
              text={senior.dateOfBirth
                ? new Date(senior.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                : 'N/A'}
              config={config.dob}
              className="font-black text-slate-900"
            />
            <StaticLabel text={senior.gender || ''} config={config.gender} className="font-black text-slate-900 uppercase" />
            <StaticLabel text={new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} config={config.dateIssued} className="font-black text-slate-900" />
            <StaticLabel text={senior.id} config={config.id} className="font-black text-rose-600 tracking-tighter" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Batch Print IDs</h2>
        <p className="text-slate-500 font-medium">Select up to {MAX_CARDS} seniors and print their ID cards on a single A4 page.</p>
      </div>

      {/* Search + Actions */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search senior by name or OSCA ID..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-sm font-medium text-slate-500">
              <span className="text-blue-600 font-black">{selectedSeniors.length}</span> / {MAX_CARDS} Selected
            </div>
            <button
              onClick={handleBatchPrint}
              disabled={selectedSeniors.length === 0}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
            >
              <Printer size={18} />
              Print Batch
            </button>
          </div>
        </div>

        {/* Selected Chips */}
        {selectedSeniors.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {selectedSeniors.map((s, idx) => (
              <div key={s.id} className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 break-all">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                <span className="text-sm font-bold text-slate-700">{s.name}</span>
                <button onClick={() => removeSenior(s.id)} className="text-slate-400 hover:text-rose-500 transition-colors ml-1"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Search Results as Responsive Cards */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
          {searching ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="animate-spin inline mr-2" size={20} /> Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map(senior => {
                const isSelected = selectedSeniors.some(s => s.id === senior.id);
                const isMaxedOut = selectedSeniors.length >= MAX_CARDS && !isSelected;

                return (
                  <div key={senior.id} className={`rounded-2xl border p-4 transition-all ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">OSCA ID</p>
                        <p className="font-mono text-sm text-slate-700">{senior.id}</p>
                        <p className="font-black text-slate-900 truncate mt-1">{senior.name}</p>
                        <p className="text-sm text-slate-500">{senior.barangay}</p>
                      </div>
                      <button
                        disabled={isMaxedOut}
                        onClick={() => {
                          if (isSelected) removeSenior(senior.id);
                          else addSenior(senior);
                        }}
                        className={`shrink-0 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
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
            <div className="p-8 text-center text-slate-400">No results found for "{searchTerm}"</div>
          ) : (
            <div className="p-8 text-center text-slate-400 italic">Type to search for seniors...</div>
          )}
        </div>
      </div>

      {/* On-screen ID Preview */}
      <div className="print:hidden bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Batch ID Preview</h3>
            <p className="text-sm text-slate-500">Responsive front/back preview, aligned for A4 print output.</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">
            Match to final print layout
          </span>
        </div>

        {selectedSeniors.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-400">
            Select seniors above to generate the ID preview.
          </div>
        ) : (
          <div className="space-y-4">
            {selectedSeniors.map((senior) => (
              <div key={`preview-${senior.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                <div className="mb-2 px-1 flex items-center justify-between gap-2">
                  <p className="text-xs md:text-sm font-black text-slate-700 truncate">{formatName(senior)}</p>
                  <p className="text-[10px] md:text-xs font-mono text-slate-500">ID: {senior.id}</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="w-full rounded-lg border border-slate-300 overflow-hidden bg-white">
                    <div className="relative w-full" style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}>
                      <img src="img/BACK.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Back ID template" />
                    </div>
                  </div>
                  <div className="w-full rounded-lg border border-slate-300 bg-white overflow-x-auto">
                    <div className="relative mx-auto" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
                      <div className="absolute inset-0">
                        {renderFrontCard(senior)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print-only content */}
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
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              padding: 0;
              gap: 2mm;
            }
            .batch-row {
              display: flex;
              flex-direction: row;
              gap: 0;
            }
            .batch-card {
              width: 85.6mm;
              height: 53.98mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              position: relative;
              overflow: hidden;
              border: 0.1mm solid #ccc;
            }
            .batch-card-content {
              width: 480px;
              height: 300px;
              transform: scale(calc(85.6mm / 480px));
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
      </div>
    </div>
  );
};

export default BatchPrint;
