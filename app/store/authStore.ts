import { ImageFile } from "@/app/components/ImagePickerModal";
import { authService } from "@/app/services/authService";
import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { VerificationStatus } from "../types/KycTypes";

type ProfileState = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
};

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profile: ProfileState | null;
  error: string | null;
  kycStatus: VerificationStatus;

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
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  profile: null,
  error: null,
  kycStatus: 'pending',

  initialize: async () => {
    set({ isLoading: true });
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
          }
        }

        set({
          isAuthenticated: true,
          user,
          profile: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: user.email || profileData.email || "",
            avatar_url: profileData.avatar_url,
          },
        });

        return true;
      }

      // Si no hay sesión en AsyncStorage o no es válida, verificar con Supabase
      const session = await authService.getSession();

      if (session?.user) {
        const user = session.user;
        const userData = user.user_metadata as ProfileState;

        set({
          isAuthenticated: true,
          user,
          profile: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: user.email || "",
            avatar_url: userData.avatar_url,
          },
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
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.signIn(email, password);

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (user) {
        const userData = user.user_metadata as ProfileState;
        const dbProfile = await authService.getProfile(user?.id || "");

        if (dbProfile) {
          userData.avatar_url = dbProfile.avatar_url;
        }

        set({
          isAuthenticated: true,
          user,
          profile: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: user.email || userData.email || "",
            avatar_url: userData.avatar_url,
          },
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

  register: async (email, password, profile, avatar) => {
    set({ isLoading: true, error: null });
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
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({
        isAuthenticated: false,
        user: null,
        profile: null,
      });
    } catch (error) {
      console.error("Error logging out:", error);
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
}));

export default useAuthStore;
