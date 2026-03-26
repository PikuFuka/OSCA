import React from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { FamilyMember, SeniorCitizen } from '../types';

interface FamilyTabProps {
  formData: Partial<SeniorCitizen>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  tempMember: FamilyMember;
  setTempMember: React.Dispatch<React.SetStateAction<FamilyMember>>;
  addFamilyMember: () => void;
  removeFamilyMember: (index: number) => void;
}

const FamilyTab: React.FC<FamilyTabProps> = ({ formData, setFormData, tempMember, setTempMember, addFamilyMember, removeFamilyMember }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="flex flex-col md:flex-row gap-4 justify-between items-end mb-4">
         <div>
            <h3 className="text-2xl font-black text-slate-900">Household Census</h3>
            <p className="text-slate-500 font-medium">Please list all persons living inside the house.</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Total Members</span>
              <span className="text-2xl font-black text-blue-900">{formData.familyMembers?.length || 0}</span>
            </div>
         </div>
       </div>
       
       <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="relative z-10">
             <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 mb-6 border-b border-slate-50 pb-4">
                <Plus size={16} className="text-blue-600" /> Add Household Member
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Juan Dela Cruz" value={tempMember.name} onChange={e => setTempMember({...tempMember, name: e.target.value})} />
                </div>
                <div className="md:col-span-3 space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Relationship</label>
                   <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all cursor-pointer"
                      value={tempMember.relationship} onChange={e => setTempMember({...tempMember, relationship: e.target.value})} >
                      <option value="">Select...</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Parent">Parent</option>
                      <option value="Grandchild">Grandchild</option>
                      <option value="Other">Other</option>
                   </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Age</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all placeholder:text-slate-300"
                      placeholder="0" type="number" value={tempMember.age} onChange={e => setTempMember({...tempMember, age: e.target.value})} />
                </div>
                <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Civil Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all cursor-pointer"
                      value={tempMember.civilStatus} onChange={e => setTempMember({...tempMember, civilStatus: e.target.value})} >
                      <option value="">Select...</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                   </select>
                </div>
                <div className="md:col-span-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Occupation</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Work / Job" value={tempMember.occupation} onChange={e => setTempMember({...tempMember, occupation: e.target.value})} />
                </div>
                <div className="md:col-span-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Monthly Income</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Amount" value={tempMember.income} onChange={e => setTempMember({...tempMember, income: e.target.value})} />
                </div>
                <div className="md:col-span-4 flex items-end">
                   <button type="button" onClick={addFamilyMember} className="w-full bg-systemBlue hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 mb-[1px]">
                      <Plus size={18} /> Add to Roster
                   </button>
                </div>
             </div>
          </div>
       </div>
       
       <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Current Household Roster</h4>
          {formData.familyMembers && formData.familyMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {formData.familyMembers.map((member: FamilyMember, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-black text-lg border border-blue-100">{member.name.charAt(0)}</div>
                      <div>
                         <h5 className="font-bold text-slate-900 text-lg">{member.name}</h5>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide">{member.relationship}</span>
                            <span className="text-xs text-slate-400 font-bold">• {member.age} years old</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 md:ml-auto border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                      <button onClick={() => removeFamilyMember(idx)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-xl transition-all ml-auto md:ml-0 shadow-sm"><Trash2 size={18} /></button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100"><Users size={32} className="text-slate-300" /></div>
               <p className="font-bold text-slate-400">No members added yet</p>
               <p className="text-xs text-slate-400 mt-1 max-w-[250px] text-center">Use the form above to add everyone living in the house to the census roster.</p>
            </div>
          )}
       </div>
    </div>
  );
};
export default FamilyTab;