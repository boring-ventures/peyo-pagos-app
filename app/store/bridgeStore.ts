import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { bridgeService } from '../services/bridgeService';
import {
    BridgeIntegrationStatus,
    KycProfileForBridge
} from '../types/BridgeTypes';

// Bridge Store State
interface BridgeState extends BridgeIntegrationStatus {
  // Integration workflow
  isInitialized: boolean;
  retryCount: number;
  maxRetries: number;
}

// Bridge Store Actions
interface BridgeActions {
  // Core workflow
  initializeBridgeIntegration: (kycProfile: KycProfileForBridge) => Promise<{ success: boolean; error?: string }>;
  
  // Terms of Service
  generateTosLink: () => Promise<{ url?: string; agreementId?: string; error?: string }>;
  acceptTermsOfService: (agreementId: string) => void;
  
  // Customer management
  createBridgeCustomer: (kycProfile: KycProfileForBridge, signedAgreementId: string) => Promise<{ success: boolean; customerId?: string; error?: string }>;
  syncCustomerStatus: () => Promise<{ success: boolean; error?: string }>;
  
  // Wallet management
  createDefaultWallet: () => Promise<{ success: boolean; walletId?: string; error?: string }>;
  loadCustomerWallets: () => Promise<{ success: boolean; error?: string }>;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetBridgeIntegration: () => void;
  
  // Retry mechanism
  retryFailedOperation: (operation: () => Promise<any>) => Promise<{ success: boolean; error?: string }>;
  
  // Status checks
  isBridgeReady: () => boolean;
  isCustomerActive: () => boolean;
  hasActiveWallet: () => boolean;
  
  // Updates
  updateBridgeData: (data: Partial<BridgeIntegrationStatus>) => void;
}

type BridgeStore = BridgeState & BridgeActions;

const initialState: BridgeState = {
  // Bridge Integration Status
  bridgeCustomerId: null,
  bridgeVerificationStatus: null,
  signedAgreementId: null,
  hasAcceptedTermsOfService: false,
  requirementsDue: [],
  payinCrypto: null,
  payoutCrypto: null,
  wallets: [],
  lastSyncAt: null,
  integrationError: null,
  isLoading: false,
  
  // Store specific
  isInitialized: false,
  retryCount: 0,
  maxRetries: 3,
};

