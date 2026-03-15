
export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  ADD_MEMBER = 'ADD_MEMBER',
  MEMBER_REGISTRY = 'MEMBER_REGISTRY',
  ACCOUNT = 'ACCOUNT',
  HISTORY = 'HISTORY',
  FINAL_REPORT = 'FINAL_REPORT',
  BACKUP = 'BACKUP',
  APPROVAL = 'APPROVAL',
  USER_DASHBOARD = 'USER_DASHBOARD',
  USER_REVIEW = 'USER_REVIEW',
  ARCHIVE = 'ARCHIVE',
  BATCH_PRINT = 'BATCH_PRINT'
}

export type UserRole = 'Admin' | 'Staff' | 'Senior';

export const BARANGAYS = [
  'Anibong',
  'Biñan',
  'Buboy',
  'Cabanbanan',
  'Calusiche',
  'Dingin',
  'Lambac',
  'Layugan',
  'Magdapio',
  'Maulawin',
  'Pinagsanjan',
  'Poblacion I (Barangay I)',
  'Poblacion II (Barangay II)',
  'Sabang',
  'Sampaloc',
  'San Isidro'
];

export interface IdConfig {
  name: { x: number, y: number, fontSize: number };
  barangay: { x: number, y: number, fontSize: number };
  city: { x: number, y: number, fontSize: number };
  age: { x: number, y: number, fontSize: number };
  dob: { x: number, y: number, fontSize: number };
  gender: { x: number, y: number, fontSize: number };
  dateIssued: { x: number, y: number, fontSize: number };
  id: { x: number, y: number, fontSize: number };
}

export const INITIAL_ID_CONFIG: IdConfig = {
  name: { x: 185, y: 133, fontSize: 14 },
  barangay: { x: 193, y: 154.2, fontSize: 14 },
  city: { x: 177, y: 174.2, fontSize: 14 },
  age: { x: 420, y: 174.2, fontSize: 14 },
  dob: { x: 245, y: 195.2, fontSize: 14 },
  gender: { x: 405, y: 195.2, fontSize: 14 },
  dateIssued: { x: 164, y: 254.5, fontSize: 14 },
  id: { x: 70, y: 273.5, fontSize: 16 }
};

export interface FamilyMember {
  name: string;
  relationship: string;
  age: string | number;
  civilStatus: string;
  occupation: string;
  income: string | number;
}

export interface SeniorCitizen {
  id: string;
  oscaId?: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  status: 'Active' | 'Deceased' | 'Pending';
  joinedDate: string;
  pensionStatus: string;
  barangay: string;
  idConfig?: IdConfig;
  idPhoto?: string;
  // Extended fields
  dateOfBirth?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  extensionName?: string;
  placeOfBirth?: string;
  mothersMaidenName?: string;
  streetAddress?: string;
  contactNumber?: string;
  emergencyName?: string;
  emergencyContact?: string;
  rrn?: string;
  nationalId?: string;
  familyMembersCount?: number;
  familyMembers?: FamilyMember[];
  updatedAt?: string;
}

export interface HistoryLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  barangay: string;
  email?: string;
  idPhoto?: string | null;
  forcePasswordChange?: boolean;
}

export interface PendingRequest {
  id: string;
  senior_id?: string | number;
  name: string;
  type: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  details: {
    dob: string;
    gender?: string;
    age: number;
    address: string;
    barangay: string;
    rrn: string;
    emergency: string;
    profilePicture: string;
    documents: {
      id?: string | number;
      name: string;
      filename: string;
      type: 'pdf' | 'image' | string;
    }[];
  };
}
