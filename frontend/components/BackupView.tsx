
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Upload, AlertTriangle, CheckCircle2, RefreshCw, FileDown, FileUp, ShieldCheck, LogOut, Calendar, Archive as ArchiveIcon } from 'lucide-react';
import { backupAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import ArchiveView from './ArchiveView';

interface BackupViewProps {
    notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    initialSection?: 'backup' | 'archive';
}

const BackupView: React.FC<BackupViewProps> = ({ notify, initialSection = 'backup' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [isRefreshRequired, setIsRefreshRequired] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'backup' | 'archive'>(initialSection);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await backupAPI.exportDB();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const dateTime = now.toISOString().replace('T', '_').replace(/:/g, '-').slice(0, 19);
      a.download = `osca_backup_${dateTime}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      notify('Database export started — check your downloads.', 'success');
    } catch (error: any) {
      console.error(error); notify('Export failed.', 'error');
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'sql') {
      notify('Only .sql backup files are accepted.', 'error');
      return;
    }
    setSelectedFile(file);
  };

  const handleImportConfirm = async () => {
    if (!selectedFile) return;
    setConfirmImport(false);
    setIsImporting(true);
    try {
      const result = await backupAPI.importDB(selectedFile);
      setSelectedFile(null);
      setIsRefreshRequired(true);
    } catch (error: any) {
      console.error(error); notify('Import failed. Please check the file and try again.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="ios-page-title">Backup & Recovery</h2>
        <p className="ios-page-subtitle mt-1">Export or restore the OSCA database. Always download a backup before importing.</p>
      </div>

      <div className="ios-section flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protected Tools</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Archive access is nested here to reduce accidental record actions.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveSection('backup')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSection === 'backup' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Backup Tools
          </button>
          <button
            onClick={() => setActiveSection('archive')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSection === 'archive' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArchiveIcon size={16} /> Archive Records
          </button>
        </div>
      </div>

      {activeSection === 'archive' ? (
        <>
          <div className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Restricted Area</p>
            <p className="mt-1 text-sm font-medium text-amber-900">Restore and deceased-status correction tools are kept under Backup to lessen mistakes.</p>
          </div>
          <ArchiveView notify={notify} embedded={true} />
        </>
      ) : (
        <>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="ios-section p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <FileDown size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Export Database</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Download .SQL backup</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Downloads a full snapshot of all senior records, accounts, requests, and system logs as a <span className="font-bold text-slate-700">.sql</span> file.
          </p>

          <div className="flex-1 flex flex-col items-center justify-center py-6 select-none">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-2">
                <h4 className="text-5xl font-black text-slate-900 tracking-tighter">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                </h4>
                <div className="flex flex-col items-start text-left">
                  <span className="text-blue-600 font-black text-xl leading-none">
                    {currentTime.getSeconds().toString().padStart(2, '0')}
                  </span>
                  <span className="text-slate-400 font-black text-[10px] uppercase leading-none mt-1">
                    {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="h-px w-6 bg-gradient-to-r from-transparent to-slate-200" />
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={12} className="text-slate-300" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="h-px w-6 bg-gradient-to-l from-transparent to-slate-200" />
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${
              isExporting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-systemBlue text-white hover:bg-blue-700 shadow-blue-100'
            }`}
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Preparing Download…' : 'Export Now'}
          </button>
        </div>

        {/* Import Card */}
        <div className="ios-section p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
              <FileUp size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Restore Database</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Import .SQL backup</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
            Upload a previously exported <span className="font-bold text-slate-700">.sql</span> file to overwrite the current database and restore it to a previous state.
          </p>
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-4 ${
              selectedFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input id="backup-sql-upload" name="backupSqlFile" ref={fileInputRef} type="file" accept=".sql" className="hidden" onChange={handleFileSelect} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-800">{selectedFile.name}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">Click to select .sql file</p>
                <p className="text-[10px] text-slate-400 mt-1">Max file size: 500 MB</p>
              </>
            )}
          </div>
          <button
            onClick={() => selectedFile && setConfirmImport(true)}
            disabled={!selectedFile || isImporting}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${
              !selectedFile || isImporting ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'
            }`}
          >
            {isImporting ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
            {isImporting ? 'Restoring…' : 'Import & Restore'}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 bg-amber-50/80 border border-amber-100 rounded-2xl">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={22} />
        <div className="text-sm text-amber-900 leading-relaxed">
          <p className="font-black mb-1">Important Notice</p>
          <p>Restoring a backup will <strong>overwrite all current data</strong>, including senior records, user accounts, logs, and system settings. This action cannot be undone. Always download the latest export before proceeding with an import.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
        <ShieldCheck size={18} className="text-slate-400 shrink-0" />
        <p className="text-xs text-slate-500 font-bold">All backup operations are logged in the Activity History for audit purposes.</p>
      </div>

        </>
      )}

      <ConfirmModal
        isOpen={confirmImport}
        title="Restore Database?"
        message={`This will overwrite ALL current data with the contents of "${selectedFile?.name}". This action cannot be undone.`}
        variant="danger"
        confirmLabel="Yes, Restore Now"
        onConfirm={handleImportConfirm}
        onCancel={() => setConfirmImport(false)}
        loading={isImporting}
      />

      {/* Database Restoration Success - Forced Refresh Modal */}
      {isRefreshRequired && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[30rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-4 border-emerald-100 flex flex-col items-center">
            <div className="p-10 text-center w-full">
               <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-emerald-100 shadow-inner">
                  <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
               </div>

               <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Restore Successful!</h3>
               <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                 The database has been updated. You must <span className="text-blue-600 font-black">refresh</span> or <span className="text-blue-600 font-black">re-login</span> to synchronize the system with the new data.
               </p>

               <div className="flex flex-col gap-3">
                 <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-5 bg-systemBlue text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                 >
                    <RefreshCw size={22} className="animate-spin" />
                    Refresh & Sync System
                 </button>
                 
                 <button 
                  onClick={() => {
                    localStorage.removeItem('osca_token');
                    window.location.reload();
                  }}
                  className="w-full py-4 text-slate-400 font-bold hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
                 >
                    <LogOut size={16} /> Logout and Login Again
                 </button>
               </div>
            </div>
            
            <div className="w-full bg-slate-50 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Session Locked for Safety</span>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
};

export default BackupView;

