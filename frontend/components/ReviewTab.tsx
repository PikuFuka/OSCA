import React from 'react';
import { FileCheck, AlertCircle } from 'lucide-react';

const ReviewField = ({ label, value, fullWidth = false, highlight = false }: { label: string, value: string, fullWidth?: boolean, highlight?: boolean }) => (
  <div className={`${fullWidth ? 'col-span-2 md:col-span-4' : 'col-span-1'} space-y-1`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
    <div className={`pb-2 border-b ${highlight ? 'border-blue-200 bg-blue-50/50 px-2 rounded-t-lg mt-1' : 'border-slate-100'}`}>
      <p className={`text-sm font-bold break-words ${highlight ? 'text-blue-900' : 'text-slate-800'}`}>
        {value || <span className="text-slate-300 italic text-xs">Not provided</span>}
      </p>
    </div>
  </div>
);

interface ReviewTabProps {
  formData: any;
  applicantType: string;
}

const ReviewTab: React.FC<ReviewTabProps> = ({ formData, applicantType }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 text-blue-900">
          <FileCheck size={24} />
          <h3 className="text-xl font-black">Review Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
            formData.pensionStatus === 'Indigent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>{formData.pensionStatus}</span>
          <span className="px-3 py-1 bg-blue-900 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">{applicantType}</span>
        </div>
      </div>
       <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <ReviewField label="OSCA ID" value={formData.oscaId || 'Assigned upon approval'} highlight={true} />
          <ReviewField label="Applicant Name" value={`${formData.lastName}, ${formData.firstName} ${formData.middleName}${formData.extensionName ? ' ' + formData.extensionName : ''}`.trim()} fullWidth={true} />
          <ReviewField label="Details" value={`${formData.sex} • ${formData.age} Years Old • Born ${formData.dateOfBirth}`} />
          <ReviewField label="Mother's Maiden Name" value={formData.mothersMaidenName} fullWidth={true} />
        </div>
        <div className="space-y-6">
          <ReviewField label="Contact Info" value={formData.contactNumber} />
          <ReviewField label="Full Address" value={`${formData.streetAddress}, Brgy. ${formData.barangay}`} fullWidth={true} />
          <ReviewField label="National ID" value={formData.nationalId} />
          <ReviewField label="RRN" value={formData.rrn} />
        </div>
      </div>
      
      <div className="flex items-start gap-3 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
        <AlertCircle size={20} className="text-blue-900 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900/70 font-bold leading-relaxed">By submitting, you confirm that all information provided is accurate and subject to verification by OSCA Pagsanjan.</p>
      </div>
    </div>
  );
};
export default ReviewTab;