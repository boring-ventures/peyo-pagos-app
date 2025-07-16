export type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
export type KycStep = 'personal_info' | 'address' | 'economic_activity' | 'document_upload' | 'selfie' | 'completed';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string; // Country code
}

export interface AddressInfo {
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
}

export interface EconomicActivity {
  activity: string;
  occupation: string;
  monthlyIncome: string;
}

export interface KycDocuments {
  idFront: string | null; // File path in Supabase storage
  idBack: string | null;  // File path in Supabase storage
  selfie: string | null;  // File path in Supabase storage
}

export interface KycState {
  verificationStatus: VerificationStatus;
  currentStep: KycStep;
  personalInfo: Partial<PersonalInfo>;
  addressInfo: Partial<AddressInfo>;
  economicActivity: Partial<EconomicActivity>;
  documents: KycDocuments;
  errors: Record<string, string>;
  isLoading: boolean;
}

export interface KycActions {
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  updateAddressInfo: (data: Partial<AddressInfo>) => void;
  updateEconomicActivity: (data: Partial<EconomicActivity>) => void;
  uploadDocument: (payload: { type: keyof KycDocuments, file: string }) => Promise<void>; // Now async
  setCurrentStep: (step: KycStep) => void;
  completeVerification: () => Promise<void>;
  validateStep: (step: KycStep) => Promise<boolean>;
  resetKyc: () => void;
  setLoading: (loading: boolean) => void;
} 