export const useBridgeStore = create<BridgeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Main integration workflow - Start Bridge integration for KYC approved user
       */
      initializeBridgeIntegration: async (kycProfile: KycProfileForBridge) => {
        const state = get();
        
        // Check if already initialized for this user
        if (state.isInitialized && state.bridgeCustomerId) {
          console.log('🌉 Bridge already initialized for user:', kycProfile.userId);
          return { success: true };
        }

        console.log('🌉 Starting Bridge integration for:', kycProfile.email);
        set({ isLoading: true, integrationError: null });

        try {
          // Step 1: Generate ToS link
          const tosResponse = await get().generateTosLink();
          if (tosResponse.error || !tosResponse.agreementId) {
            throw new Error(tosResponse.error || 'Failed to generate ToS');
          }

          // Step 2: Auto-accept ToS (or trigger manual acceptance)
          get().acceptTermsOfService(tosResponse.agreementId);

          // Step 3: Create Bridge customer
          const customerResponse = await get().createBridgeCustomer(kycProfile, tosResponse.agreementId);
          if (!customerResponse.success || !customerResponse.customerId) {
            throw new Error(customerResponse.error || 'Failed to create Bridge customer');
          }

          // Step 4: Create default wallet
          const walletResponse = await get().createDefaultWallet();
          if (!walletResponse.success) {
            console.warn('⚠️ Bridge wallet creation failed, but customer created successfully');
          }

          // Step 5: Mark as initialized
          set({ 
            isInitialized: true,
            isLoading: false,
            lastSyncAt: new Date().toISOString(),
            retryCount: 0
          });

          console.log('✅ Bridge integration completed successfully');
          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('💥 Bridge integration failed:', errorMessage);
          
          set({ 
            integrationError: errorMessage,
            isLoading: false 
          });

          return { 
            success: false, 
            error: errorMessage 
          };
        }
      },

      /**
       * Generate Terms of Service acceptance link
       */
      generateTosLink: async () => {
        try {
          const response = await bridgeService.generateTosLink();
          
          if (!response.success || !response.data) {
            return { error: response.error || 'ToS generation failed' };
          }

          return {
            url: response.data.url,
            agreementId: response.data.id
          };

        } catch (error) {
          return { 
            error: `ToS Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      /**
       * Mark ToS as accepted
       */
      acceptTermsOfService: (agreementId: string) => {
        set({
          hasAcceptedTermsOfService: true,
          signedAgreementId: agreementId
        });
        console.log('✅ Terms of Service accepted:', agreementId);
      },

      /**
       * Create Bridge customer
       */
      createBridgeCustomer: async (kycProfile: KycProfileForBridge, signedAgreementId: string) => {
        try {
          const response = await bridgeService.createCustomer(kycProfile, signedAgreementId);
          
          if (!response.success || !response.data) {
            return { 
              success: false, 
              error: response.error || 'Customer creation failed' 
            };
          }

          const customer = response.data;
          
          // Update store with customer data
          set({
            bridgeCustomerId: customer.id,
            bridgeVerificationStatus: customer.verification_status,
            requirementsDue: customer.requirements_due,
            payinCrypto: customer.payin_crypto,
            payoutCrypto: customer.payout_crypto,
            lastSyncAt: new Date().toISOString()
          });

          return { 
            success: true, 
            customerId: customer.id 
          };

        } catch (error) {
          return { 
            success: false, 
            error: `Customer creation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      /**
       * Sync customer status from Bridge
       */
      syncCustomerStatus: async () => {
        const { bridgeCustomerId } = get();
        
        if (!bridgeCustomerId) {
          return { success: false, error: 'No Bridge customer ID' };
        }

        try {
          set({ isLoading: true });
          
          const statusResponse = await bridgeService.syncCustomerStatus(bridgeCustomerId);
          
          if (statusResponse.error) {
            set({ 
              integrationError: statusResponse.error,
              isLoading: false 
            });
            return { success: false, error: statusResponse.error };
          }

          // Update status
          set({
            bridgeVerificationStatus: statusResponse.verificationStatus,
            requirementsDue: statusResponse.requirementsDue,
            lastSyncAt: new Date().toISOString(),
            isLoading: false,
            integrationError: null
          });

          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          set({ 
            integrationError: errorMessage,
            isLoading: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      /**
       * Create default USDC wallet
       */
      createDefaultWallet: async () => {
        const { bridgeCustomerId } = get();
        
        if (!bridgeCustomerId) {
          return { success: false, error: 'No Bridge customer ID' };
        }

        try {
          const response = await bridgeService.createDefaultWallet(bridgeCustomerId);
          
          if (!response.success || !response.data) {
            return { 
              success: false, 
              error: response.error || 'Wallet creation failed' 
            };
          }

          // Add wallet to store
          const { wallets } = get();
          set({
            wallets: [...wallets, response.data],
            lastSyncAt: new Date().toISOString()
          });

          return { 
            success: true, 
            walletId: response.data.id 
          };

        } catch (error) {
          return { 
            success: false, 
            error: `Wallet creation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      /**
       * Load all customer wallets
       */
      loadCustomerWallets: async () => {
        const { bridgeCustomerId } = get();
        
        if (!bridgeCustomerId) {
          return { success: false, error: 'No Bridge customer ID' };
        }

        try {
          const response = await bridgeService.getCustomerWallets(bridgeCustomerId);
          
          if (!response.success) {
            return { 
              success: false, 
              error: response.error || 'Failed to load wallets' 
            };
          }

          set({
            wallets: response.data || [],
            lastSyncAt: new Date().toISOString()
          });

          return { success: true };

        } catch (error) {
          return { 
            success: false, 
            error: `Load wallets error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      /**
       * Retry failed operation with exponential backoff
       */
      retryFailedOperation: async (operation: () => Promise<any>) => {
        const { retryCount, maxRetries } = get();
        
        if (retryCount >= maxRetries) {
          return { success: false, error: 'Max retries exceeded' };
        }

        try {
          set({ retryCount: retryCount + 1 });
          
          // Exponential backoff: 1s, 2s, 4s...
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const result = await operation();
          
          // Reset retry count on success
          if (result?.success) {
            set({ retryCount: 0 });
          }
          
          return result;

        } catch (error) {
          return { 
            success: false, 
            error: `Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      /**
       * State management helpers
       */
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ integrationError: error }),
      
      clearError: () => set({ integrationError: null }),

      resetBridgeIntegration: () => {
        set(initialState);
        console.log('🔄 Bridge integration reset');
      },

      updateBridgeData: (data: Partial<BridgeIntegrationStatus>) => {
        set(data);
      },

      /**
       * Status check utilities
       */
      isBridgeReady: () => {
        const state = get();
        return state.isInitialized && 
               !!state.bridgeCustomerId && 
               state.hasAcceptedTermsOfService;
      },

      isCustomerActive: () => {
        const state = get();
        return state.bridgeVerificationStatus === 'active';
      },

      hasActiveWallet: () => {
        const state = get();
        return state.wallets.length > 0 && 
               state.wallets.some(wallet => wallet.is_enabled);
      },
    }),
    {
      name: 'bridge-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Partial persistence - don't persist loading states
      partialize: (state) => ({
        bridgeCustomerId: state.bridgeCustomerId,
        bridgeVerificationStatus: state.bridgeVerificationStatus,
        signedAgreementId: state.signedAgreementId,
        hasAcceptedTermsOfService: state.hasAcceptedTermsOfService,
        requirementsDue: state.requirementsDue,
        payinCrypto: state.payinCrypto,
        payoutCrypto: state.payoutCrypto,
        wallets: state.wallets,
        lastSyncAt: state.lastSyncAt,
        isInitialized: state.isInitialized,
        // Don't persist: isLoading, integrationError, retryCount
      }),
    }
  )
);

export default useBridgeStore; 