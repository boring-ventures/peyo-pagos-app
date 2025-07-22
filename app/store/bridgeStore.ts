import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { analyticsService } from '../services/analyticsService';
import { bridgeService } from '../services/bridgeService';
import { profileService } from '../services/profileService';
import { walletService } from '../services/walletService';
import {
  BridgeCapabilityStatus,
  BridgeVerificationStatus,
  BridgeWallet,
  KycProfileForBridge
} from '../types/BridgeTypes';
import { useAuthStore } from './authStore';

// Bridge Store State
interface BridgeState {
  // Bridge Integration Status
  bridgeCustomerId: string | null;
  bridgeVerificationStatus: BridgeVerificationStatus | null;
  signedAgreementId: string | null;
  hasAcceptedTermsOfService: boolean;
  
  // ToS Flow State (for production)
  tosUrl: string | null;
  tosAgreementId: string | null;
  isPendingTosAcceptance: boolean;
  
  requirementsDue: string[];
  payinCrypto: BridgeCapabilityStatus | null;
  payoutCrypto: BridgeCapabilityStatus | null;
  wallets: BridgeWallet[];
  lastSyncAt: string | null;
  integrationError: string | null;
  isLoading: boolean;
  
  // Store specific
  isInitialized: boolean;
  retryCount: number;
  maxRetries: number;
}

// Bridge Store Actions
interface BridgeActions {
  // Core workflow
  initializeBridgeIntegration: (kycProfile: KycProfileForBridge) => Promise<{ success: boolean; error?: string }>;
  
  // Terms of Service - Updated for proper production flow
  generateTosLink: (redirectUri?: string) => Promise<{ url?: string; agreementId?: string; error?: string }>;
  acceptTermsOfService: (signedAgreementId: string) => void;
  showToSForUser: () => Promise<{ success: boolean; url?: string; error?: string }>;
  handleTosAcceptance: (signedAgreementId: string) => Promise<{ success: boolean; error?: string }>;
  cancelTosFlow: () => void;
  
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
  updateBridgeData: (data: Partial<BridgeState>) => void;
}

type BridgeStore = BridgeState & BridgeActions;

