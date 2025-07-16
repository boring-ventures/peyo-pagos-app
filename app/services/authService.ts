import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type AuthResponse = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
};

export type ProfileData = {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
};

export type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

// Clave para guardar la sesión en AsyncStorage
const SESSION_KEY = 'supabase.session';

// Bucket name from environment variables
const bucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'avatars';

export const authService = {
  /**
   * Iniciar sesión con email y contraseña
   */
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.session) {
        // Guardar sesión en AsyncStorage
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }

      return {
        user: data?.user || null,
        session: data?.session || null,
        error,
      };
    } catch (err) {
      console.error('Error signing in:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  },

  /**
   * Upload a file to Supabase Storage
   */
  uploadFile: async (
    file: ImageFile,
    userId: string,
    contentType = 'image/jpeg',
  ): Promise<string | null> => {
    try {
      if (!file || !file.uri) {
        console.error('Error uploading file: Invalid file object');
        return null;
      }

      const fileExt = file.uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log(`Uploading file: ${filePath}, type: ${contentType}`);
      
      try {
        const arrayBuffer = await (await fetch(file.uri)).arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);

        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileData, {
            contentType,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading file to Supabase:', error);
          return null;
        }

        console.log('File uploaded successfully:', filePath);
        
        // Return only the file path instead of the full URL
        return filePath;
      } catch (fetchError) {
        console.error('Error fetching or processing file data:', fetchError);
        return null;
      }
    } catch (err) {
      console.error('Error in uploadFile:', err);
      return null;
    }
  },

  /**
   * Get the public URL for a file in the storage bucket
   */
  getAvatarUrl: (filePath: string | null): string | null => {
    if (!filePath) return null;
    
    // If it's already a full URL, return it as is
    if (filePath.startsWith('http') || filePath.startsWith('data:')) {
      return filePath;
    }
    
    try {
      console.log(`Getting public URL for: ${filePath} in bucket: ${bucket}`);
      
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      const url = data?.publicUrl || null;
      console.log(`Public URL: ${url}`);
      
      return url;
    } catch (err) {
      console.error('Error getting avatar URL:', err);
      return null;
    }
  },

  /**
   * Registrar un nuevo usuario
   */
  signUp: async (
    email: string,
    password: string,
    profileData: ProfileData,
    avatarFile: ImageFile | null = null,
  ): Promise<AuthResponse> => {
    try {
      // 1. Registrar el usuario
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            avatar_url: profileData.avatar_url,
          },
        },
      });

      // 2. Si hay algún error, retornar
      if (error) {
        return {
          user: null,
          session: null,
          error,
        };
      }

      let avatarUrl: string | null = null;

      // 3. Upload avatar if provided
      if (avatarFile && data.user) {
        avatarUrl = await authService.uploadFile(
          avatarFile,
          data.user.id,
          avatarFile.type
        );
      }

      // 4. Crear perfil en la tabla profiles
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            avatar_url: avatarUrl || profileData.avatar_url,
            updated_at: new Date(),
          });
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      // 5. Guardar sesión si existe
      if (data.session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }

      return {
        user: data?.user || null,
        session: data?.session || null,
        error: null,
      };
    } catch (err) {
      console.error('Error signing up:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  },

  /**
   * Cerrar sesión
   */
  signOut: async (): Promise<{ error: AuthError | null }> => {
    try {
      // Eliminar la sesión del AsyncStorage
      await AsyncStorage.removeItem(SESSION_KEY);
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error('Error signing out:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Recuperar sesión almacenada
   */
  getStoredSession: async (): Promise<Session | null> => {
    try {
      const sessionString = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionString) {
        return JSON.parse(sessionString) as Session;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  },

  /**
   * Recuperar sesión actual desde Supabase
   */
  getSession: async (): Promise<Session | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      
      // Si hay una sesión activa, actualizarla en AsyncStorage
      if (data.session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }
      
      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Recuperar usuario actual
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Obtener perfil de usuario por ID
   */
  getProfile: async (userId: string): Promise<ProfileData | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, phone, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as ProfileData;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, profileData: Partial<ProfileData>): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date(),
        })
        .eq('id', userId);

      return { error };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: err as Error };
    }
  },

  /**
   * Restablecer contraseña
   */
  resetPassword: async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'peyo://reset-password', // Deep link for mobile app
      });
      return { error };
    } catch (err) {
      console.error('Error resetting password:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Send OTP verification code
   */
  sendOTP: async (email: string, type: 'signup' | 'recovery' = 'signup'): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: type === 'signup',
        },
      });
      return { error };
    } catch (err) {
      console.error('Error sending OTP:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Verify OTP code
   */
  verifyOTP: async (
    email: string, 
    token: string, 
    type: 'signup' | 'recovery' = 'signup'
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (data.session) {
        // Save session to AsyncStorage
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }

      return {
        user: data?.user || null,
        session: data?.session || null,
        error,
      };
    } catch (err) {
      console.error('Error verifying OTP:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  },

  /**
   * Resend OTP code
   */
  resendOTP: async (email: string, type: 'signup' | 'recovery' = 'signup'): Promise<{ error: AuthError | null }> => {
    try {
      return await authService.sendOTP(email, type);
    } catch (err) {
      console.error('Error resending OTP:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Send WhatsApp OTP verification code
   */
  sendWhatsAppOTP: async (phone: string, type: 'signup' | 'recovery' = 'signup'): Promise<{ error: AuthError | null }> => {
    try {
      console.log('📱 Sending WhatsApp OTP to:', phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
          shouldCreateUser: type === 'signup',
        },
      });
      console.log('📱 WhatsApp OTP response:', { error });
      return { error };
    } catch (err) {
      console.error('Error sending WhatsApp OTP:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Verify WhatsApp OTP code
   */
  verifyWhatsAppOTP: async (
    phone: string, 
    token: string, 
    type: 'signup' | 'recovery' = 'signup'
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms', // Use 'sms' type for both SMS and WhatsApp verification
      });

      if (data.session) {
        // Save session to AsyncStorage
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }

      return {
        user: data?.user || null,
        session: data?.session || null,
        error,
      };
    } catch (err) {
      console.error('Error verifying WhatsApp OTP:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  },

  /**
   * Resend WhatsApp OTP code
   */
  resendWhatsAppOTP: async (phone: string, type: 'signup' | 'recovery' = 'signup'): Promise<{ error: AuthError | null }> => {
    try {
      return await authService.sendWhatsAppOTP(phone, type);
    } catch (err) {
      console.error('Error resending WhatsApp OTP:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Format phone number to E.164 format
   */
  formatPhoneToE164: (phone: string, countryCode: string = '+591'): string => {
    if (!phone || !countryCode) {
      throw new Error('Phone number and country code are required');
    }

    // Remove all non-numeric characters from phone
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Remove + from country code for comparison
    const countryDigits = countryCode.replace(/\D/g, '');
    
    // If phone is empty after cleaning, throw error
    if (!cleanedPhone) {
      throw new Error('Invalid phone number');
    }
    
    // If phone already starts with country code, return it formatted
    if (cleanedPhone.startsWith(countryDigits)) {
      return '+' + cleanedPhone;
    }
    
    // Remove leading zero if present (common in local numbers)
    const phoneWithoutLeadingZero = cleanedPhone.replace(/^0+/, '');
    
    // Combine country code with cleaned phone number
    const fullNumber = countryDigits + phoneWithoutLeadingZero;
    
    // Validate E.164 format (1-15 digits after +)
    if (fullNumber.length < 8 || fullNumber.length > 15) {
      throw new Error(`Invalid phone number length. Got ${fullNumber.length} digits, expected 8-15`);
    }
    
    return '+' + fullNumber;
  },

  /**
   * Format phone number for display
   */
  formatPhoneForDisplay: (phone: string): string => {
    if (!phone || !phone.startsWith('+')) {
      return phone;
    }

    // Extract country code and number
    const match = phone.match(/^(\+\d{1,4})(\d+)$/);
    if (!match) {
      return phone;
    }

    const [, countryCode, number] = match;
    
    // Format based on country code
    if (countryCode === '+591' && number.length === 8) {
      // Bolivia: +591 7483 0949
      return `${countryCode} ${number.substring(0, 4)} ${number.substring(4)}`;
    } else if (countryCode === '+502' && number.length === 8) {
      // Guatemala: +502 5555 1234
      return `${countryCode} ${number.substring(0, 4)} ${number.substring(4)}`;
    } else {
      // Default formatting: +XXX XXX XXX XXXX
      const groups = number.match(/(\d{1,3})(\d{1,3})?(\d{1,4})?/);
      if (groups) {
        const formatted = [countryCode, groups[1], groups[2], groups[3]]
          .filter(Boolean)
          .join(' ');
        return formatted;
      }
    }
    
    return phone;
  },

  /**
   * Complete email registration with WhatsApp verification
   * Links WhatsApp-verified phone to email account
   */
  completeEmailRegistration: async (
    email: string,
    password: string,
    profileData: ProfileData,
    whatsappSession: Session,
    avatarFile: ImageFile | null = null,
  ): Promise<AuthResponse> => {
    try {
      // 1. Create email account
      const { data: emailSignUp, error: emailError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            avatar_url: profileData.avatar_url,
            phone_verified: true, // Mark as phone verified
          },
        },
      });

      if (emailError) {
        return {
          user: null,
          session: null,
          error: emailError,
        };
      }

      let avatarUrl: string | null = null;

      // 2. Upload avatar if provided
      if (avatarFile && emailSignUp.user) {
        avatarUrl = await authService.uploadFile(
          avatarFile,
          emailSignUp.user.id,
          avatarFile.type
        );
      }

      // 3. Create profile in the profiles table
      if (emailSignUp.user) {
        try {
          await supabase.from('profiles').upsert({
            id: emailSignUp.user.id,
            email,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            avatar_url: avatarUrl || profileData.avatar_url,
            phone_verified: true,
            updated_at: new Date(),
          });
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      // 4. Use the WhatsApp session as the active session
      if (whatsappSession) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(whatsappSession));
      }

      return {
        user: emailSignUp?.user || null,
        session: whatsappSession,
        error: null,
      };
    } catch (err) {
      console.error('Error completing email registration:', err);
      return {
        user: null,
        session: null,
        error: err as AuthError,
      };
    }
  },
};

export default authService; 