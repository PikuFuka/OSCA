import React from 'react';
import { MapPin } from 'lucide-react';
import { BARANGAYS } from '../types';

interface AddressTabProps {
  formData: any;
  setFormData: any;
}

const AddressTab: React.FC<AddressTabProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 text-blue-900 mb-6">
        <MapPin size={24} />
        <h3 className="text-xl font-black">Address & Contact</h3>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Street Address *</label>
        <input type="text" placeholder="House No., Street Name" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
          value={formData.streetAddress} onChange={e => setFormData({...formData, streetAddress: e.target.value})} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Barangay</label>
          <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none"
            value={formData.barangay} onChange={e => setFormData({...formData, barangay: e.target.value})}>
            {BARANGAYS.map((brgy: string) => <option key={brgy} value={brgy}>{brgy}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Phone Number *</label>
          <input
            type="tel"
            placeholder="09xx-xxx-xxxx"
            maxLength={11}
            pattern="[0-9]{11}"
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
            value={formData.contactNumber}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              setFormData({...formData, contactNumber: digits});
            }}
          />
          <p className="text-[10px] text-slate-400 font-bold pl-2">Enter 11 digits (e.g., 09XXXXXXXXX)</p>
        </div>
      </div>
    </div>
  );
};
export default AddressTab;