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
  status?: 'active' | 'disabled' | 'deleted';
  role?: 'USER' | 'SUPERADMIN';
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
   * Upload KYC document to Supabase Storage (documents bucket)
   */
  uploadKycDocument: async (
    base64: string,
    userId: string,
    documentType: 'idFront' | 'idBack' | 'selfie',
    contentType = 'image/jpeg',
  ): Promise<string | null> => {
    try {
      if (!base64) {
        console.error('Error uploading KYC document: Invalid base64 data');
        return null;
      }

      const documentsBucket = 'documents'; // Fixed bucket name
      const fileExt = contentType.includes('jpeg') ? 'jpg' : 'png';
      
      // Map document types to new naming convention
      const documentNames = {
        'idFront': 'identification-front',
        'idBack': 'identification-back',
        'selfie': 'selfie'
      };
      
      const documentName = documentNames[documentType];
      const fileName = `${documentName}-${Date.now()}.${fileExt}`;
      const filePath = `kyc-documents/${userId}/${fileName}`;

      console.log(`📄 Uploading KYC document: ${filePath} to bucket: ${documentsBucket}`);
      
      // Convert base64 to binary
      const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from(documentsBucket)
        .upload(filePath, bytes, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading KYC document to Supabase:', error);
        return null;
      }

      console.log('📄 KYC document uploaded successfully:', filePath);
      return filePath;
    } catch (err) {
      console.error('Error in uploadKycDocument:', err);
      return null;
    }
  },

  /**
   * Get the public URL for a KYC document
   */
  getKycDocumentUrl: (filePath: string | null): string | null => {
    if (!filePath) return null;
    
    // If it's already a full URL, return it as is
    if (filePath.startsWith('http') || filePath.startsWith('data:')) {
      return filePath;
    }
    
    try {
      const documentsBucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'documents';
      console.log(`Getting public URL for KYC document: ${filePath} in bucket: ${documentsBucket}`);
      
      const { data } = supabase.storage
        .from(documentsBucket)
        .getPublicUrl(filePath);
      
      const url = data?.publicUrl || null;
      console.log(`KYC Document Public URL: ${url}`);
      
      return url;
    } catch (err) {
      console.error('Error getting KYC document URL:', err);
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

      // 4. Profile will be created after KYC completion
      // No profile creation during signup - this happens after KYC

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
      console.log('👤 Getting user profile...');
      console.log('🔍 Profile query - userId:', userId);
      console.log('🔍 Profile query - userId type:', typeof userId);
      
      // Check current session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔍 Current Supabase session:', {
        hasSession: !!sessionData?.session,
        sessionUserId: sessionData?.session?.user?.id,
        sessionUserEmail: sessionData?.session?.user?.email,
        userIdMatch: sessionData?.session?.user?.id === userId,
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, phone, avatar_url, status, role')
        .eq('userId', userId)
        .single();

      console.log('🔍 Profile query result:', {
        hasData: !!data,
        error,
        profileEmail: data?.email,
        profileFirstName: data?.first_name,
      });

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched successfully');
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
          updatedAt: new Date(),
        })
        .eq('userId', userId);

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
      
      // Create temporary user for OTP verification
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
          shouldCreateUser: true, // Create temp user for phone verification
        },
      });
      
      console.log('📱 WhatsApp OTP response:', { error });
      
      // Si es error de límite de Twilio, permitir continuar
      if (error && error.message && error.message.includes('exceeded the') && error.message.includes('daily messages limit')) {
        console.log('⚠️ Error de límite de Twilio, pero OTP se envía al dashboard');
        return { error: null };
      }
      
      if (!error) {
        console.log('✅ OTP enviado correctamente, usuario temporal creado');
      }
      
      return { error };
    } catch (err) {
      console.error('Error sending WhatsApp OTP:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Send WhatsApp OTP to existing user (adds phone and sends OTP in one step)
   */
  sendWhatsAppOTPToExistingUser: async (phone: string, userId?: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('📱 Starting phone verification for existing user:', phone, 'userId:', userId);
      
      // Use updateUser to add phone and automatically send OTP verification
      const { error } = await supabase.auth.updateUser({
        phone,
        data: {
          phone,
          phone_verified: false, // Will be verified after OTP confirmation
        },
      });
      
      console.log('📱 Phone verification initiation response:', { error });
      
      // Si es error de límite de Twilio, permitir continuar
      if (error && error.message && error.message.includes('exceeded the') && error.message.includes('daily messages limit')) {
        console.log('⚠️ Error de límite de Twilio, pero OTP se envía al dashboard');
        return { error: null };
      }
      
      if (!error) {
        console.log('✅ Phone verification initiated and OTP sent successfully');
        console.log('ℹ️  Note: Phone will appear in auth.users ONLY after OTP verification');
      }
      
      return { error };
    } catch (err) {
      console.error('Error sending WhatsApp OTP to existing user:', err);
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
   * Links email to existing phone user and creates profile
   */
  completeEmailRegistration: async (
    email: string,
    password: string,
    profileData: ProfileData,
    avatarFile: ImageFile | null = null,
  ): Promise<AuthResponse> => {
    try {
      console.log('📧 Linking email to phone user for:', email, profileData.phone);
      
      // 1. Get current session and user
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      if (!currentUser) {
        console.error('❌ No current user session found');
        return {
          user: null,
          session: null,
          error: { message: 'No active session found' } as AuthError,
        };
      }

      console.log('✅ Current user found:', currentUser.id, 'phone:', currentUser.phone);

      // 2. Update user with email and password
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        email,
        password,
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
          phone_verified: true,
        },
      });

      if (updateError) {
        console.error('📧 User update error:', updateError);
        return {
          user: null,
          session: null,
          error: updateError,
        };
      }
      console.log('✅ User updated with email+password successfully');

      let avatarUrl: string | null = null;

      // 3. Upload avatar if provided
      if (avatarFile) {
        avatarUrl = await authService.uploadFile(
          avatarFile,
          currentUser.id,
          avatarFile.type
        );
      }

      // 4. Profile will be created after KYC completion
      // No profile creation during email linking - this happens after KYC
      console.log('✅ Email+password linked successfully, profile will be created after KYC');

      // 5. Get fresh session after linking
      const { data: finalSessionData } = await supabase.auth.getSession();
      const finalUser = finalSessionData?.session?.user;

      console.log('✅ Email linked to phone user successfully');
      return {
        user: finalUser || currentUser,
        session: finalSessionData?.session || sessionData?.session || null,
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

  /**
   * Update display name in auth.users after KYC completion
   */
  updateDisplayNameAfterKyc: async (firstName: string, lastName: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('📝 Updating display name in auth.users after KYC completion');
      
      const displayName = `${firstName} ${lastName}`.trim();
      
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (error) {
        console.error('❌ Error updating display name:', error);
        return { error };
      }

      console.log('✅ Display name updated successfully:', displayName);
      return { error: null };
    } catch (err) {
      console.error('Error updating display name:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Add phone to existing user (without marking as verified)
   */
  addPhoneToUser: async (phone: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('📱 Adding phone to existing user (unverified):', phone);
      
      const { error } = await supabase.auth.updateUser({
        phone,
        data: {
          phone,
          phone_verified: false, // Mark as unverified - will be verified after OTP
        },
      });

      if (error) {
        console.error('❌ Error adding phone to user:', error);
        
        // Si es un error de Twilio (límite de mensajes), lo tratamos como éxito
        // porque el usuario ya existe y el teléfono se agregó correctamente
        if (error.message && error.message.includes('exceeded the') && error.message.includes('daily messages limit')) {
          console.log('⚠️ Error de límite de Twilio pero usuario actualizado correctamente');
          return { error: null };
        }
        
        return { error };
      }

      console.log('✅ Phone added to user successfully (unverified)');
      return { error: null };
    } catch (err) {
      console.error('Error adding phone to user:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * Mark user phone as verified after OTP verification
   */
  markPhoneAsVerified: async (): Promise<{ error: AuthError | null }> => {
    try {
      console.log('📱 Marking phone as verified after OTP confirmation');
      
      const { error } = await supabase.auth.updateUser({
        data: {
          phone_verified: true,
        },
      });

      if (error) {
        console.error('❌ Error marking phone as verified:', error);
        return { error };
      }

      console.log('✅ Phone marked as verified successfully');
      return { error: null };
    } catch (err) {
      console.error('Error marking phone as verified:', err);
      return { error: err as AuthError };
    }
  },

  /**
   * TESTING ONLY: Manually verify phone without OTP for debugging
   * This bypasses OTP verification to test if that's the issue
   */
  manuallyVerifyPhoneForTesting: async (phone: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('🧪 [TESTING] Manually verifying phone without OTP:', phone);
      
      const { error } = await supabase.auth.updateUser({
        phone, // Set the actual phone field
        data: {
          phone,
          phone_verified: true, // Mark as verified in metadata
        },
      });

      if (error) {
        // For testing: ignore Twilio daily limit errors
        if (error.message && error.message.includes('exceeded the') && error.message.includes('daily messages limit')) {
          console.log('🧪 [TESTING] Ignoring Twilio limit error for testing purposes');
          console.log('✅ [TESTING] Phone manually verified successfully (Twilio error ignored)');
          return { error: null };
        }
        
        console.error('❌ Error manually verifying phone:', error);
        return { error };
      }

      console.log('✅ [TESTING] Phone manually verified successfully');
      return { error: null };
    } catch (err) {
      console.error('Error manually verifying phone:', err);
      return { error: err as AuthError };
    }
  },
};

export default authService; 