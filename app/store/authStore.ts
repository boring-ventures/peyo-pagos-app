import { ImageFile } from "@/app/components/ImagePickerModal";
import { authService } from "@/app/services/authService";
import { walletService } from "@/app/services/walletService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { VerificationStatus } from "../types/KycTypes";
import {
    Wallet,
    WalletServiceCreateRequest,
    WalletSyncResult
} from "../types/WalletTypes";

// Session key for AsyncStorage
const SESSION_KEY = 'supabase.session';

type ProfileState = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status?: 'active' | 'disabled' | 'deleted';
  role?: 'USER' | 'SUPERADMIN';
  user_tag?: string | null; // 🏷️ NEW: User tag field
};

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profile: ProfileState | null;
  error: string | null;
  kycStatus: VerificationStatus;
  userTag: string | null; // 🏷️ NEW: User tag state
  wallet: Wallet | null; // 🏷️ NEW: Wallet state

  // Acciones
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    profile: ProfileState,
    avatar?: ImageFile | null
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  restoreSession: () => Promise<boolean>;
  updateProfile: (profileData: ProfileState) => void;
  updateKycStatus: (status: VerificationStatus) => void;
  
  // 🏷️ NEW: User tag management actions
  updateUserTag: (userTag: string | null) => void;
  loadUserTag: () => Promise<void>;

  // 💳 NEW: Wallet management actions  
  wallets: Wallet[];
  walletsLoading: boolean;
  walletsError: string | null;
  walletsSyncedAt: Date | null;
  loadUserWallets: () => Promise<boolean>;
  createWallet: (request: WalletServiceCreateRequest) => Promise<Wallet | null>;
  syncWallets: () => Promise<WalletSyncResult>;
  refreshWallets: () => Promise<boolean>;
  clearWalletError: () => void;
  setWalletLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  profile: null,
  error: null,
  kycStatus: 'pending',
  userTag: null, // 🏷️ NEW: Initialize user tag as null
  
  // 💳 NEW: Initialize wallet state
  wallets: [],
  walletsLoading: false,
  walletsError: null,
  walletsSyncedAt: null,
  wallet: null, // 🏷️ NEW: Initialize wallet as null

  initialize: async () => {
    // set({ isLoading: true });
    try {
      const success = await get().restoreSession();

      if (!success) {
        set({ isAuthenticated: false, user: null, profile: null });
      }
    } catch (error) {
      console.error("Error initializing auth store:", error);
      set({ isAuthenticated: false, user: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  restoreSession: async () => {
    try {
      // Intentar recuperar sesión desde AsyncStorage primero
      const storedSession = await authService.getStoredSession();

      // Si hay una sesión almacenada, usarla
      if (storedSession?.user) {
        const user = storedSession.user;
        const userData = user.user_metadata as ProfileState;

        // También obtener el perfil completo desde la base de datos si es necesario
        let profileData = userData;

        if (user.id) {
          const dbProfile = await authService.getProfile(user.id);
          if (dbProfile) {
            profileData = dbProfile;
            console.log('✅ Profile found in database');
          } else {
            console.log('⚠️ No profile in database yet (might be during registration flow)');
            // Use user metadata as fallback during registration flow
            profileData = {
              first_name: userData?.first_name || '',
              last_name: userData?.last_name || '',
              email: user.email || '',
              phone: userData?.phone || user.phone || '',
              avatar_url: userData?.avatar_url,
              status: 'active', // Default status during registration
              role: 'USER',     // Default role for regular users
              user_tag: null,   // 🏷️ NEW: Default user tag as null
            };
          }
        }

        set({
          isAuthenticated: true,
          user,
          profile: {
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: user.email || profileData.email || "",
            phone: profileData.phone || user.phone || "",
            avatar_url: profileData.avatar_url,
            status: profileData.status || 'active',
            role: profileData.role || 'USER',
            user_tag: profileData.user_tag || null, // 🏷️ NEW: Include user tag
          },
          userTag: profileData.user_tag || null, // 🏷️ NEW: Set user tag in state
        });

        return true;
      }

      // Si no hay sesión en AsyncStorage o no es válida, verificar con Supabase
      const session = await authService.getSession();

      if (session?.user) {
        const user = session.user;
        const userData = user.user_metadata as ProfileState;

        // También obtener el perfil completo desde la base de datos
        let profileData = userData;
        if (user.id) {
          const dbProfile = await authService.getProfile(user.id);
          if (dbProfile) {
            profileData = dbProfile;
            console.log('✅ Profile found in database');
          } else {
            console.log('⚠️ No profile in database yet (might be during registration flow)');
            // Use user metadata as fallback during registration flow
            profileData = {
              first_name: userData?.first_name || '',
              last_name: userData?.last_name || '',
              email: user.email || '',
              phone: userData?.phone || user.phone || '',
              avatar_url: userData?.avatar_url,
              status: 'active', // Default status during registration
              role: 'USER',     // Default role for regular users
              user_tag: null,   // 🏷️ NEW: Default user tag as null
            };
          }
        }

        set({
          isAuthenticated: true,
          user,
          profile: {
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: user.email || profileData.email || "",
            phone: profileData.phone || user.phone || "",
            avatar_url: profileData.avatar_url,
            status: profileData.status || 'active',
            role: profileData.role || 'USER',
            user_tag: profileData.user_tag || null, // 🏷️ NEW: Include user tag
          },
          userTag: profileData.user_tag || null, // 🏷️ NEW: Set user tag in state
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error restoring session:", error);
      return false;
    }
  },

  login: async (email, password) => {
    // set({ isLoading: true, error: null });
    try {
      console.log('🔐 Starting comprehensive login...', { email });

      // Use the new comprehensive login with validation
      const loginResult = await authService.signInWithValidation(email, password);

      if (!loginResult.success) {
        console.error('❌ Login failed:', loginResult.error);
        
        // Handle specific error cases
        if (loginResult.nextStep === 'account_disabled') {
          set({ 
            error: `Account is ${loginResult.userStatus}. Please contact support.`,
            isLoading: false 
          });
        } else {
          set({ 
            error: loginResult.error || 'Login failed',
            isLoading: false 
          });
        }
        return false;
      }

      const { user, session, userStatus, role, kycStatus, bridgeCustomerId, nextStep } = loginResult;

      if (!user) {
        set({ error: 'No user data received', isLoading: false });
        return false;
      }

      console.log('✅ Login successful, next step:', nextStep);

      // Get user metadata and profile
      const userData = user.user_metadata as ProfileState;
      let profileData = userData;

      // Get complete profile from database
      const dbProfile = await authService.getProfile(user.id);
      if (dbProfile) {
        profileData = {
          ...dbProfile,
          status: userStatus || dbProfile.status,
          role: role || dbProfile.role,
        };
        console.log('✅ Profile loaded from database');
      } else {
        console.log('⚠️ Using metadata as profile fallback');
        profileData = {
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          email: user.email || '',
          phone: userData?.phone || user.phone || '',
          avatar_url: userData?.avatar_url,
          status: userStatus || 'active',
          role: role || 'USER',
          user_tag: null, // 🏷️ NEW: Default for fallback
        };
      }

      // Update auth state
      set({
        isAuthenticated: true,
        user,
        profile: profileData,
        kycStatus: kycStatus === 'active' ? 'completed' : 
                  kycStatus === 'under_review' ? 'in_progress' :
                  kycStatus === 'rejected' ? 'rejected' : 'pending',
        isLoading: false,
        error: null,
        userTag: profileData.user_tag || null, // 🏷️ NEW: Set user tag from profile
      });

      // Save session to AsyncStorage
      if (session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }

      // Log successful login with next step information
      console.log('🎉 Login completed successfully', {
        userId: user.id,
        email: user.email,
        role,
        kycStatus,
        nextStep,
        hasBridgeCustomer: !!bridgeCustomerId
      });

      return true;

    } catch (err) {
      console.error('💥 Error in login:', err);
      const error = err as Error;
      set({ 
        error: error.message || 'Login failed',
        isLoading: false 
      });
      return false;
    }
  },

  register: async (email, password, profile, avatar) => {
    // set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.signUp(
        email,
        password,
        {
          email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        },
        avatar
      );

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      const dbProfile = await authService.getProfile(user?.id || "");

      if (dbProfile) {
        profile.avatar_url = dbProfile.avatar_url;
      }

      if (user) {
        set({
          isAuthenticated: true,
          user,
          profile,
        });
        return true;
      }

      return false;
    } catch (err) {
      const error = err as Error;
      set({ error: error.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    // set({ isLoading: true });
    try {
      console.log('🚪 Starting logout process...');
      
      // 1. Sign out from Supabase
      await authService.signOut();
      
      // 2. Clear auth store
      set({
        isAuthenticated: false,
        user: null,
        profile: null,
        kycStatus: 'pending',
        error: null,
        userTag: null, // 🏷️ NEW: Clear user tag on logout
      });
      
      // 3. Clear all user-specific stores
      console.log('🧹 Clearing user-specific stores...');
      
      // Clear Bridge store (most important - fixes the issue)
      const { default: useBridgeStore } = await import('./bridgeStore');
      useBridgeStore.getState().resetBridgeIntegration();
      
      // Clear KYC store
      const { default: useKycStore } = await import('./kycStore');
      useKycStore.getState().resetKyc();
      
      // Clear security PIN (user-specific setting)
      const { default: useSettingsStore } = await import('./settingsStore');
      useSettingsStore.getState().enablePin(false);
      
      console.log('✅ All user stores cleared successfully');
      
    } catch (error) {
      console.error("💥 Error during logout:", error);
      set({ error: error instanceof Error ? error.message : 'Logout failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  updateProfile: (profileData) => {
    set((state) => ({
      ...state,
      profile: profileData
    }));
  },

  updateKycStatus: (status: VerificationStatus) => set({ kycStatus: status }),
  
  // 🏷️ NEW: User tag management actions
  updateUserTag: (userTag: string | null) => {
    console.log('🏷️ Updating user tag in store:', userTag);
    set({ userTag });
  },

  loadUserTag: async () => {
    const { user } = get();
    if (!user?.id) {
      console.log('⚠️ No user ID available for loading user tag');
      return;
    }

    try {
      console.log('🏷️ Loading user tag from database...');
      const { userTagService } = await import('../services/userTagService');
      const result = await userTagService.getUserTag(user.id);
      
      if (result.success) {
        set({ userTag: result.data });
        console.log('✅ User tag loaded successfully:', result.data);
      } else {
        console.error('❌ Failed to load user tag:', result.error);
      }
    } catch (error) {
      console.error('💥 Error loading user tag:', error);
    }
  },

  // 💳 NEW: Wallet management actions implementation
  loadUserWallets: async () => {
    const { user } = get();
    if (!user?.id) {
      console.log('⚠️ No user ID available for loading wallets');
      return false;
    }

    set({ walletsLoading: true, walletsError: null });
    try {
      console.log('💳 Loading user wallets...');
      
      // Get the actual profile.id from profiles table
      const { supabaseAdmin } = await import('@/app/services/supabaseAdmin');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Failed to get profile for loading wallets:', profileError);
        set({ 
          walletsLoading: false,
          walletsError: 'Profile not found for loading wallets'
        });
        return false;
      }
      
      const result = await walletService.getWallets(profile.id);
      
      if (result.success && result.data) {
        set({ 
          wallets: result.data,
          walletsLoading: false,
          walletsSyncedAt: new Date(),
          walletsError: null
        });
        console.log('✅ Wallets loaded successfully:', result.data.length);
        return true;
      } else {
        set({ 
          walletsLoading: false,
          walletsError: result.error || 'Failed to load wallets'
        });
        console.error('❌ Failed to load wallets:', result.error);
        return false;
      }
    } catch (error) {
      console.error('💥 Error loading wallets:', error);
      set({ 
        walletsLoading: false,
        walletsError: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  createWallet: async (request: WalletServiceCreateRequest) => {
    const { user } = get();
    if (!user?.id) {
      console.log('⚠️ No user ID available for creating wallet');
      return null;
    }

    // Get Bridge customer ID from Bridge store
    const { default: useBridgeStore } = await import('./bridgeStore');
    const bridgeState = useBridgeStore.getState();
    const bridgeCustomerId = bridgeState.bridgeCustomerId;

    if (!bridgeCustomerId) {
      console.error('❌ No Bridge customer ID available for wallet creation');
      set({ walletsError: 'Bridge customer ID required for wallet creation' });
      return null;
    }

    set({ walletsLoading: true, walletsError: null });
    try {
      console.log('💳 Creating new wallet...');
      
      // Get the actual profile.id from profiles table
      const { supabaseAdmin } = await import('@/app/services/supabaseAdmin');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Failed to get profile for wallet creation:', profileError);
        set({ 
          walletsLoading: false,
          walletsError: 'Profile not found for wallet creation'
        });
        return null;
      }
      
      // Prepare the complete request with all required fields
      const completeRequest: WalletServiceCreateRequest = {
        ...request,
        profileId: request.profileId || profile.id, // Use provided profileId or the one we just fetched
        customerId: bridgeCustomerId,
      };
      
      const result = await walletService.createWallet(completeRequest);
      
      if (result.success && result.data) {
        // Add the new wallet to the current list
        const currentWallets = get().wallets;
        set({ 
          wallets: [...currentWallets, result.data],
          walletsLoading: false,
          walletsError: null
        });
        console.log('✅ Wallet created successfully:', result.data);
        return result.data;
      } else {
        set({ 
          walletsLoading: false,
          walletsError: result.error || 'Failed to create wallet'
        });
        console.error('❌ Failed to create wallet:', result.error);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ 
        walletsLoading: false,
        walletsError: errorMessage
      });
      console.error('💥 Error creating wallet:', error);
      return null;
    }
  },

  syncWallets: async () => {
    const { user } = get();
    if (!user?.id) {
      console.log('⚠️ No user ID available for syncing wallets');
      return { 
        success: false, 
        syncedCount: 0, 
        createdCount: 0, 
        updatedCount: 0, 
        errors: ['No user ID available'] 
      };
    }

    // Get Bridge customer ID from Bridge store
    const { default: useBridgeStore } = await import('./bridgeStore');
    const bridgeState = useBridgeStore.getState();
    const bridgeCustomerId = bridgeState.bridgeCustomerId;

    if (!bridgeCustomerId) {
      console.error('❌ No Bridge customer ID available for wallet sync');
      return { 
        success: false, 
        syncedCount: 0, 
        createdCount: 0, 
        updatedCount: 0, 
        errors: ['Bridge customer ID required for wallet sync'] 
      };
    }

    set({ walletsLoading: true, walletsError: null });
    try {
      console.log('💳 Syncing wallets...');
      
      // Get the actual profile.id from profiles table
      const { supabaseAdmin } = await import('@/app/services/supabaseAdmin');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Failed to get profile for wallet sync:', profileError);
        set({ 
          walletsLoading: false,
          walletsError: 'Profile not found for wallet sync'
        });
        return { 
          success: false, 
          syncedCount: 0, 
          createdCount: 0, 
          updatedCount: 0, 
          errors: ['Profile not found'] 
        };
      }
      
      const result = await walletService.syncWallets(profile.id, bridgeCustomerId);
      
      if (result.success) {
        // Reload wallets after sync
        await get().loadUserWallets();
        set({ walletsLoading: false });
        console.log('✅ Wallets synced successfully');
        return result;
      } else {
        set({ 
          walletsLoading: false,
          walletsError: result.errors.join(', ') || 'Failed to sync wallets'
        });
        console.error('❌ Failed to sync wallets:', result.errors);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ 
        walletsLoading: false,
        walletsError: errorMessage
      });
      console.error('💥 Error syncing wallets:', error);
      return { 
        success: false, 
        syncedCount: 0, 
        createdCount: 0, 
        updatedCount: 0, 
        errors: [errorMessage] 
      };
    }
  },

  refreshWallets: async () => {
    console.log('🔄 Refreshing wallets...');
    return await get().loadUserWallets();
  },

  clearWalletError: () => {
    set({ walletsError: null });
  },

  setWalletLoading: (loading: boolean) => {
    set({ walletsLoading: loading });
  },
}));

export default useAuthStore;
