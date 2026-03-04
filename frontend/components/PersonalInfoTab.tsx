import React from 'react';
import { User, SearchCheck, Wallet } from 'lucide-react';
import { BARANGAYS } from '../types';

interface PersonalInfoTabProps {
  formData: any;
  setFormData: any;
  applicantType: string;
  isSeniorRole: boolean;
  isMatchFound: boolean;
  lookupLoading: boolean;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ formData, setFormData, applicantType, isSeniorRole, isMatchFound, lookupLoading }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-blue-900">
          <User size={24} />
          <h3 className="text-xl font-black">Personal Information</h3>
        </div>
        {(isMatchFound || isSeniorRole) && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 animate-in zoom-in-95">
            <SearchCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isSeniorRole ? 'Linked' : 'Match Found'}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">OSCA ID Number</label>
          <div className="flex items-center gap-3">
            <input type="text" readOnly={applicantType === 'new' || isSeniorRole} disabled={applicantType === 'new' || isSeniorRole} maxLength={4}
              className={`w-full text-4xl font-black tracking-widest bg-transparent border-none outline-none ${applicantType === 'new' || isSeniorRole ? 'text-blue-900 opacity-60' : 'text-emerald-700'}`}
              value={formData.oscaId} onChange={e => setFormData({...formData, oscaId: e.target.value.replace(/\D/g,'')})} />
            {lookupLoading && (
              <div className="w-6 h-6 border-2 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
            )}
          </div>
          <p className="text-xs text-slate-400 font-bold mt-2">{isSeniorRole ? 'ID locked to your profile.' : applicantType === 'new' ? 'Sequentially generated from last record.' : 'Enter 4-digit ID (e.g., 0001)'}</p>
        </div>
        
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
            <Wallet size={12} /> Pension Category
          </label>
          <select 
            className="w-full text-xl font-black bg-transparent border-none outline-none text-slate-800 cursor-pointer mt-1"
            value={formData.pensionStatus}
            onChange={e => setFormData({...formData, pensionStatus: e.target.value})}
          >
            <option value="None">None</option>
            <option value="Indigent">Indigent</option>
            <option value="Pensioner">Pensioner</option>
            <option value="National Social Pensioner">National Social Pensioner</option>
            <option value="Local Social Pensioner">Local Social Pensioner</option>
          </select>
          <p className="text-xs text-slate-400 font-bold mt-3">
            All categories must provide Family Composition data.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Last Name *</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700"
            value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">First Name *</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700"
            value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Middle Name</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700"
            value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Extension (Jr, Sr, etc.)</label>
          <select
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 cursor-pointer"
            value={formData.extensionName}
            onChange={e => setFormData({...formData, extensionName: e.target.value})}
          >
            <option value="">None</option>
            <option value="Jr.">Jr.</option>
            <option value="Sr.">Sr.</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Birth Date *</label>
          <input type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold text-slate-700"
            value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Age</label>
          <input type="text" readOnly className="w-full px-6 py-4 rounded-2xl bg-slate-100 border border-slate-200 font-black text-slate-700 cursor-not-allowed" value={formData.age} />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Sex *</label>
            <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 cursor-pointer"
                value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Place of Birth</label>
          <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
            value={formData.placeOfBirth} onChange={e => setFormData({...formData, placeOfBirth: e.target.value})} />
        </div>
      </div>
    </div>
  );
};
export default PersonalInfoTab;