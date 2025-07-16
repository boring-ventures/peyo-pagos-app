import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { AddressInfo, EconomicActivity, KycActions, KycDocuments, KycState, KycStep, PersonalInfo } from '../types/KycTypes';
import { useAuthStore } from './authStore';

type KycStore = KycState & KycActions;

const initialState: KycState = {
  verificationStatus: 'pending',
  currentStep: 'personal_info',
  personalInfo: {},
  addressInfo: {},
  economicActivity: {},
  documents: {
    idFront: null,
    idBack: null,
    selfie: null,
  },
  errors: {},
  isLoading: false,
};

const useKycStore = create<KycStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      updatePersonalInfo: (data: Partial<PersonalInfo>) => set(state => ({ personalInfo: { ...state.personalInfo, ...data } })),
      updateAddressInfo: (data: Partial<AddressInfo>) => set(state => ({ addressInfo: { ...state.addressInfo, ...data } })),
      updateEconomicActivity: (data: Partial<EconomicActivity>) => set(state => ({ economicActivity: { ...state.economicActivity, ...data } })),
      
      uploadDocument: async (payload: { type: keyof KycDocuments; file: string; }) => {
        try {
          set({ isLoading: true });
          console.log(`📄 Uploading ${payload.type} document to storage...`);
          
          // Get current user
          const { user } = useAuthStore.getState();
          if (!user) {
            console.error('❌ No user found for document upload');
            set({ isLoading: false });
            return;
          }

          // Upload document to Supabase storage
          const filePath = await authService.uploadKycDocument(
            payload.file,
            user.id,
            payload.type
          );

          if (filePath) {
            // Store file path instead of base64
            set(state => ({
              documents: {
                ...state.documents,
                [payload.type]: filePath
              },
              isLoading: false
            }));
            console.log(`✅ ${payload.type} document uploaded successfully: ${filePath}`);
          } else {
            console.error(`❌ Failed to upload ${payload.type} document`);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error(`💥 Error uploading ${payload.type} document:`, error);
          set({ isLoading: false });
        }
      },

      setCurrentStep: (step: KycStep) => set({ currentStep: step }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      validateStep: async (step: KycStep): Promise<boolean> => {
        // Mock validation, always passes for now
        console.log(`Validating step: ${step}`);
        return Promise.resolve(true);
      },

      completeVerification: async () => {
        set({ isLoading: true });
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ verificationStatus: 'completed', currentStep: 'completed', isLoading: false });
      },

      resetKyc: () => set(initialState),
    }),
    {
      name: 'kyc-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useKycStore; 