
import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, FileText, Phone, Calendar, HeartPulse, CreditCard,
  AlertCircle, CheckCircle, Clock, RotateCw, QrCode, Eye, EyeOff
} from 'lucide-react';
import { CurrentUser, INITIAL_ID_CONFIG } from '../types';
import { seniorsAPI } from '../services/api';
import { ProfileSkeleton } from './SkeletonLoader';

interface UserReviewProps {
  currentUser: CurrentUser;
}

// Helper components moved outside to avoid re-creation and typed correctly
const InfoGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {children}
    </div>
  </div>
);

const InfoField = ({ label, value, icon: Icon, fullWidth = false }: any) => (
  <div className={`${fullWidth ? 'md:col-span-2' : ''} group`}>
     <div className="flex items-center gap-2 mb-2 text-slate-400">
       <Icon size={14} />
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
     </div>
     <div className="py-2 border-b border-slate-100 group-hover:border-blue-100 transition-colors">
       <p className="text-base font-bold text-slate-800 break-words">{value || 'Not provided'}</p>
     </div>
  </div>
);

const StaticLabel = ({ 
  text, 
  config, 
  className = ""
}: { 
  text: string, 
  config: { x: number, y: number, fontSize: number }, 
  className?: string
}) => {
  return (
    <div 
      className={`absolute select-none whitespace-nowrap leading-none z-20 ${className}`}
      style={{ 
        left: config.x, 
        top: config.y, 
        fontSize: config.fontSize,
      }}
    >
      {text}
    </div>
  );
};