const initialState: BridgeState = {
  // Bridge Integration Status
  bridgeCustomerId: null,
  bridgeVerificationStatus: null,
  signedAgreementId: null,
  hasAcceptedTermsOfService: false,
  
  // ToS Flow State (for production)
  tosUrl: null,
  tosAgreementId: null,
  isPendingTosAcceptance: false,
  
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
       * Updated to handle ToS properly for production vs sandbox
       */
      initializeBridgeIntegration: async (kycProfile: KycProfileForBridge) => {
        const state = get();
        
        console.log('🔍 Bridge integration state check:', {
          isInitialized: state.isInitialized,
          bridgeCustomerId: state.bridgeCustomerId,
          hasAcceptedTermsOfService: state.hasAcceptedTermsOfService,
          userId: kycProfile.userId,
          email: kycProfile.email
        });
        
        // Check if already initialized for this user AND has customer ID
        if (state.isInitialized && state.bridgeCustomerId) {
          console.log('🌉 Bridge already initialized for user:', kycProfile.userId, 'with customer ID:', state.bridgeCustomerId);
          return { success: true };
        }

        // Additional protection: Prevent rapid successive calls
        const lastInitAttemptKey = `bridge_init_attempt_${kycProfile.userId}`;
        try {
          const lastAttempt = await AsyncStorage.getItem(lastInitAttemptKey);
          const now = Date.now();
          
          if (lastAttempt) {
            const lastAttemptTime = parseInt(lastAttempt);
            const timeDiff = now - lastAttemptTime;
            
            // If last attempt was less than 30 seconds ago, skip
            if (timeDiff < 30000) {
              console.log(`⏭️ Recent initialization attempt detected (${Math.round(timeDiff/1000)}s ago), skipping...`);
              return { success: false, error: 'Recent initialization attempt, please wait' };
            }
          }

          // Mark this attempt
          await AsyncStorage.setItem(lastInitAttemptKey, now.toString());
        } catch (error) {
          console.warn('⚠️ Error checking last attempt time:', error);
          // Continue with initialization even if AsyncStorage fails
        }

        // Check if integration is already in progress
        if (state.isLoading) {
          console.log('🔄 Bridge integration already in progress, skipping duplicate call');
          return { success: false, error: 'Bridge integration already in progress' };
        }

        console.log('🌉 Starting Bridge integration for:', kycProfile.email);
        set({ isLoading: true, integrationError: null });

        try {
          // Get sandbox mode from bridgeService to ensure consistency
          const { bridgeService } = await import('../services/bridgeService');
          const isSandbox = !(await bridgeService.isConfigured()) || 
                           process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true' ||
                           Constants.expoConfig?.extra?.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true';
          
          console.log(`🔧 Bridge Store - Sandbox mode: ${isSandbox}`);
          
          if (isSandbox) {
            // Sandbox flow: Auto-generate and accept ToS (since ToS endpoints don't exist)
            console.log('🧪 Sandbox mode: Auto-handling ToS flow');
            
            console.log('🧪 Step 1: Generating ToS link...');
            const tosResponse = await get().generateTosLink();
            console.log('🔍 ToS response:', tosResponse);
            
            if (tosResponse.error || !tosResponse.agreementId) {
              console.error('❌ ToS generation failed:', tosResponse.error);
              throw new Error(tosResponse.error || 'Failed to generate ToS');
            }

            // Auto-accept in sandbox
            console.log('🧪 Step 2: Auto-accepting ToS with agreementId:', tosResponse.agreementId);
            get().acceptTermsOfService(tosResponse.agreementId);

            // Continue with customer creation
            console.log('🧪 Step 3: Creating Bridge customer...');
            const customerResponse = await get().createBridgeCustomer(kycProfile, tosResponse.agreementId);
            console.log('🔍 Customer creation response:', customerResponse);
            
            if (!customerResponse.success || !customerResponse.customerId) {
              console.error('❌ Bridge customer creation failed:', customerResponse.error);
              throw new Error(customerResponse.error || 'Failed to create Bridge customer');
            }

            console.log('✅ Bridge customer created successfully:', customerResponse.customerId);

            // Create wallet
            console.log('🧪 Step 4: Creating default wallet...');
            const walletResponse = await get().createDefaultWallet();
            console.log('🔍 Wallet creation response:', walletResponse);
            
            if (!walletResponse.success) {
              console.warn('⚠️ Bridge wallet creation failed, but customer created successfully:', walletResponse.error);
            } else {
              console.log('✅ Bridge wallet created successfully');
            }

            // Mark as initialized
            set({ 
              isInitialized: true,
              isLoading: false,
              lastSyncAt: new Date().toISOString(),
              retryCount: 0
            });

            console.log('✅ Bridge integration completed successfully (sandbox)');
            return { success: true };

          } else {
            // Production flow: Show ToS to user and wait for manual acceptance
            console.log('🔐 Production mode: Initiating user ToS flow');
            
            const tosResponse = await get().showToSForUser();
            if (!tosResponse.success || !tosResponse.url) {
              throw new Error(tosResponse.error || 'Failed to generate ToS link');
            }

            // Set pending state - user must accept manually
            set({
              isPendingTosAcceptance: true,
              isLoading: false
            });

            console.log('⏳ Waiting for user to accept ToS in production mode');
            return { success: true }; // Success means ToS flow initiated
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('💥 Bridge integration failed:', errorMessage);
          
          set({ 
            integrationError: errorMessage,
            isLoading: false,
            isPendingTosAcceptance: false
          });

          return { 
            success: false, 
            error: errorMessage 
          };
        }
      },

      /**
       * Generate Terms of Service acceptance link (updated to support redirectUri)
       */
      generateTosLink: async (redirectUri?: string) => {
        try {
          const response = await bridgeService.generateTosLink(redirectUri);
          
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
       * Show ToS to user (for production flow) - Auto opens browser
       */
      showToSForUser: async () => {
        try {
          console.log('🔐 Starting ToS flow for user...');
          
          // Use correct deep link redirect URI (per app.json scheme configuration)
          const redirectUri = 'peyopagos://bridge-tos-callback';
          console.log('🔄 Using redirect URI:', redirectUri);
          
          const response = await bridgeService.generateTosLink(redirectUri);
          
          if (!response.success || !response.data) {
            console.error('❌ Failed to generate ToS link:', response.error);
            return { 
              success: false, 
              error: response.error || 'Failed to generate ToS link' 
            };
          }

          console.log('✅ ToS link generated, opening browser...');
          console.log('🔗 ToS URL:', response.data.url);

          // Store ToS details for tracking
          set({
            tosUrl: response.data.url,
            tosAgreementId: response.data.id || null, // Bridge ToS response may not include ID initially
            isPendingTosAcceptance: true
          });

          // AUTO-OPEN the ToS URL in browser
          try {
            const { openBrowserAsync } = await import('expo-web-browser');
            
            console.log('🌐 Opening ToS URL in browser...');
            const browserResult = await openBrowserAsync(response.data.url, {
              showTitle: true,
            });
            
            console.log('🔍 Browser result:', browserResult);
            
            // The browser will either:
            // 1. User accepts ToS -> redirects to our deep link -> handleTosAcceptance called
            // 2. User cancels -> we stay in pending state
            // 3. User closes browser -> we stay in pending state
            
          } catch (browserError) {
            console.error('⚠️ Error opening browser:', browserError);
            // Don't fail the whole flow, user can manually open the URL
          }

          return {
            success: true,
            url: response.data.url
          };

        } catch (error) {
          console.error('💥 ToS flow error:', error);
          return { 
            success: false,
            error: `ToS Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      /**
       * Handle ToS acceptance with signed agreement ID and continue Bridge flow
       */
      handleTosAcceptance: async (signedAgreementId: string) => {
        try {
          console.log('🔐 Processing ToS acceptance:', signedAgreementId);
          const state = get();
          
          // Mark ToS as accepted in store
          get().acceptTermsOfService(signedAgreementId);

          // Clear pending state
          set({ isPendingTosAcceptance: false });

          console.log('✅ ToS accepted, now continuing with Bridge customer creation...');

          // 🚨 CRITICAL: Continue with Bridge customer creation now that ToS is accepted
          // We need the KYC profile data to create the customer
          // This should be stored in state or retrieved from database
          
          // Just mark ToS as accepted - the app will handle the rest
          console.log('✅ ToS accepted successfully');
          console.log('ℹ️ Bridge customer creation will be handled by the app flow');
          
          return { 
            success: true,
            message: 'ToS accepted successfully'
          };

        } catch (error) {
          console.error('💥 Error in ToS acceptance flow:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set({ 
            integrationError: errorMessage,
            isPendingTosAcceptance: false
          });

          return { 
            success: false, 
            error: errorMessage 
          };
        }
      },



      /**
       * Cancel ToS flow
       */
      cancelTosFlow: () => {
        set({
          isPendingTosAcceptance: false,
          tosUrl: null,
          tosAgreementId: null,
          integrationError: 'ToS acceptance cancelled by user'
        });
        console.log('❌ ToS flow cancelled by user');
      },

      /**
       * Mark ToS as accepted (updated)
       */
      acceptTermsOfService: (signedAgreementId: string) => {
        set({
          hasAcceptedTermsOfService: true,
          signedAgreementId: signedAgreementId,
          tosUrl: null,
          tosAgreementId: null,
          isPendingTosAcceptance: false
        });
        console.log('✅ Terms of Service accepted:', signedAgreementId);
      },

      /**
       * Create Bridge customer with signed agreement ID
       */
      createBridgeCustomer: async (kycProfile: KycProfileForBridge, signedAgreementId: string) => {
        console.log('🌉 STARTING createBridgeCustomer:', {
          userId: kycProfile.userId,
          email: kycProfile.email,
          signedAgreementId,
          hasProfile: !!kycProfile
        });
        
        try {
          console.log('🌉 Calling bridgeService.createCustomer...');
          const response = await bridgeService.createCustomer(kycProfile, signedAgreementId);

          console.log('🔍 Bridge API response:', {
            success: response.success,
            hasData: !!response.data,
            error: response.error,
            customerId: response.data?.id
          });

          if (!response.success || !response.data) {
            console.error('❌ Bridge customer creation failed:', response.error);
            return { success: false, error: response.error };
          }

          const customer = response.data;
          
          console.log('🌉 Bridge customer data received:', {
            id: customer.id,
            verification_status: customer.verification_status,
            payin_crypto: customer.payin_crypto,
            payout_crypto: customer.payout_crypto,
            requirements_due: customer.requirements_due,
            endorsements: customer.endorsements?.length || 0
          });
          
          // Update Bridge state
          set({
            bridgeCustomerId: customer.id,
            bridgeVerificationStatus: customer.verification_status as BridgeVerificationStatus,
            payinCrypto: customer.payin_crypto || null,
            payoutCrypto: customer.payout_crypto || null,
            requirementsDue: customer.requirements_due || [],
          });

          console.log('✅ Bridge customer created:', customer.id);
          console.log('🔍 Bridge state updated in store');

          // 🚨 UPDATED: Save complete Bridge integration data to database
          console.log('🗄️ Saving complete Bridge integration data to database...');
          console.log('🔍 Database save parameters:', {
            userId: kycProfile.userId,
            customerId: customer.id,
            signedAgreementId
          });
          
          const dbSaveResult = await profileService.updateBridgeIntegrationData(
            kycProfile.userId, 
            customer.id,
            signedAgreementId
          );
          
          console.log('🔍 Database save result:', dbSaveResult);
          
          if (!dbSaveResult.success) {
            console.warn('⚠️ Bridge customer created but database save failed:', dbSaveResult.error);
            // Don't fail the entire operation, just log the warning
          } else {
            console.log('✅ Bridge integration data saved to database successfully');
          }

          // 🚨 NEW: Save Bridge raw response to database
          console.log('🗄️ Saving Bridge raw response to database...');
          const rawResponseResult = await profileService.saveBridgeRawResponse(
            kycProfile.userId, 
            customer
          );
          
          console.log('🔍 Raw response save result:', rawResponseResult);
          
          if (!rawResponseResult.success) {
            console.warn('⚠️ Bridge raw response save failed:', rawResponseResult.error);
          } else {
            console.log('✅ Bridge raw response saved to database successfully');
          }

          // 🚨 NEW: Save endorsements if available
          if (customer.endorsements && customer.endorsements.length > 0) {
            console.log('🗄️ Saving Bridge endorsements to database...', customer.endorsements.length, 'endorsements');
            const endorsementsResult = await profileService.saveBridgeEndorsements(
              kycProfile.userId, 
              customer.endorsements
            );
            
            console.log('🔍 Endorsements save result:', endorsementsResult);
            
            if (!endorsementsResult.success) {
              console.warn('⚠️ Bridge endorsements save failed:', endorsementsResult.error);
            } else {
              console.log('✅ Bridge endorsements saved to database successfully');
            }
          } else {
            console.log('ℹ️ No endorsements to save');
          }

          // 📊 Track KYC decision event based on customer status
          console.log('📊 Tracking KYC decision event...');
          try {
            const { userTag } = useAuthStore.getState();
            const currentTime = new Date().toISOString();
            
            // Determine if KYC was approved or rejected based on customer verification status
            if (customer.verification_status === 'active') {
              await analyticsService.trackKycApproved(kycProfile.userId, {
                bridgeCustomerId: customer.id,
                userTag: userTag || '',
                approvedAt: currentTime,
                timeToApproval: 300, // 5 minutes typical processing time
                autoApproved: true // Since it's automatic approval
              });
              console.log('✅ KYC approved event tracked');
              
            } else if (customer.verification_status === 'rejected') {
              await analyticsService.trackKycRejected(kycProfile.userId, {
                bridgeCustomerId: customer.id,
                rejectionReason: customer.requirements_due?.[0] || 'Unknown reason',
                rejectedAt: currentTime,
                timeToRejection: 300, // 5 minutes typical processing time
                canRetry: true,
                requiredActions: customer.requirements_due || []
              });
              console.log('✅ KYC rejected event tracked');
            } else {
              // For other statuses (pending, in_review, suspended), we already tracked under_verification
              console.log('ℹ️ KYC status is pending/in_review/suspended - already tracked as under_verification');
            }
          } catch (error) {
            console.warn('⚠️ Failed to track KYC decision event:', error);
            // Don't fail the bridge integration if analytics fails
          }

          // 💳 NEW: Auto-create first wallet for active customers
          if (customer.verification_status === 'active') {
            console.log('💳 Auto-creating first Solana wallet for new customer...');
            try {
              const firstWalletResult = await walletService.createWallet({
                profileId: kycProfile.userId,
                customerId: customer.id,
                chain: 'solana',
                currency: 'usdc',
                walletTag: 'general_use',
                bridgeTags: ['primary', 'auto-created']
              });

              if (firstWalletResult.success && firstWalletResult.data) {
                console.log('✅ First wallet created automatically:', {
                  walletId: firstWalletResult.data.id,
                  address: firstWalletResult.data.address,
                  chain: firstWalletResult.data.chain
                });
              } else {
                console.warn('⚠️ Failed to create first wallet automatically:', firstWalletResult.error);
                // Don't fail the entire Bridge integration if wallet creation fails
              }
            } catch (error) {
              console.warn('⚠️ Error during automatic first wallet creation:', error);
              // Don't fail the entire Bridge integration if wallet creation fails
            }
          } else {
            console.log('ℹ️ Customer not active, skipping automatic wallet creation');
          }

          return { 
            success: true, 
            customerId: customer.id 
          };

        } catch (error) {
          return { 
            success: false, 
            error: `Customer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
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

          // Update status - cast verificationStatus to BridgeVerificationStatus
          const bridgeVerificationStatus = statusResponse.verificationStatus as BridgeVerificationStatus;
          
          set({
            bridgeVerificationStatus,
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

        // Check if in sandbox mode
        const isSandbox = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true';
        
        if (isSandbox) {
          console.log('🏖️ Sandbox mode: Skipping wallet creation');
          console.log('💳 Wallet creation will be available in production environment');
          
          // Return success without creating actual wallet
          return { 
            success: true, 
            walletId: 'sandbox-wallet-pending'
          };
        }

        try {
          const response = await bridgeService.createDefaultWallet(bridgeCustomerId);
          
          if (!response.success || !response.data) {
            return { 
              success: false, 
              error: response.error || 'Wallet creation failed' 
            };
          }

          // Type assertion for wallet data
          const walletData = response.data as BridgeWallet;

          // Add wallet to store
          const { wallets } = get();
          set({
            wallets: [...wallets, walletData],
            lastSyncAt: new Date().toISOString()
          });

          return { 
            success: true, 
            walletId: walletData.id 
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

          // Type assertion for wallets data
          const walletsData = (response.data || []) as BridgeWallet[];

          set({
            wallets: walletsData,
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

      updateBridgeData: (data: Partial<BridgeState>) => {
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
        
        // ToS Flow State (persist for production flow tracking)
        tosUrl: state.tosUrl,
        tosAgreementId: state.tosAgreementId,
        // Don't persist isPendingTosAcceptance - should reset on app restart
        
        requirementsDue: state.requirementsDue,
        payinCrypto: state.payinCrypto,
        payoutCrypto: state.payoutCrypto,
        wallets: state.wallets,
        lastSyncAt: state.lastSyncAt,
        isInitialized: state.isInitialized,
        // Don't persist: isLoading, integrationError, retryCount, isPendingTosAcceptance
      }),
    }
  )
);

export default useBridgeStore; 