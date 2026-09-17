
import React, { useState, useEffect } from 'react';
import TransitionWrapper from './TransitionWrapper';
import { 
  FileSpreadsheet, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Clock,
  MapPin
} from 'lucide-react';
import { BARANGAYS } from '../types';
import { seniorsAPI, reportsAPI } from '../services/api';
import Skeleton from './Skeleton';
import { ReportSkeleton } from './skeletons';
import { TableAvatar, CategoryPill, EmptyTableRow, TablePagination, scrollMainToTop } from './Table';
interface ReportViewProps {
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    setGlobalLoading?: (loading: boolean) => void;
    initialSection?: 'masterlist' | 'centenarians' | 'deceased' | 'newly-registered';
}

const ReportView: React.FC<ReportViewProps> = ({ notify, setGlobalLoading, initialSection = 'masterlist' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBrgy, setSelectedBrgy] = useState('All Barangays');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [staticPage, setStaticPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seniorsData, setSeniorsData] = useState<any[]>([]);
  const [centenariansData, setCentenariansData] = useState<any[]>([]);
  const [deceasedData, setDeceasedData] = useState<any[]>([]);
  const [newlyRegisteredData, setNewlyRegisteredData] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'masterlist' | 'centenarians' | 'deceased' | 'newly-registered'>(initialSection);
  const itemsPerPage = 15;

  // Each tab loads only what it shows, on demand (2.2). Previously every
  // page turn re-fetched the paginated masterlist PLUS the full table
  // (per_page:-1) PLUS all deceased — MBs per click for data most tabs
  // never display.
  const brgyParam = selectedBrgy === 'All Barangays' ? undefined : selectedBrgy;

  const asList = (response: any): any[] => {
    if (response?.data) return response.data;
    return Array.isArray(response) ? response : [];
  };

  const runFetch = async (task: () => Promise<void>) => {
    setLoading(true);
    try {
      await task();
    } catch (error) {
      console.error('Failed to load report data:', error);
      notify('Unable to load report data right now. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Masterlist tab: server-paginated, the only tab that pages server-side.
  useEffect(() => {
    if (activeSection !== 'masterlist') return;
    runFetch(async () => {
      const res = await seniorsAPI.getAll({ barangay: brgyParam, page, per_page: itemsPerPage });
      const rows = asList(res);
      setSeniorsData(rows);
      setTotalPages(res?.meta?.last_page || res?.last_page || 1);
      setTotalCount(res?.meta?.total ?? res?.total ?? rows.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrgy, page, activeSection]);

  // Centenarians tab: server filters age >= 100 (indexed) instead of
  // downloading the registry and filtering client-side.
  useEffect(() => {
    if (activeSection !== 'centenarians') return;
    runFetch(async () => {
      const res = await seniorsAPI.getAll({ barangay: brgyParam, min_age: 100, per_page: 500 });
      setCentenariansData(asList(res));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrgy, activeSection]);

  // Deceased tab: small list, fetched only when visited.
  useEffect(() => {
    if (activeSection !== 'deceased') return;
    runFetch(async () => {
      const rows = asList(await seniorsAPI.getDeceased());
      setDeceasedData(
        selectedBrgy === 'All Barangays' ? rows : rows.filter((item: any) => item.barangay === selectedBrgy)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrgy, activeSection]);

  // Newly-registered tab: server returns the 30 newest (created_at desc)
  // instead of downloading everything to sort client-side.
  useEffect(() => {
    if (activeSection !== 'newly-registered') return;
    runFetch(async () => {
      const res = await seniorsAPI.getAll({
        barangay: brgyParam, sort: 'created_at', order: 'desc', per_page: 30,
      });
      setNewlyRegisteredData(asList(res));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrgy, activeSection]);

  useEffect(() => {
    scrollMainToTop();
  }, [page, staticPage]);

  useEffect(() => {
    setActiveSection(initialSection);
    setStaticPage(1);
  }, [initialSection]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const handleExcelExport = () => {
    setIsExporting(true);
    if (setGlobalLoading) setGlobalLoading(true);
    notify('Preparing your Excel report. Please wait...', 'info');
    
    try {
      // Get the download URL with authentication token and filters
      const url = reportsAPI.getSeniorCitizensReportUrl({ 
        barangay: selectedBrgy === 'All Barangays' ? undefined : selectedBrgy 
      });
      
      // Trigger download using window.location.href for better reliability than window.open
      // This won't open a new tab and will trigger the download headers immediately.
      window.location.href = url;
      
      notify(`Final Report for ${selectedBrgy} is being downloaded.`, 'success');
      
      // Reset the generating state after a short delay since location.href doesn't block
      setTimeout(() => {
        setIsExporting(false);
        if (setGlobalLoading) setGlobalLoading(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to export report:', error);
      notify('Failed to generate report. Please try again.', 'error');
      setIsExporting(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  const isDataLoading = loading;

  return (
    <TransitionWrapper isLoading={loading} skeleton={<ReportSkeleton />}>
      {!loading && (
        <div className="space-y-8 pb-12 relative">
      <div className="flex items-center justify-end gap-4 no-print">
        <button 
          onClick={handleExcelExport}
          disabled={isExporting}
          className={`py-2.5 px-6 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto ${isExporting ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
        >
          {isExporting ? <Clock className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
          <span className="hidden sm:inline">
            {isExporting ? 'GENERATING REPORT...' : 'GENERATE EXCEL REPORT'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full space-y-6">
          <div className="top-0 z-10 w-fit max-w-full bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-2 inline-flex flex-wrap items-center gap-2 shadow-sm no-print">
            <button
              type="button"
              onClick={() => { setActiveSection('masterlist'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'masterlist'
                  ? 'bg-systemBlue text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Masterlist
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('centenarians'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'centenarians'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Living Centenarians
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('newly-registered'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'newly-registered'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              New Registered
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('deceased'); setStaticPage(1); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSection === 'deceased'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Deceased Seniors
            </button>
          </div>

          {activeSection === 'masterlist' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-systemBlue/10 text-systemBlue rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Masterlist Preview</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select 
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4 text-center">Sex</th>
                    <th className="px-8 py-4 text-center">Birthday</th>
                    <th className="px-8 py-4 text-center">Age</th>
                    <th className="px-8 py-4 text-center">OSCA ID</th>
                    <th className="px-8 py-4 text-center">RRN No</th>
                    <th className="px-8 py-4 text-center">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seniorsData.length > 0 ? (
                    seniorsData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</span>
                        </td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-slate-900 tabular-nums">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Records Found" message="No masterlist records found." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={page}
                totalPages={totalPages}
                onPage={setPage}
                from={seniorsData.length ? (page - 1) * itemsPerPage + 1 : 0}
                to={(page - 1) * itemsPerPage + seniorsData.length}
                total={totalCount}
                noun="members"
              />
            )}
          </div>
          )}

          {activeSection === 'centenarians' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/10 text-purple-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Living Centenarians (100+)</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={`cent-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                  Total: {centenariansData.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4 text-center">Sex</th>
                    <th className="px-8 py-4 text-center">Birthday</th>
                    <th className="px-8 py-4 text-center">Age</th>
                    <th className="px-8 py-4 text-center">OSCA ID</th>
                    <th className="px-8 py-4 text-center">RRN No</th>
                    <th className="px-8 py-4 text-center">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centenariansData.length > 0 ? (
                    centenariansData.slice((staticPage - 1) * itemsPerPage, staticPage * itemsPerPage).map((item) => (
                      <tr key={`cent-${item.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-black text-purple-700 tabular-nums">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Centenarians Found" message="No living centenarians found for this filter." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={staticPage}
                totalPages={Math.max(1, Math.ceil(centenariansData.length / itemsPerPage))}
                onPage={setStaticPage}
                from={(staticPage - 1) * itemsPerPage + 1}
                to={Math.min(staticPage * itemsPerPage, centenariansData.length)}
                total={centenariansData.length}
                noun="centenarians"
              />
            )}
          </div>
          )}

          {activeSection === 'deceased' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/10 text-slate-700 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Deceased Seniors</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={`dec-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Total: {deceasedData.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    <th className="px-8 py-4">Full Name</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4 text-center">Sex</th>
                    <th className="px-8 py-4 text-center">Birthday</th>
                    <th className="px-8 py-4 text-center">Age</th>
                    <th className="px-8 py-4 text-center">OSCA ID</th>
                    <th className="px-8 py-4 text-center">RRN No</th>
                    <th className="px-8 py-4 text-center">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deceasedData.length > 0 ? (
                    deceasedData.slice((staticPage - 1) * itemsPerPage, staticPage * itemsPerPage).map((item) => (
                      <tr key={`dec-${item.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px]">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-bold text-slate-900 tabular-nums">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Records Found" message="No deceased records found for this filter." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={staticPage}
                totalPages={Math.max(1, Math.ceil(deceasedData.length / itemsPerPage))}
                onPage={setStaticPage}
                from={(staticPage - 1) * itemsPerPage + 1}
                to={Math.min(staticPage * itemsPerPage, deceasedData.length)}
                total={deceasedData.length}
                noun="seniors"
              />
            )}
          </div>
          )}

          {activeSection === 'newly-registered' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:overflow-visible print:border-none print:shadow-none print:m-0 print:p-0">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/10 text-emerald-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">New Registered Seniors</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <select
                    value={selectedBrgy}
                    onChange={(e) => { setSelectedBrgy(e.target.value); setPage(1); setStaticPage(1); }}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent"
                  >
                    <option>All Barangays</option>
                    {BARANGAYS.map(b => (
                      <option key={`new-${b}`} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <FileText size={14} />
                  Print List
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  Total: {newlyRegisteredData.length}
                </span>
              </div>
            </div>

            {/* Print Header for offline printing */}
            <div className="hidden print:block mb-8 mt-4 text-center">
              <h2 className="text-2xl font-black uppercase text-slate-900">New Registered Seniors</h2>
              <p className="text-sm font-bold text-slate-600 mt-1">{selectedBrgy}</p>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-[2] print:static bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    <th className="px-8 py-4 text-left print:px-2 print:py-2">Full Name</th>
                    <th className="px-8 py-4 text-left print:px-2 print:py-2">Address</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Sex</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Birthday</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Age</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">OSCA ID</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">RRN No</th>
                    <th className="px-8 py-4 text-center print:px-2 print:py-2">Pension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newlyRegisteredData.length > 0 ? (
                    newlyRegisteredData.slice((staticPage - 1) * itemsPerPage, staticPage * itemsPerPage).map((item) => (
                      <tr key={`new-${item.id}`} className="print:border-b print:border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 print:px-2 print:py-2">
                          <div className="flex items-center gap-3">
                            <span className="print:hidden"><TableAvatar name={item.name} /></span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{item.barangay || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600 truncate max-w-[200px] print:whitespace-normal print:break-words print:px-2 print:py-2">{item.streetAddress || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-semibold text-slate-600 print:px-2 print:py-2">{(item as any).sex || item.gender || '-'}</td>
                        <td className="px-8 py-5 text-center text-sm font-medium text-slate-600 print:px-2 print:py-2">{formatDate(item.dateOfBirth)}</td>
                        <td className="px-8 py-5 text-center text-sm font-black text-emerald-700 tabular-nums print:px-2 print:py-2">{item.age ?? '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-wider print:px-2 print:py-2">{item.osca_id || item.oscaId || '-'}</td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 print:px-2 print:py-2">{item.rrn || '-'}</td>
                        <td className="px-8 py-5 text-center print:px-2 print:py-2">
                          <div className="flex items-center justify-center">
                            <CategoryPill label={item.pensionStatus || 'None'} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={8} title="No Records Found" message="No newly registered records found for this filter." />
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <TablePagination
                page={staticPage}
                totalPages={Math.max(1, Math.ceil(newlyRegisteredData.length / itemsPerPage))}
                onPage={setStaticPage}
                from={(staticPage - 1) * itemsPerPage + 1}
                to={Math.min(staticPage * itemsPerPage, newlyRegisteredData.length)}
                total={newlyRegisteredData.length}
                noun="seniors"
              />
            )}
          </div>
          )}
        </div>
      </div>
    </div>
      )}
    </TransitionWrapper>
  );
};

export default ReportView;
