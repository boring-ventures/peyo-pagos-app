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
  initializeBridgeIntegration: (kycProfile: KycProfileForBridge, retryAttempt?: number) => Promise<{ success: boolean; error?: string }>;
  
  // Terms of Service - Updated for proper production flow
  generateTosLink: () => Promise<{ url?: string; agreementId?: string; error?: string }>;
  acceptTermsOfService: (signedAgreementId: string) => void;
  showToSForUser: () => Promise<{ 
    success: boolean; 
    url?: string; 
    error?: string; 
    signedAgreementId?: string;
    dismissed?: boolean;
  }>;
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
  clearRateLimit: () => Promise<void>;
  
  // Retry mechanism
  retryFailedOperation: (operation: () => Promise<any>) => Promise<{ success: boolean; error?: string }>;
  
  // Status checks
  isBridgeReady: () => boolean;
  isCustomerActive: () => boolean;
  hasActiveWallet: () => boolean;
  
  // Updates
  updateBridgeData: (data: Partial<BridgeState>) => void;
  updateBridgeStatus: (data: {
    isInitialized?: boolean;
    bridgeCustomerId?: string | null;
    verificationStatus?: string;
    hasActiveWallet?: boolean;
    canAccessHome?: boolean;
  }) => void;
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
       * Updated to handle ToS properly for production vs sandbox with enhanced error handling
       */
      initializeBridgeIntegration: async (kycProfile: KycProfileForBridge, retryAttempt: number = 0) => {
        const maxRetries = 3;
        const retryDelay = Math.pow(2, retryAttempt) * 1000;
        const state = get();
        
        console.log(`🔍 Bridge integration state check (attempt ${retryAttempt + 1}/${maxRetries + 1}):`, {
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
          
          if (lastAttempt && retryAttempt === 0) { // Only check on first attempt
            const lastAttemptTime = parseInt(lastAttempt);
            const timeDiff = now - lastAttemptTime;
            
            // If last attempt was less than 10 seconds ago, skip (reduced from 30s)
            if (timeDiff < 10000) {
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
        if (state.isLoading && retryAttempt === 0) {
          console.log('🔄 Bridge integration already in progress, skipping duplicate call');
          return { success: false, error: 'Bridge integration already in progress' };
        }

        console.log(`🌉 Starting Bridge integration for: ${kycProfile.email} (attempt ${retryAttempt + 1})`);
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

            // Create wallet with retry logic
            console.log('🧪 Step 4: Creating default wallet...');
            let walletResponse;
            let walletRetryAttempt = 0;
            const maxWalletRetries = 2;

            do {
              walletResponse = await get().createDefaultWallet();
              console.log(`🔍 Wallet creation response (attempt ${walletRetryAttempt + 1}):`, walletResponse);
              
              if (!walletResponse.success && walletRetryAttempt < maxWalletRetries) {
                console.warn(`⚠️ Wallet creation failed, retrying in 2s...`);
                walletRetryAttempt++;
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            } while (!walletResponse.success && walletRetryAttempt <= maxWalletRetries);
            
            if (!walletResponse.success) {
              console.warn('⚠️ Bridge wallet creation failed after retries, but customer created successfully:', walletResponse.error);
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
          console.error(`💥 Bridge integration failed (attempt ${retryAttempt + 1}):`, errorMessage);
          
          // Check if we should retry
          if (retryAttempt < maxRetries) {
            console.log(`🔄 Retrying Bridge integration in ${retryDelay}ms... (attempt ${retryAttempt + 1}/${maxRetries})`);
            
            set({ isLoading: false });
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Recursive retry
            return get().initializeBridgeIntegration(kycProfile, retryAttempt + 1);
          } else {
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
        }
      },

      /**
       * Generate Terms of Service acceptance link (updated to support redirectUri)
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
       * Show ToS to user (for production flow) - Uses WebView instead of browser
       */
      showToSForUser: async (): Promise<{
        success: boolean;
        url?: string;
        error?: string;
        signedAgreementId?: string;
        dismissed?: boolean;
      }> => {
        try {
          console.log('🔐 Starting ToS flow for user...');
          
          // Let bridgeService handle redirect URI generation using expo-auth-session
          const response = await bridgeService.generateTosLink();
          
          if (!response.success || !response.data) {
            console.error('❌ Failed to generate ToS link:', response.error);
            return { 
              success: false, 
              error: response.error || 'Failed to generate ToS link' 
            };
          }

          console.log('✅ ToS link generated, preparing WebView...');
          console.log('🔗 ToS URL:', response.data.url);

          // Store ToS details for tracking
          set({
            tosUrl: response.data.url,
            tosAgreementId: response.data.id || null,
            isPendingTosAcceptance: true
          });

          // Generate redirect URI using expo-auth-session
          const { makeRedirectUri } = await import('expo-auth-session');
          const Constants = await import('expo-constants');
          
          // Log the scheme from app.json/app.config.js
          console.log('📱 App scheme from app.json:', Constants.default?.expoConfig?.scheme);
          console.log('📱 App name from app.json:', Constants.default?.expoConfig?.name);
          console.log('📱 App slug from app.json:', Constants.default?.expoConfig?.slug);
          console.log('📱 Full expo config object:', Constants.default?.expoConfig);
          
          const redirectUri = makeRedirectUri({
            scheme: 'peyopagos',
          });
          
          console.log('🔗 Generated redirect URI:', redirectUri);

          // Use the original URL without redirect_uri since we're intercepting the API
          console.log('🔗 ToS URL for WebView (without redirect_uri):', response.data.url);

          // Return success with URL for WebView to handle
          // The actual WebView handling will be done in the component
          return {
            success: true,
            url: response.data.url, // Use original URL, no redirect_uri needed
            dismissed: false
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
       * Sync customer status from Bridge API
       * Based on Bridge API documentation: GET /customers/{id}
       */
      syncCustomerStatus: async () => {
        try {
          const state = get();
          
          if (!state.bridgeCustomerId) {
            return { 
              success: false, 
              error: 'No customer ID available for sync' 
            };
          }

          console.log('🔄 Syncing customer status from Bridge:', state.bridgeCustomerId);
          set({ isLoading: true, integrationError: null });

          const response = await bridgeService.getCustomer(state.bridgeCustomerId);
          
          if (!response.success || !response.data) {
            console.error('❌ Customer sync failed:', response.error);
            set({ 
              isLoading: false, 
              integrationError: response.error || 'Failed to sync customer status' 
            });
            return { 
              success: false, 
              error: response.error || 'Failed to sync customer status' 
            };
          }

          const customerData = response.data;
          console.log('✅ Customer sync successful:', {
            verification_status: customerData.verification_status,
            requirements_due: customerData.requirements_due,
            payin_crypto: customerData.payin_crypto,
            payout_crypto: customerData.payout_crypto,
            endorsements: customerData.endorsements?.length || 0
          });

          // Update store with latest customer data
          set({
            bridgeVerificationStatus: customerData.verification_status,
            requirementsDue: customerData.requirements_due || [],
            payinCrypto: customerData.payin_crypto,
            payoutCrypto: customerData.payout_crypto,
            lastSyncAt: new Date().toISOString(),
            isLoading: false,
            integrationError: null
          });

          // If customer is active and has no wallets, try to create default wallet
          if (customerData.verification_status === 'active' && state.wallets.length === 0) {
            console.log('🔄 Customer is active, attempting to create default wallet...');
            try {
              const walletResult = await get().createDefaultWallet();
              if (walletResult.success) {
                console.log('✅ Default wallet created during sync');
              } else {
                console.warn('⚠️ Default wallet creation failed during sync:', walletResult.error);
              }
            } catch (walletError) {
              console.warn('⚠️ Error creating default wallet during sync:', walletError);
            }
          }

          return { success: true };

        } catch (error) {
          console.error('💥 Error syncing customer status:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          set({ 
            isLoading: false, 
            integrationError: errorMessage 
          });
          
          return { 
            success: false, 
            error: errorMessage 
          };
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

      clearRateLimit: async () => {
        try {
          const { user } = useAuthStore.getState();
          if (user?.id) {
            const lastInitAttemptKey = `bridge_init_attempt_${user.id}`;
            await AsyncStorage.removeItem(lastInitAttemptKey);
            console.log('🧹 Rate limit cleared for user:', user.id);
          }
        } catch (error) {
          console.warn('⚠️ Error clearing rate limit:', error);
        }
      },

      updateBridgeData: (data: Partial<BridgeState>) => {
        set(data);
      },

      updateBridgeStatus: (data: {
        isInitialized?: boolean;
        bridgeCustomerId?: string | null;
        verificationStatus?: string;
        hasActiveWallet?: boolean;
        canAccessHome?: boolean;
      }) => {
        const updateData: Partial<BridgeState> = {};
        
        if (data.isInitialized !== undefined) {
          updateData.isInitialized = data.isInitialized;
        }
        
        if (data.bridgeCustomerId !== undefined) {
          updateData.bridgeCustomerId = data.bridgeCustomerId;
        }
        
        if (data.verificationStatus !== undefined) {
          updateData.bridgeVerificationStatus = data.verificationStatus as BridgeVerificationStatus;
        }
        
        if (data.hasActiveWallet !== undefined) {
          // Update wallet status based on hasActiveWallet
          const currentWallets = get().wallets;
          const updatedWallets = currentWallets.map(wallet => ({
            ...wallet,
            is_enabled: data.hasActiveWallet || false
          }));
          updateData.wallets = updatedWallets;
        }
        
        set(updateData);
        console.log('🔄 Bridge status updated:', data);
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