import React from 'react';
import { FileText, Lock, Eye, EyeOff, CheckCircle, AlertCircle, HeartPulse, UploadCloud, File as FileLucide } from 'lucide-react';

const FileUploadField = ({ label, id, accept, value, onChange }: any) => (
  <div className="relative group">
    <label htmlFor={id} className="block w-full cursor-pointer">
      <div className={`h-24 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center
        ${value ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'}`}>
        {value ? (
           <FileLucide className="text-emerald-500 mb-1" size={24} />
        ) : (
           <UploadCloud className="text-slate-300 group-hover:text-blue-400 mb-1" size={24} />
        )}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${value ? 'text-emerald-700' : 'text-slate-400 group-hover:text-blue-500'}`}>
           {label}
        </span>
        {value && <span className="text-[9px] text-emerald-600 mt-1 truncate w-full px-2">{value}</span>}
      </div>
      <input 
        type="file" 
        id={id} 
        className="hidden" 
        accept={accept}
        onChange={onChange}
      />
    </label>
  </div>
);

interface DocumentsTabProps {
  formData: any;
  setFormData: any;
  applicantType: string;
  uploadedFiles: any;
  handleFileChange: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  setShowPassword: any;
  showConfirmPassword: boolean;
  setShowConfirmPassword: any;
  passwordHasMin: boolean;
  passwordHasNumber: boolean;
  passwordHasSpecial: boolean;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
  formData, setFormData, applicantType, uploadedFiles, handleFileChange,
  showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
  passwordHasMin, passwordHasNumber, passwordHasSpecial
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="flex items-center gap-3 text-blue-900 mb-2">
        <FileText size={24} />
        <h3 className="text-xl font-black">Registry & ID Details</h3>
      </div>
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FileUploadField id="birthCert" label="Birth Certificate" accept=".pdf" value={uploadedFiles.birthCert} onChange={(e: any) => handleFileChange('birthCert', e)} />
          <FileUploadField id="cedula" label="Cedula / CTC" accept=".pdf" value={uploadedFiles.cedula} onChange={(e: any) => handleFileChange('cedula', e)} />
          <FileUploadField id="brgyCert" label="Brgy. Residency" accept=".pdf" value={uploadedFiles.brgyCert} onChange={(e: any) => handleFileChange('brgyCert', e)} />
          <FileUploadField id="idPicture" label="1x1 ID Picture" accept="image/*,.pdf" value={uploadedFiles.idPicture} onChange={(e: any) => handleFileChange('idPicture', e)} />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">RRN No. (Optional)</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 outline-none"
            value={formData.rrn} onChange={e => setFormData({...formData, rrn: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">National ID (Optional)</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 outline-none"
            value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Mother's Maiden Name</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 outline-none"
            value={formData.mothersMaidenName} onChange={e => setFormData({...formData, mothersMaidenName: e.target.value})} />
      </div>
      
      {applicantType === 'new' && (
        <div className="pt-6 border-t border-slate-50 space-y-4">
          <div className="flex items-center gap-2 text-blue-900 mb-2">
            <Lock size={20} />
            <h4 className="font-black text-xs uppercase tracking-widest">Account Password</h4>
          </div>
          <p className="text-xs text-slate-500 font-medium -mt-2 mb-4">Create a password to access your OSCA portal account. Must be at least 8 characters with a number and special character.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Password *</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Min 8 chars, 1 number, 1 special" 
                  className={`w-full px-6 py-4 pr-14 rounded-2xl bg-white border transition-all font-bold text-slate-700 outline-none ${passwordHasMin && passwordHasNumber && passwordHasSpecial ? 'border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900' : 'border-rose-300 focus:ring-4 focus:ring-rose-50 focus:border-rose-500'}`}
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="mt-2 space-y-1 text-xs font-bold pl-2">
                <div className={`flex items-center gap-1 ${passwordHasMin ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passwordHasMin ? <CheckCircle size={12} /> : <AlertCircle size={12} />} At least 8 characters
                </div>
                <div className={`flex items-center gap-1 ${passwordHasNumber ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passwordHasNumber ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Contains a number
                </div>
                <div className={`flex items-center gap-1 ${passwordHasSpecial ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passwordHasSpecial ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Contains a special character
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Confirm Password *</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Re-enter password" 
                  className={`w-full px-6 py-4 pr-14 rounded-2xl bg-white border transition-all font-bold text-slate-700 outline-none
                    ${formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-rose-300 focus:ring-4 focus:ring-rose-50 focus:border-rose-500' 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-emerald-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500'
                      : 'border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900'}`}
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-rose-500 font-bold pl-2 flex items-center gap-1">
                  <AlertCircle size={12} /> Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && passwordHasMin && passwordHasNumber && passwordHasSpecial && (
                <p className="text-xs text-emerald-600 font-bold pl-2 flex items-center gap-1">
                  <CheckCircle size={12} /> Passwords match
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="pt-6 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-2 text-rose-500 mb-2">
          <HeartPulse size={20} />
          <h4 className="font-black text-xs uppercase tracking-widest">Emergency Contact</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <input type="text" placeholder="Contact Name" className="w-full px-6 py-4 rounded-2xl bg-rose-50/30 border border-rose-100 font-bold text-slate-700 outline-none focus:border-rose-300"
            value={formData.emergencyName} onChange={e => setFormData({...formData, emergencyName: e.target.value})} />
          <input
            type="tel"
            placeholder="Contact Number"
            maxLength={11}
            pattern="[0-9]{11}"
            className="w-full px-6 py-4 rounded-2xl bg-rose-50/30 border border-rose-100 font-bold text-slate-700 outline-none focus:border-rose-300"
            value={formData.emergencyContact}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              setFormData({...formData, emergencyContact: digits});
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;