
import React, { useState, useEffect } from 'react';
import { 
  User, Save, MapPin, FileText, 
  ArrowRight, ArrowLeft, CheckCircle,
  Calendar, Phone, Home, CreditCard,
  UserPlus, UserCheck, HeartPulse, FileCheck, AlertCircle,
  SearchCheck, Users, Plus, Trash2, GraduationCap, Briefcase, Banknote,
  Wallet, Sparkles, Home as HomeIcon, UploadCloud, Paperclip, File as FileIcon,
  Lock, Eye, EyeOff, Clock, RefreshCw
} from 'lucide-react';
import { BARANGAYS, CurrentUser } from '../types';
import { seniorsAPI, requestsAPI, authAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

interface FormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  currentUser?: CurrentUser;
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

type ApplicationMode = 'selection' | 'form';
type ApplicantType = 'new' | 'existing';

interface FamilyMember {
  name: string;
  relationship: string;
  age: string;
  civilStatus: string;
  education: string;
  occupation: string;
  income: string;
}

type UppercaseFormField =
  | 'oscaId'
  | 'lastName'
  | 'firstName'
  | 'middleName'
  | 'placeOfBirth'
  | 'streetAddress'
  | 'rrn'
  | 'nationalId'
  | 'mothersMaidenName'
  | 'emergencyName';

const AddMemberForm: React.FC<FormProps> = ({ onSuccess, onCancel, currentUser, notify }) => {
  const [mode, setMode] = useState<ApplicationMode>('selection');
  const [applicantType, setApplicantType] = useState<ApplicantType>('new');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Confirmation state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Recent accounts state
  const [recentSeniors, setRecentSeniors] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const isPublicUser = !currentUser;
  const isSeniorRole = currentUser?.role === 'Senior';

  const fetchRecentSeniors = async () => {
    if (isPublicUser) return;
    setLoadingRecent(true);
    try {
      // Get most recent pending or newly created seniors
      const response = await seniorsAPI.getAll({ per_page: 5, fresh: true });
      const seniors = response.data || response || [];
      // Sort by joinedDate desc since the API might not support it yet
      const sorted = [...seniors].sort((a, b) => 
        new Date(b.joinedDate || 0).getTime() - new Date(a.joinedDate || 0).getTime()
      );
      setRecentSeniors(sorted.slice(0, 5));
    } catch (error) {
      // Silent fail on fetch
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    if (mode === 'selection' && !isPublicUser) {
      fetchRecentSeniors();
    }
  }, [mode, isPublicUser]);
  
  const [formData, setFormData] = useState({
    oscaId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    extensionName: '',
    dateOfBirth: '',
    age: '',
    sex: 'Male', // Default
    placeOfBirth: '',
    streetAddress: '',
    barangay: BARANGAYS[0],
    contactNumber: '',
    pensionStatus: 'Indigent', // Default
    rrn: '',
    nationalId: '',
    mothersMaidenName: '',
    emergencyName: '',
    emergencyContact: '',
    // Password for senior portal access
    password: '',
    confirmPassword: '',
    // Family Members only
    familyMembers: [] as FamilyMember[]
  });

  // Actual file objects for upload
  const [actualFiles, setActualFiles] = useState<{ [key: string]: File | null }>({
    birthCert: null,
    cedula: null,
    idPicture: null,
    brgyCert: null
  });

  // Mock state for file uploads (just storing filenames for UI)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string | null }>({
    birthCert: null,
    cedula: null,
    idPicture: null,
    brgyCert: null
  });

  // Temporary state for adding a family member
  const [tempMember, setTempMember] = useState<FamilyMember>({
    name: '', relationship: '', age: '', civilStatus: '', education: '', occupation: '', income: ''
  });

  const passwordHasMin = formData.password.length >= 8;
  const passwordHasNumber = /[0-9]/.test(formData.password);
  const passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);

  const normalizeUppercaseValue = (value: string) => value.toUpperCase();

  const setUppercaseFormField = (field: UppercaseFormField, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: normalizeUppercaseValue(value)
    }));
  };

  // Initialization Logic
  useEffect(() => {
    const initializeForm = async () => {
      if (isSeniorRole) {
        setMode('form');
        setApplicantType('existing');
        setFormData(prev => ({ ...prev, oscaId: currentUser.id }));
        
        // Fetch from API for Senior role
        try {
          const data = await seniorsAPI.getById(currentUser.id as any);
          if (data && (data.id || data.oscaId)) {
            setIsMatchFound(true);
            populateFormDataFromApi(data);
          }
        } catch (error) {
          // Silent fail on API fetch
        }
      } else if (isPublicUser) {
        setMode('form');
        setApplicantType('new');
        resetFormForNewApplicant();
      }
    };
    
    initializeForm();
  }, [currentUser]);

  // Helper to clear personal data when ID is removed/invalid in existing mode
  const clearPersonalData = () => {
    setFormData(prev => ({
      ...prev,
      lastName: '',
      firstName: '',
      middleName: '',
      extensionName: '',
      dateOfBirth: '',
      age: '',
      placeOfBirth: '',
      streetAddress: '',
      // barangay: BARANGAYS[0], // Optional: keep or reset
      contactNumber: '',
      rrn: '',
      nationalId: '',
      mothersMaidenName: '',
      emergencyName: '',
      emergencyContact: '',
      familyMembers: []
    }));
  };

  // State for lookup loading
  const [lookupLoading, setLookupLoading] = useState(false);

  // Auto-population logic for Admin/Staff typing ID - uses database
  useEffect(() => {
    if (isSeniorRole) return; 
    if (applicantType !== 'existing') return;

    // Debounce and fetch from database when ID is complete (e.g., 4+ chars or year-format)
    const fetchSeniorByOscaId = async (oscaId: string) => {
      if (!oscaId || oscaId.length < 1) {
        setIsMatchFound(false);
        clearPersonalData();
        return;
      }

      setLookupLoading(true);
      try {
        const data = await seniorsAPI.getById(oscaId as any);
        if (data && (data.id || data.oscaId)) {
          setIsMatchFound(true);
          populateFormDataFromApi(data);
        } else {
          setIsMatchFound(false);
          clearPersonalData();
        }
      } catch (error) {
        setIsMatchFound(false);
        clearPersonalData();
      } finally {
        setLookupLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSeniorByOscaId(formData.oscaId);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.oscaId, applicantType, isSeniorRole]);

  // Populate form data from API response (database)
  const populateFormDataFromApi = (data: any) => {
    setFormData(prev => ({
      ...prev,
      firstName: normalizeUppercaseValue(data.firstName || data.first_name || ''),
      middleName: normalizeUppercaseValue(data.middleName || data.middle_name || ''),
      lastName: normalizeUppercaseValue(data.lastName || data.last_name || ''),
      extensionName: data.extensionName || data.extension_name || '',
      barangay: data.barangay || prev.barangay,
      dateOfBirth: data.dateOfBirth || data.date_of_birth || '',
      age: data.age?.toString() || '',
      sex: data.sex || data.gender || 'Male',
      placeOfBirth: normalizeUppercaseValue(data.placeOfBirth || data.place_of_birth || ''),
      streetAddress: normalizeUppercaseValue(data.streetAddress || data.street_address || ''),
      contactNumber: data.contactNumber || data.contact_number || '',
      pensionStatus: data.pensionStatus || data.pension_status || 'Indigent',
      rrn: normalizeUppercaseValue(data.rrn || ''),
      nationalId: normalizeUppercaseValue(data.nationalId || data.national_id || ''),
      mothersMaidenName: normalizeUppercaseValue(data.mothersMaidenName || data.mothers_maiden_name || ''),
      emergencyName: normalizeUppercaseValue(data.emergencyName || data.emergency_name || ''),
      emergencyContact: data.emergencyContact || data.emergency_contact || '',
      familyMembers: data.familyMembers || []
    }));

    // Populate existing documents
    if (data.documents && Array.isArray(data.documents)) {
      const newUploadedFiles = { ...uploadedFiles };
      data.documents.forEach((doc: any) => {
        const type = doc.type || doc.document_type;
        if (type in newUploadedFiles) {
          newUploadedFiles[type as keyof typeof uploadedFiles] = doc.fileName || doc.file_name;
        }
      });
      setUploadedFiles(newUploadedFiles);
    }
  };

  const resetFormForNewApplicant = () => {
    setFormData({ 
      oscaId: '',
      lastName: '',
      firstName: '',
      middleName: '',
      extensionName: '',
      dateOfBirth: '',
      age: '',
      sex: 'Male',
      placeOfBirth: '',
      streetAddress: '',
      barangay: BARANGAYS[0],
      contactNumber: '',
      pensionStatus: 'Indigent',
      rrn: '',
      nationalId: '',
      mothersMaidenName: '',
      emergencyName: '',
      emergencyContact: '',
      password: '',
      confirmPassword: '',
      familyMembers: []
    });
  };

  useEffect(() => {
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age >= 0 ? age.toString() : '' }));
    }
  }, [formData.dateOfBirth]);

  const handleStart = (type: ApplicantType) => {
    setApplicantType(type);
    setMode('form');
    setStep(1);
    setErrors([]);
    if (type === 'new') {
      resetFormForNewApplicant();
    } else {
      setFormData({
        oscaId: '', lastName: '', firstName: '', middleName: '', extensionName: '',
        dateOfBirth: '', age: '', sex: 'Male', placeOfBirth: '', streetAddress: '', barangay: BARANGAYS[0],
        contactNumber: '', rrn: '', nationalId: '', mothersMaidenName: '',
        emergencyName: '', emergencyContact: '', pensionStatus: 'Indigent',
        password: '', confirmPassword: '',
        familyMembers: []
      });
      setIsMatchFound(false);
    }
  };

  const addFamilyMember = () => {
    if (!tempMember.name || !tempMember.relationship) {
      notify("Name and Relationship are required for family members.", "warning");
      return;
    }

    const normalizedMember = {
      ...tempMember,
      name: normalizeUppercaseValue(tempMember.name),
      education: normalizeUppercaseValue(tempMember.education),
      occupation: normalizeUppercaseValue(tempMember.occupation)
    };

    setFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, normalizedMember]
    }));
    setTempMember({ name: '', relationship: '', age: '', civilStatus: '', education: '', occupation: '', income: '' });
  };

  const removeFamilyMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActualFiles(prev => ({ ...prev, [key]: file }));
      setUploadedFiles(prev => ({ ...prev, [key]: file.name }));
      notify(`${key === 'idPicture' ? 'Photo' : 'Document'} uploaded successfully.`, "success");
    }
  };

  const validateStep = (currentStep: number): string[] => {
    const newErrors: string[] = [];
    if (currentStep === 1) {
      if (applicantType === 'existing' && !formData.oscaId.trim()) newErrors.push("OSCA ID is required");
      if (!formData.lastName.trim()) newErrors.push("Last Name is required");
      if (!formData.firstName.trim()) newErrors.push("First Name is required");
      if (!formData.dateOfBirth) newErrors.push("Date of Birth is required");
    } else if (currentStep === 2) {
      if (!formData.streetAddress.trim()) newErrors.push("Street Address is required");
      if (!formData.contactNumber.trim()) newErrors.push("Contact Number is required");
      else if (formData.contactNumber.replace(/\D/g, '').length !== 11) newErrors.push("Contact Number must be exactly 11 digits");
    } else if (currentStep === 3) {
      // Step 3 (Family) - No mandatory validation, user can proceed if living alone.
    } else if (currentStep === 4) {
      // Step 4 (Docs) - RRN and National ID are now optional
      // Password validation for new applicants
      if (applicantType === 'new') {
        if (!formData.password.trim()) {
          newErrors.push("Password is required");
        } else {
          if (formData.password.length < 8) newErrors.push("Password must be at least 8 characters");
          if (!/[0-9]/.test(formData.password)) newErrors.push("Password must contain at least one number");
          if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) newErrors.push("Password must contain at least one special character");
        }
        if (!formData.confirmPassword.trim()) newErrors.push("Please confirm your password");
        else if (formData.password !== formData.confirmPassword) newErrors.push("Passwords do not match");
      }
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault(); 
    const newErrors = validateStep(step);
    if (newErrors.length === 0) {
      setStep(prev => Math.min(prev + 1, 5));
      setErrors([]);
      window.scrollTo(0, 0);
    } else {
      const summary = newErrors.slice(0, 3).join(' • ');
      notify(`Please fix the following: ${summary}${newErrors.length > 3 ? ' ...' : ''}`, "error");
      window.scrollTo(0, 0);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 1 && onCancel && isPublicUser) {
      onCancel();
    } else {
      setStep(prev => Math.max(prev - 1, 1));
      setErrors([]);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsConfirmOpen(false);
    setLoading(true);

    try {
      // Filter out null files
      const filesToUpload: { [key: string]: File } = {};
      Object.entries(actualFiles).forEach(([key, val]) => {
        if (val instanceof File) {
          filesToUpload[key] = val;
        }
      });

      if (isPublicUser) {
        // Public registration — uses Axios instance in authAPI
        await authAPI.register(formData, filesToUpload);
      } else {
        // Staff/Admin or Senior Update
        if (applicantType === 'existing' && isMatchFound) {
          // Existing member update → goes through approval flow, no duplicate created
          await requestsAPI.submitUpdate(formData, filesToUpload);
        } else {
          // New member registration
          await seniorsAPI.create(formData, filesToUpload);
        }
      }

      onSuccess();
      const msg = isPublicUser 
        ? 'Application submitted! Your OSCA ID will be assigned upon approval.'
        : 'Application successfully processed!';
      notify(msg, "success");
    } catch (error: any) {
      notify(error.message || 'Failed to submit application. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to create FormData for multipart upload
  const createFormData = (data: any, files: { [key: string]: File }) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      // Skip confirmPassword - not needed on backend
      if (key === 'confirmPassword') return;
      
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, String(value));
        }
      }
    });
    Object.entries(files).forEach(([key, file]) => {
      fd.append(key, file);
    });
    return fd;
  };

  // ... (ProgressStep, ReviewField, FileUploadField components remain same, omitting for brevity as they are unchanged)
  const ProgressStep = ({ num, title, isActive, isCompleted }: any) => (
    <div className={`flex items-center shrink-0`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all shrink-0
        ${isActive ? 'bg-blue-900 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50' : 
          isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {isCompleted ? <CheckCircle size={14} /> : num}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.1em] hidden xl:block ml-2 whitespace-nowrap transition-colors
        ${isActive ? 'text-blue-900' : 'text-slate-300'}`}>
        {title}
      </span>
      {title !== 'REVIEW' && <div className="w-4 md:w-6 lg:w-8 h-[2px] bg-slate-100 mx-2 md:mx-3 shrink-0"></div>}
    </div>
  );

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
  
  const FileUploadField = ({ label, id, accept, value, onChange }: any) => (
    <div className="relative group">
      <label htmlFor={id} className="block w-full cursor-pointer">
        <div className={`h-24 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center
          ${value ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'}`}>
          {value ? (
             <FileIcon className="text-emerald-500 mb-1" size={24} />
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

  if (mode === 'selection') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Select Application Type</h2>
          <p className="text-slate-500 font-medium text-lg">Please choose the registration category to proceed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => handleStart('new')} className="group relative bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-900 transition-all text-left shadow-xl shadow-slate-100 hover:shadow-2xl hover:shadow-blue-900/10">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-900 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><UserPlus size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-900 transition-colors">New Applicant</h3>
            <p className="text-slate-500 font-medium leading-relaxed">For senior citizens applying for their OSCA ID for the first time.</p>
          </button>
          <button onClick={() => handleStart('existing')} className="group relative bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-600 transition-all text-left shadow-xl shadow-slate-100 hover:shadow-2xl hover:shadow-emerald-900/10">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><UserCheck size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">Existing Applicant</h3>
            <p className="text-slate-500 font-medium leading-relaxed">For replacement or updates. Input the existing OSCA ID.</p>
          </button>
        </div>

        {/* Recently Created Accounts Section (Only for Admin/Staff) */}
        {!isPublicUser && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recently Created Accounts</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live monitoring of system entries</p>
                </div>
              </div>
              <button 
                onClick={fetchRecentSeniors}
                className="p-2 text-slate-400 hover:text-blue-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                title="Refresh List"
              >
                <RefreshCw size={18} className={loadingRecent ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-medium">
                <thead>
                  <tr className="bg-white text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-50">
                    <th className="px-10 py-5">Full Name</th>
                    <th className="px-10 py-5">Barangay</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5 text-right">Date Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingRecent ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-10 py-5"><div className="h-4 w-32 bg-slate-100 rounded"></div></td>
                        <td className="px-10 py-5"><div className="h-4 w-24 bg-slate-50 rounded"></div></td>
                        <td className="px-10 py-5"><div className="h-4 w-16 bg-slate-50 rounded-full"></div></td>
                        <td className="px-10 py-5 text-right"><div className="h-4 w-20 bg-slate-50 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : recentSeniors.length > 0 ? (
                    recentSeniors.map((senior) => (
                      <tr key={senior.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center text-[10px] font-black border border-blue-100 overflow-hidden">
                              {senior.idPhoto ? (
                                <img src={senior.idPhoto} alt={senior.name} className="w-full h-full object-cover" />
                              ) : (
                                senior.name?.split(' ').map((n: string) => n[0]).join('')
                              )}
                            </div>
                            <span className="text-slate-900 font-bold">{senior.name}</span>
                          </div>
                        </td>
                        <td className="px-10 py-5 text-slate-500 text-sm">{senior.barangay}</td>
                        <td className="px-10 py-5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            senior.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                            senior.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {senior.status}
                          </span>
                        </td>
                        <td className="px-10 py-5 text-right text-slate-400 text-xs font-bold">
                          {senior.joinedDate}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-10 py-12 text-center text-slate-400 font-bold text-sm">
                        No recent entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Refined Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-1 relative">
            {!isPublicUser && !isSeniorRole && (
               <button onClick={() => setMode('selection')} className="absolute left-0 lg:static text-slate-300 hover:text-slate-600 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isSeniorRole ? 'Update Profile' : (applicantType === 'new' ? 'New Registration' : 'Update Record')}
            </h2>
          </div>
          <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            {step === 5 ? 'Review & Finalize' : `Step ${step} of 5: ${step === 1 ? 'Identity' : step === 2 ? 'Location' : step === 3 ? 'Family' : 'Documents'}`}
          </p>
        </div>
        
        <div className="flex justify-center lg:justify-end">
          <div className="flex items-center bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm w-fit transition-all">
            <ProgressStep num={1} title="IDENTITY" isActive={step === 1} isCompleted={step > 1} />
            <ProgressStep num={2} title="LOCATION" isActive={step === 2} isCompleted={step > 2} />
            <ProgressStep num={3} title="FAMILY" isActive={step === 3} isCompleted={step > 3} />
            <ProgressStep num={4} title="DOCS" isActive={step === 4} isCompleted={step > 4} />
            <ProgressStep num={5} title="REVIEW" isActive={step === 5} isCompleted={false} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-10">
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700">
              <p className="text-xs font-black uppercase tracking-widest mb-2">Please fix the following:</p>
              <ul className="text-sm font-semibold space-y-1 list-disc list-inside">
                {errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {errors.length > 5 && <li>...and more</li>}
              </ul>
            </div>
          )}
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
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
              
              {/* Fields ... (Rest of Step 1 form structure) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(applicantType === 'existing' || isSeniorRole) ? (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">OSCA ID Number</label>
                  <div className="flex items-center gap-3">
                    <input type="text" readOnly={isSeniorRole} disabled={isSeniorRole}
                      className={`w-full text-4xl font-black tracking-widest bg-transparent border-none outline-none ${isSeniorRole ? 'text-blue-900 opacity-60' : 'text-emerald-700'}`}
                      value={formData.oscaId} onChange={e => setUppercaseFormField('oscaId', e.target.value)} />
                    {lookupLoading && (
                      <div className="w-6 h-6 border-2 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-2">{isSeniorRole ? 'ID locked to your profile.' : 'Enter the OSCA ID to look up an existing member.'}</p>
                </div>
                ) : (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2 block">OSCA ID Number</label>
                  <p className="text-lg font-black text-blue-900 mt-1">Assigned upon approval</p>
                  <p className="text-xs text-blue-400 font-bold mt-2">The admin will assign an OSCA ID when this application is approved.</p>
                </div>
                )}
                
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
                    value={formData.lastName} onChange={e => setUppercaseFormField('lastName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">First Name *</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700"
                    value={formData.firstName} onChange={e => setUppercaseFormField('firstName', e.target.value)} />
                </div>
              </div>
              {/* ... Other Step 1 inputs ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Middle Name</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700"
                    value={formData.middleName} onChange={e => setUppercaseFormField('middleName', e.target.value)} />
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
                    value={formData.placeOfBirth} onChange={e => setUppercaseFormField('placeOfBirth', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 text-blue-900 mb-6">
                <MapPin size={24} />
                <h3 className="text-xl font-black">Address & Contact</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Street Address *</label>
                <input type="text" placeholder="House No., Street Name" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700"
                  value={formData.streetAddress} onChange={e => setUppercaseFormField('streetAddress', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Barangay</label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none"
                    value={formData.barangay} onChange={e => setFormData({...formData, barangay: e.target.value})}>
                    {BARANGAYS.map(brgy => <option key={brgy} value={brgy}>{brgy}</option>)}
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
          )}

          {/* STEP 3: FAMILY */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* ... Family code structure remains same ... */}
               <div className="flex flex-col md:flex-row gap-4 justify-between items-end mb-4">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900">Household Census</h3>
                    <p className="text-slate-500 font-medium">Please list all persons living inside the house.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Total Members</span>
                      <span className="text-2xl font-black text-blue-900">{formData.familyMembers.length}</span>
                    </div>
                 </div>
               </div>
               
               {/* "Add Member" Light Panel */}
               <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
                  <div className="relative z-10">
                     <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800 mb-6 border-b border-slate-50 pb-4">
                        <Plus size={16} className="text-blue-600" /> Add Household Member
                     </h4>
                     {/* ... Family Inputs ... */}
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                           <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all placeholder:text-slate-300"
                          placeholder="e.g. Juan Dela Cruz" value={tempMember.name} onChange={e => setTempMember({...tempMember, name: normalizeUppercaseValue(e.target.value)})} />
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
                        {/* ... rest of family inputs ... */}
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
                          placeholder="Work / Job" value={tempMember.occupation} onChange={e => setTempMember({...tempMember, occupation: normalizeUppercaseValue(e.target.value)})} />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Monthly Income</label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 outline-none transition-all placeholder:text-slate-300"
                              placeholder="Amount" value={tempMember.income} onChange={e => setTempMember({...tempMember, income: e.target.value})} />
                        </div>
                        <div className="md:col-span-4 flex items-end">
                           <button type="button" onClick={addFamilyMember} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 mb-[1px]">
                              <Plus size={18} /> Add to Roster
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Member List Rendering (Same as before) */}
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Current Household Roster</h4>
                  {formData.familyMembers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {formData.familyMembers.map((member, idx) => (
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
                                {/* ... Status/Work/Income display ... */}
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
          )}

          {/* STEP 4: DOCS */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* ... Document upload structure ... */}
               <div className="flex items-center gap-3 text-blue-900 mb-2">
                <FileText size={24} />
                <h3 className="text-xl font-black">Registry & ID Details</h3>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                 {/* ... FileUploadFields ... */}
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <FileUploadField id="birthCert" label="Birth Certificate" accept=".pdf" value={uploadedFiles.birthCert} onChange={(e: any) => handleFileChange('birthCert', e)} />
                  <FileUploadField id="cedula" label="Cedula / CTC" accept=".pdf" value={uploadedFiles.cedula} onChange={(e: any) => handleFileChange('cedula', e)} />
                  <FileUploadField id="brgyCert" label="Brgy. Residency" accept=".pdf" value={uploadedFiles.brgyCert} onChange={(e: any) => handleFileChange('brgyCert', e)} />
                  <FileUploadField id="idPicture" label="1x1 ID Picture" accept="image/*,.pdf" value={uploadedFiles.idPicture} onChange={(e: any) => handleFileChange('idPicture', e)} />
                </div>
              </div>
              {/* ... Inputs for RRN, National ID, Emergency ... */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">RRN No. (Optional)</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 outline-none"
                    value={formData.rrn} onChange={e => setUppercaseFormField('rrn', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">National ID (Optional)</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 outline-none"
                    value={formData.nationalId} onChange={e => setUppercaseFormField('nationalId', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Mother's Maiden Name</label>
                  <input type="text" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-900 transition-all font-bold text-slate-700 outline-none"
                    value={formData.mothersMaidenName} onChange={e => setUppercaseFormField('mothersMaidenName', e.target.value)} />
              </div>
              
              {/* Password Section - Only for New Applicants */}
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
                 {/* Emergency Contact */}
                <div className="flex items-center gap-2 text-rose-500 mb-2">
                  <HeartPulse size={20} />
                  <h4 className="font-black text-xs uppercase tracking-widest">Emergency Contact</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <input type="text" placeholder="Contact Name" className="w-full px-6 py-4 rounded-2xl bg-rose-50/30 border border-rose-100 font-bold text-slate-700 outline-none focus:border-rose-300"
                    value={formData.emergencyName} onChange={e => setUppercaseFormField('emergencyName', e.target.value)} />
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
          )}

          {/* STEP 5: REVIEW - Same as before */}
          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* ... Review UI ... */}
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
               {/* Review Details... omitting code for brevity, structure identical to prev */}
               <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <ReviewField label="OSCA ID" value={formData.oscaId} highlight={true} />
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
              
              {/* Files & Family Review Sections ... */}
              <div className="flex items-start gap-3 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <AlertCircle size={20} className="text-blue-900 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900/70 font-bold leading-relaxed">By submitting, you confirm that all information provided is accurate and subject to verification by OSCA Pagsanjan.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-slate-50 gap-4">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="order-2 sm:order-1 w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div className="hidden sm:block" />}

            <button 
              type={step === 5 ? "submit" : "button"} 
              onClick={step === 5 ? undefined : handleNextStep}
              disabled={loading}
              className={`order-1 sm:order-2 w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl 
                ${loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : (step === 5 ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-black')}`}>
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {step === 5 ? 'Confirm & Finalize' : (step === 4 ? 'Review Summary' : 'Next Step')}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal isOpen={isConfirmOpen} title="Finalize Registration?" variant="success" confirmLabel="Confirm Submission"
        message={isPublicUser ? "Confirm your application. You will receive a reference number shortly." : `Submit record for ${formData.firstName} to the registry?`}
        onConfirm={handleConfirmSubmit} onCancel={() => setIsConfirmOpen(false)} />
    </div>
  );
};

export default AddMemberForm;