const UserReview: React.FC<UserReviewProps> = ({ currentUser }) => {
  const [isIdFlipped, setIsIdFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const data = await seniorsAPI.getById(currentUser.id as any);
        setMemberData(data);
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, [currentUser.id]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  // If user is not approved, show pending message
  if (memberData?.status !== 'Active') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="p-6 bg-amber-50 rounded-full">
          <Clock className="text-amber-500" size={48} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Application Under Review</h2>
          <p className="text-slate-500 font-medium">
            Your application is still being processed by our administrators. 
            Your digital ID and record will be available once your application is approved.
          </p>
        </div>
      </div>
    );
  }

  const idConfig = INITIAL_ID_CONFIG;

  // Real details from memberData
  const details = {
    dob: memberData.dateOfBirth || '1955-01-01',
    pob: memberData.placeOfBirth || 'Pagsanjan, Laguna',
    address: memberData.streetAddress || `Brgy. ${memberData.barangay}, Pagsanjan, Laguna`,
    contact: memberData.contactNumber || 'Not provided',
    rrn: memberData.rrn || 'N/A',
    nationalId: memberData.nationalId || 'N/A',
    mother: memberData.mothersMaidenName || 'Not provided',
    emergency: `${memberData.emergencyName || ''} (${memberData.emergencyContact || ''})`.trim() || 'Not provided',
    familyCount: memberData.familyMembers?.length || 0
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Record</h2>
          <p className="text-slate-500 font-medium">Review your registered information and digital ID.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status:</span>
           <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              memberData.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
           }`}>
             {memberData.status}
           </span>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex flex-col items-center">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Digital Identification Card</h3>
            <div 
              className="w-[480px] h-[300px] bg-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col shrink-0 print:shadow-none cursor-pointer ring-4 ring-slate-100 select-none"
              onClick={() => setIsIdFlipped(!isIdFlipped)}
            >
                {/* Hint Label */}
                <div className="absolute top-3 right-3 z-30 bg-black/60 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest pointer-events-none backdrop-blur-sm flex items-center gap-1">
                  <RotateCw size={10} /> {isIdFlipped ? 'Show Front' : 'Show Back'}
                </div>
                
                {!isIdFlipped ? (
                  <>
                    {/* FRONT LAYOUT USING IMAGE TEMPLATE */}
                    <div className="absolute inset-0 bg-[url('img/FRONT.jpg')] bg-cover bg-no-repeat bg-center z-10">
                      {/* Photo Area inside the circular watermark box */}
                      <div className="absolute [left:13px] [top:139px] [width:125px] [height:127px] overflow-hidden flex items-center justify-center">
                        {memberData.idPhoto ? (
                          <img src={memberData.idPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 opacity-10 bg-slate-200">
                            <User size={48} />
                          </div>
                        )}
                      </div>

                      {/* Values positioned using saved configuration */}
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        
                        <StaticLabel 
                          text={memberData.name} 
                          config={idConfig.name} 
                          className="font-black text-slate-900 uppercase"
                        />
                        
                        <StaticLabel 
                          text={`Brgy. ${memberData.barangay}`} 
                          config={idConfig.barangay} 
                          className="font-black text-slate-900 uppercase"
                        />
                        
                        <StaticLabel 
                          text="Pagsanjan, Laguna" 
                          config={idConfig.city} 
                          className="font-black text-slate-900 uppercase"
                        />
                        
                        <StaticLabel 
                          text={String(memberData.age)} 
                          config={idConfig.age} 
                          className="font-black text-slate-900"
                        />
                        
                        <StaticLabel 
                          text={new Date(details.dob).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                          config={idConfig.dob} 
                          className="font-black text-slate-900"
                        />
                        
                        <StaticLabel 
                          text={memberData.sex || memberData.gender} 
                          config={idConfig.gender} 
                          className="font-black text-slate-900 uppercase"
                        />
                        
                        <StaticLabel 
                          text={new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                          config={idConfig.dateIssued} 
                          className="font-black text-slate-900"
                        />

                        <StaticLabel 
                          text={memberData.id} 
                          config={idConfig.id} 
                          className="font-black text-rose-600 tracking-tighter"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* BACK LAYOUT USING IMAGE TEMPLATE - BLANK */}
                    <div className="absolute inset-0 bg-[url('img/BACK.jpg')] bg-cover bg-no-repeat bg-center z-10">
                    </div>
                  </>
                )}
            </div>
            <p className="text-sm font-bold text-slate-400 mt-4 animate-pulse flex items-center gap-2">
               <RotateCw size={16} /> Tap card to flip view
            </p>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button 
           onClick={() => setShowDetails(!showDetails)}
           className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl hover:scale-105 active:scale-95 border-2 border-slate-900"
        >
           {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
           {showDetails ? 'Hide Personal Record' : 'View Personal Record'}
        </button>
      </div>

      {showDetails && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          {/* Profile Header */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-[2rem] bg-slate-100 text-slate-400 flex items-center justify-center text-4xl font-black shrink-0 border-4 border-white shadow-lg shadow-slate-200 overflow-hidden">
                {memberData.idPhoto ? (
                  <img src={memberData.idPhoto} alt={memberData.name} className="w-full h-full object-cover" />
                ) : (
                  memberData.name.charAt(0)
                )}
            </div>
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-black text-slate-900">{memberData.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-slate-500">
                  <span className="flex items-center gap-2"><CreditCard size={16} /> ID: {memberData.id}</span>
                  <span className="flex items-center gap-2"><Calendar size={16} /> Joined: {memberData.joinedDate}</span>
                </div>
            </div>
          </div>

          <InfoGroup title="Personal Information">
            <InfoField label="Full Name" value={memberData.name} icon={User} fullWidth />
            <InfoField label="Date of Birth" value={details.dob} icon={Calendar} />
            <InfoField label="Age" value={`${memberData.age} years old`} icon={Clock} />
            <InfoField label="Gender" value={memberData.sex || memberData.gender} icon={User} />
            <InfoField label="Place of Birth" value={details.pob} icon={MapPin} />
          </InfoGroup>

          <InfoGroup title="Contact & Residence">
            <InfoField label="Street Address" value={details.address} icon={MapPin} />
            <InfoField label="Barangay" value={memberData.barangay} icon={MapPin} />
            <InfoField label="Contact Number" value={details.contact} icon={Phone} />
          </InfoGroup>

          <InfoGroup title="Official Details">
            <InfoField label="OSCA ID Number" value={memberData.id} icon={CreditCard} />
            <InfoField label="Pension Category" value={memberData.pensionStatus} icon={HeartPulse} />
            <InfoField label="National ID" value={details.nationalId} icon={CreditCard} />
            <InfoField label="RRN Number" value={details.rrn} icon={FileText} />
          </InfoGroup>

          <InfoGroup title="Family & Emergency">
            <InfoField label="Mother's Maiden Name" value={details.mother} icon={User} fullWidth />
            <InfoField label="Emergency Contact" value={details.emergency} icon={AlertCircle} fullWidth />
            <InfoField label="Household Members" value={`${details.familyCount} Registered Members`} icon={User} />
          </InfoGroup>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-2">
            <p className="text-slate-900 font-bold">Need to update your information?</p>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              If any information above is incorrect or outdated, please go to the "Update Info" section in the sidebar to submit a change request.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReview;
