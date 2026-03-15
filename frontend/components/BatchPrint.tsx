import React, { useState, useEffect } from 'react';
import { Search, Printer, X, Loader2 } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Batch Print IDs</h2>
        <p className="text-slate-500 font-medium">Select up to {MAX_CARDS} seniors and print their ID cards on a single A4 page.</p>
      </div>

      {/* Search + Table + Actions */}
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

        {/* Table Results */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                <th className="p-4 w-12 text-center">Select</th>
                <th className="p-4">OSCA ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Barangay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {searching ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <Loader2 className="animate-spin inline mr-2" size={20} /> Searching...
                  </td>
                </tr>
              ) : searchResults.length > 0 ? (
                searchResults.map(senior => {
                  const isSelected = selectedSeniors.some(s => s.id === senior.id);
                  const isMaxedOut = selectedSeniors.length >= MAX_CARDS && !isSelected;
                  
                  return (
                    <tr 
                      key={senior.id} 
                      className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isMaxedOut}
                          onChange={() => {
                            if (isSelected) {
                              removeSenior(senior.id);
                            } else {
                              addSenior(senior);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-600">{senior.id}</td>
                      <td className="p-4 font-bold text-slate-900">{senior.name}</td>
                      <td className="p-4 text-slate-600">{senior.barangay}</td>
                    </tr>
                  )
                })
              ) : searchTerm ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No results found for "{searchTerm}"
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                    Type to search for seniors...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            const config = senior.idConfig || INITIAL_ID_CONFIG;
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
                    <img src="img/FRONT.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                    <div className="absolute inset-0 z-10">
                      {/* Photo */}
                      <div className="absolute" style={{ left: '12px', top: '139px', width: '125px', height: '127px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {senior.idPhoto && <img src={senior.idPhoto} className="w-full h-full object-cover" alt="" />}
                      </div>
                      {/* Labels */}
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
