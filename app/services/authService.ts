import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabaseAdmin"; // Added import for supabaseAdmin
import { supabase } from "./supabaseClient";


// Session key for AsyncStorage
const SESSION_KEY = "supabase.session";

// Variable de entorno para controlar verificación telefónica
const PHONE_VERIFICATION_ENABLED =
  process.env.EXPO_PUBLIC_PHONE_VERIFICATION_ENABLED === "true";

// Image file interface (keeping the local definition)
interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

// Auth response interfaces
interface AuthResponse {
  user: User | null;
  session?: any;
  error: AuthError | null;
}

// Profile data interface
interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status?: 'active' | 'disabled' | 'deleted';
  role?: 'USER' | 'SUPERADMIN';
  user_tag?: string | null;
}

// Bucket name from environment variables
const bucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "avatars";

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
      console.error("Error signing in:", err);
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
    contentType = "image/jpeg"
  ): Promise<string | null> => {
    try {
      if (!file || !file.uri) {
        console.error("Error uploading file: Invalid file object");
        return null;
      }

      const fileExt = file.uri.split(".").pop();
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
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Error uploading file to Supabase:", error);
          return null;
        }

        console.log("File uploaded successfully:", filePath);

        // Return only the file path instead of the full URL
        return filePath;
      } catch (fetchError) {
        console.error("Error fetching or processing file data:", fetchError);
        return null;
      }
    } catch (err) {
      console.error("Error in uploadFile:", err);
      return null;
    }
  },

  /**
   * Get the public URL for a file in the storage bucket
   */
  getAvatarUrl: (filePath: string | null): string | null => {
    if (!filePath) return null;

    // If it's already a full URL, return it as is
    if (filePath.startsWith("http") || filePath.startsWith("data:")) {
      return filePath;
    }

    try {
      console.log(`Getting public URL for: ${filePath} in bucket: ${bucket}`);

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      const url = data?.publicUrl || null;
      console.log(`Public URL: ${url}`);

      return url;
    } catch (err) {
      console.error("Error getting avatar URL:", err);
      return null;
    }
  },

  /**
   * Upload KYC document to Supabase Storage (documents bucket)
   */
  uploadKycDocument: async (
    base64: string,
    userId: string,
    documentType: "idFront" | "idBack" | "selfie",
    contentType = "image/jpeg"
  ): Promise<string | null> => {
    try {
      if (!base64) {
        console.error("Error uploading KYC document: Invalid base64 data");
        return null;
      }

      const documentsBucket = "documents"; // Fixed bucket name
      const fileExt = contentType.includes("jpeg") ? "jpg" : "png";

      // Map document types to new naming convention
      const documentNames = {
        idFront: "identification-front",
        idBack: "identification-back",
        selfie: "selfie",
      };

      const documentName = documentNames[documentType];
      const fileName = `${documentName}-${Date.now()}.${fileExt}`;
      const filePath = `kyc-documents/${userId}/${fileName}`;

      console.log(
        `📄 Uploading KYC document: ${filePath} to bucket: ${documentsBucket}`
      );

      // Convert base64 to binary
      const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from(documentsBucket)
        .upload(filePath, bytes, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading KYC document to Supabase:", error);
        return null;
      }

      console.log("📄 KYC document uploaded successfully:", filePath);
      return filePath;
    } catch (err) {
      console.error("Error in uploadKycDocument:", err);
      return null;
    }
  },

  /**
   * Get the public URL for a KYC document
   */
  getKycDocumentUrl: (filePath: string | null): string | null => {
    if (!filePath) return null;

    // If it's already a full URL, return it as is
    if (filePath.startsWith("http") || filePath.startsWith("data:")) {
      return filePath;
    }

    try {
      const documentsBucket =
        process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "documents";
      console.log(
        `Getting public URL for KYC document: ${filePath} in bucket: ${documentsBucket}`
      );

      const { data } = supabase.storage
        .from(documentsBucket)
        .getPublicUrl(filePath);

      const url = data?.publicUrl || null;
      console.log(`KYC Document Public URL: ${url}`);

      return url;
    } catch (err) {
      console.error("Error getting KYC document URL:", err);
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
    avatarFile: ImageFile | null = null
  ): Promise<AuthResponse> => {
    try {
      console.log("🔐 Starting sign up process for:", email);

      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        console.log("📸 Uploading avatar...");

        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const formData = new FormData();
        formData.append("file", {
          uri: avatarFile.uri,
          type: avatarFile.type,
          name: fileName,
        } as any);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, formData);

        if (uploadError) {
          console.error("❌ Error uploading avatar:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          avatarUrl = urlData?.publicUrl;
          console.log("✅ Avatar uploaded successfully:", avatarUrl);
        }
      }

      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email: profileData.email,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            avatar_url: avatarUrl,
          },
        },
      });

      if (error) {
        console.error("❌ Error creating user account:", error);
        return {
          user: null,
          session: null,
          error: error,
        };
      }

      console.log("✅ User account created successfully:", data.user?.id);

      // Note: Sign up event will be tracked after profile creation in profileService.createProfileAfterKyc()
      // This ensures the profile_id exists in the profiles table before creating the event

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      console.error("💥 Error in sign up:", err);
      const error = err as Error;
      return {
        user: null,
        session: null,
        error: error as AuthError,
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
      console.error("Error signing out:", err);
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
      console.error("Error getting stored session:", error);
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
      console.error("Error getting session:", error);
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
      console.error("Error getting current user:", error);
      return null;
    }
  },

  /**
   * Obtener perfil de usuario por ID
   */
  getProfile: async (userId: string): Promise<ProfileData | null> => {
    try {
      console.log("👤 Getting user profile...");
      console.log("🔍 Profile query - userId:", userId);
      console.log("🔍 Profile query - userId type:", typeof userId);

      // Check current session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("🔍 Current Supabase session:", {
        hasSession: !!sessionData?.session,
        sessionUserId: sessionData?.session?.user?.id,
        sessionUserEmail: sessionData?.session?.user?.email,
        userIdMatch: sessionData?.session?.user?.id === userId,
      });

      // Use admin client for reliable access
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("email, first_name, last_name, status, role, user_tag") // 🏷️ NEW: Include user_tag
        .eq("userId", userId)
        .single();

      console.log("🔍 Profile query result:", {
        hasData: !!data,
        error,
        profileEmail: data?.email,
        profileFirstName: data?.first_name,
      });

      if (error) {
        console.error("❌ Error fetching profile:", error);
        return null;
      }

      console.log("✅ Profile fetched successfully");
      return data as ProfileData;
    } catch (error) {
      console.error("💥 Error getting profile:", error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    userId: string,
    profileData: Partial<ProfileData>
  ): Promise<{ error: Error | null }> => {
    try {
      // Use admin client for reliable updates
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          ...profileData,
          updatedAt: new Date().toISOString(),
        })
        .eq("userId", userId);

      return { error };
    } catch (err) {
      console.error("Error updating profile:", err);
      return { error: err as Error };
    }
  },

  /**
   * Restablecer contraseña
   */
  resetPassword: async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "peyo://reset-password", // Deep link for mobile app
      });
      return { error };
    } catch (err) {
      console.error("Error resetting password:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Send OTP verification code
   */
  sendOTP: async (
    email: string,
    type: "signup" | "recovery" = "signup"
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: type === "signup",
        },
      });
      return { error };
    } catch (err) {
      console.error("Error sending OTP:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Verify OTP code
   */
  verifyOTP: async (
    email: string,
    token: string,
    type: "signup" | "recovery" = "signup"
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
      console.error("Error verifying OTP:", err);
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
  resendOTP: async (
    email: string,
    type: "signup" | "recovery" = "signup"
  ): Promise<{ error: AuthError | null }> => {
    try {
      return await authService.sendOTP(email, type);
    } catch (err) {
      console.error("Error resending OTP:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Send WhatsApp OTP verification code
   */
  sendWhatsAppOTP: async (
    phone: string,
    type: "signup" | "recovery" = "signup"
  ): Promise<{ error: AuthError | null }> => {
    try {
      console.log("📱 Sending WhatsApp OTP to:", phone);

      // Si la verificación telefónica está deshabilitada, simular éxito
      if (!PHONE_VERIFICATION_ENABLED) {
        console.log(
          "⚠️ Phone verification disabled in environment, simulating success"
        );
        return { error: null };
      }

      // Create temporary user for OTP verification
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "sms",
          shouldCreateUser: true, // Create temp user for phone verification
        },
      });

      console.log("📱 WhatsApp OTP response:", { error });

      // Si es error de límite de Twilio, permitir continuar
      if (
        error &&
        error.message &&
        error.message.includes("exceeded the") &&
        error.message.includes("daily messages limit")
      ) {
        console.log(
          "⚠️ Error de límite de Twilio, pero OTP se envía al dashboard"
        );
        return { error: null };
      }

      if (!error) {
        console.log("✅ OTP enviado correctamente, usuario temporal creado");
      }

      return { error };
    } catch (err) {
      console.error("Error sending WhatsApp OTP:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Send WhatsApp OTP to existing user (adds phone and sends OTP in one step)
   */
  sendWhatsAppOTPToExistingUser: async (
    phone: string,
    userId?: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      console.log(
        "📱 Starting phone verification for existing user:",
        phone,
        "userId:",
        userId
      );

      // Si la verificación telefónica está deshabilitada, simular éxito
      if (!PHONE_VERIFICATION_ENABLED) {
        console.log(
          "⚠️ Phone verification disabled in environment, simulating success"
        );
        return { error: null };
      }

      // Use updateUser to add phone and automatically send OTP verification
      const { error } = await supabase.auth.updateUser({
        phone,
        data: {
          phone,
          phone_verified: false, // Will be verified after OTP confirmation
        },
      });

      console.log("📱 Phone verification initiation response:", { error });

      // Si es error de límite de Twilio, permitir continuar
      if (
        error &&
        error.message &&
        error.message.includes("exceeded the") &&
        error.message.includes("daily messages limit")
      ) {
        console.log(
          "⚠️ Error de límite de Twilio, pero OTP se envía al dashboard"
        );
        return { error: null };
      }

      if (!error) {
        console.log(
          "✅ Phone verification initiated and OTP sent successfully"
        );
        console.log(
          "ℹ️  Note: Phone will appear in auth.users ONLY after OTP verification"
        );
      }

      return { error };
    } catch (err) {
      console.error("Error sending WhatsApp OTP to existing user:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Verify WhatsApp OTP code
   */
  verifyWhatsAppOTP: async (
    phone: string,
    token: string,
    type: "signup" | "recovery" = "signup"
  ): Promise<AuthResponse> => {
    try {
      // Si la verificación telefónica está deshabilitada, simular verificación exitosa
      if (!PHONE_VERIFICATION_ENABLED) {
        console.log(
          "⚠️ Phone verification disabled in environment, simulating successful verification"
        );

        // Obtener la sesión actual
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;

        if (currentUser) {
          // Marcar el teléfono como verificado en los metadatos
          await supabase.auth.updateUser({
            data: {
              phone_verified: true,
            },
          });

          return {
            user: currentUser,
            session: sessionData?.session || null,
            error: null,
          };
        }
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms", // Use 'sms' type for both SMS and WhatsApp verification
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
      console.error("Error verifying WhatsApp OTP:", err);
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
  resendWhatsAppOTP: async (
    phone: string,
    type: "signup" | "recovery" = "signup"
  ): Promise<{ error: AuthError | null }> => {
    try {
      return await authService.sendWhatsAppOTP(phone, type);
    } catch (err) {
      console.error("Error resending WhatsApp OTP:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Format phone number to E.164 format
   */
  formatPhoneToE164: (phone: string, countryCode: string = "+591"): string => {
    if (!phone || !countryCode) {
      throw new Error("Phone number and country code are required");
    }

    // Remove all non-numeric characters from phone
    const cleanedPhone = phone.replace(/\D/g, "");

    // Remove + from country code for comparison
    const countryDigits = countryCode.replace(/\D/g, "");

    // If phone is empty after cleaning, throw error
    if (!cleanedPhone) {
      throw new Error("Invalid phone number");
    }

    // If phone already starts with country code, return it formatted
    if (cleanedPhone.startsWith(countryDigits)) {
      return "+" + cleanedPhone;
    }

    // Remove leading zero if present (common in local numbers)
    const phoneWithoutLeadingZero = cleanedPhone.replace(/^0+/, "");

    // Combine country code with cleaned phone number
    const fullNumber = countryDigits + phoneWithoutLeadingZero;

    // Validate E.164 format (1-15 digits after +)
    if (fullNumber.length < 8 || fullNumber.length > 15) {
      throw new Error(
        `Invalid phone number length. Got ${fullNumber.length} digits, expected 8-15`
      );
    }

    return "+" + fullNumber;
  },

  /**
   * Format phone number for display
   */
  formatPhoneForDisplay: (phone: string): string => {
    if (!phone || !phone.startsWith("+")) {
      return phone;
    }

    // Extract country code and number
    const match = phone.match(/^(\+\d{1,4})(\d+)$/);
    if (!match) {
      return phone;
    }

    const [, countryCode, number] = match;

    // Format based on country code
    if (countryCode === "+591" && number.length === 8) {
      // Bolivia: +591 7483 0949
      return `${countryCode} ${number.substring(0, 4)} ${number.substring(4)}`;
    } else if (countryCode === "+502" && number.length === 8) {
      // Guatemala: +502 5555 1234
      return `${countryCode} ${number.substring(0, 4)} ${number.substring(4)}`;
    } else {
      // Default formatting: +XXX XXX XXX XXXX
      const groups = number.match(/(\d{1,3})(\d{1,3})?(\d{1,4})?/);
      if (groups) {
        const formatted = [countryCode, groups[1], groups[2], groups[3]]
          .filter(Boolean)
          .join(" ");
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
    avatarFile: ImageFile | null = null
  ): Promise<AuthResponse> => {
    try {
      console.log(
        "📧 Linking email to phone user for:",
        email,
        profileData.phone
      );

      // 1. Get current session and user
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        console.error("❌ No current user session found");
        return {
          user: null,
          session: null,
          error: { message: "No active session found" } as AuthError,
        };
      }

      console.log(
        "✅ Current user found:",
        currentUser.id,
        "phone:",
        currentUser.phone
      );

      // 2. Update user with email and password
      const { data: updateData, error: updateError } =
        await supabase.auth.updateUser({
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
        console.error("📧 User update error:", updateError);
        return {
          user: null,
          session: null,
          error: updateError,
        };
      }
      console.log("✅ User updated with email+password successfully");

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
      console.log(
        "✅ Email+password linked successfully, profile will be created after KYC"
      );

      // 5. Get fresh session after linking
      const { data: finalSessionData } = await supabase.auth.getSession();
      const finalUser = finalSessionData?.session?.user;

      console.log("✅ Email linked to phone user successfully");
      return {
        user: finalUser || currentUser,
        session: finalSessionData?.session || sessionData?.session || null,
        error: null,
      };
    } catch (err) {
      console.error("Error completing email registration:", err);
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
  updateDisplayNameAfterKyc: async (
    firstName: string,
    lastName: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      console.log(
        "📝 Updating display name in auth.users after KYC completion"
      );

      const displayName = `${firstName} ${lastName}`.trim();

      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (error) {
        console.error("❌ Error updating display name:", error);
        return { error };
      }

      console.log("✅ Display name updated successfully:", displayName);
      return { error: null };
    } catch (err) {
      console.error("Error updating display name:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Add phone to existing user (without marking as verified)
   */
  addPhoneToUser: async (
    phone: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      console.log("📱 Adding phone to existing user (unverified):", phone);

      // Si la verificación telefónica está deshabilitada, simular éxito
      if (!PHONE_VERIFICATION_ENABLED) {
        console.log(
          "⚠️ Phone verification disabled in environment, simulating phone added"
        );
        return { error: null };
      }

      const { error } = await supabase.auth.updateUser({
        phone,
        data: {
          phone,
          phone_verified: false, // Mark as unverified - will be verified after OTP
        },
      });

      if (error) {
        console.error("❌ Error adding phone to user:", error);

        // Si es un error de Twilio (límite de mensajes), lo tratamos como éxito
        // porque el usuario ya existe y el teléfono se agregó correctamente
        if (
          error.message &&
          error.message.includes("exceeded the") &&
          error.message.includes("daily messages limit")
        ) {
          console.log(
            "⚠️ Error de límite de Twilio pero usuario actualizado correctamente"
          );
          return { error: null };
        }

        return { error };
      }

      console.log("✅ Phone added to user successfully (unverified)");
      return { error: null };
    } catch (err) {
      console.error("Error adding phone to user:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Mark user phone as verified after OTP verification
   */
  markPhoneAsVerified: async (): Promise<{ error: AuthError | null }> => {
    try {
      console.log("📱 Marking phone as verified after OTP confirmation");

      // Si la verificación telefónica está deshabilitada, simular éxito
      if (!PHONE_VERIFICATION_ENABLED) {
        console.log(
          "⚠️ Phone verification disabled in environment, simulating phone verified"
        );
        return { error: null };
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          phone_verified: true,
        },
      });

      if (error) {
        console.error("❌ Error marking phone as verified:", error);
        return { error };
      }

      console.log("✅ Phone marked as verified successfully");
      return { error: null };
    } catch (err) {
      console.error("Error marking phone as verified:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * TESTING ONLY: Manually verify phone without OTP for debugging
   * This bypasses OTP verification to test if that's the issue
   */
  manuallyVerifyPhoneForTesting: async (
    phone: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      console.log("🧪 [TESTING] Manually verifying phone without OTP:", phone);

      const { error } = await supabase.auth.updateUser({
        phone, // Set the actual phone field
        data: {
          phone,
          phone_verified: true, // Mark as verified in metadata
        },
      });

      if (error) {
        // For testing: ignore Twilio daily limit errors
        if (
          error.message &&
          error.message.includes("exceeded the") &&
          error.message.includes("daily messages limit")
        ) {
          console.log(
            "🧪 [TESTING] Ignoring Twilio limit error for testing purposes"
          );
          console.log(
            "✅ [TESTING] Phone manually verified successfully (Twilio error ignored)"
          );
          return { error: null };
        }

        console.error("❌ Error manually verifying phone:", error);
        return { error };
      }

      console.log("✅ [TESTING] Phone manually verified successfully");
      return { error: null };
    } catch (err) {
      console.error("Error manually verifying phone:", err);
      return { error: err as AuthError };
    }
  },

  /**
   * Validate user status and profile in database
   */
  validateUserStatus: async (
    userId: string
  ): Promise<{
    isValid: boolean;
    status: "active" | "disabled" | "deleted";
    role: "USER" | "SUPERADMIN";
    hasProfile: boolean;
    error?: string;
  }> => {
    try {
      console.log("🔍 Validating user status in database...", { userId });

      // Use admin client to bypass RLS issues
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("status, role")
        .eq("userId", userId)
        .single();

      if (error) {
        console.error("❌ Error fetching user profile:", error);
        return {
          isValid: false,
          status: "disabled",
          role: "USER",
          hasProfile: false,
          error: `Profile fetch failed: ${error.message}`,
        };
      }

      if (!profile) {
        console.warn("⚠️ No profile found for user");
        return {
          isValid: false,
          status: "disabled",
          role: "USER",
          hasProfile: false,
          error: "No profile found",
        };
      }

      const isValid = profile.status === "active";

      console.log("✅ User validation result:", {
        userId,
        status: profile.status,
        role: profile.role,
        isValid,
      });

      return {
        isValid,
        status: profile.status,
        role: profile.role,
        hasProfile: true,
      };
    } catch (err) {
      console.error("💥 Error validating user status:", err);
      return {
        isValid: false,
        status: "disabled",
        role: "USER",
        hasProfile: false,
        error: `Validation failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Check KYC status for user
   */
  checkKycStatus: async (
    userId: string
  ): Promise<{
    hasKyc: boolean;
    kycStatus: string;
    bridgeCustomerId?: string;
    signedAgreementId?: string;
    tosAcceptedAt?: string;
    canProceed: boolean;
    error?: string;
  }> => {
    try {
      console.log("🔍 Checking KYC status...", { userId });

      // First check if we have profile_id from profiles table using admin client
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("userId", userId)
        .single();

      if (profileError || !profile) {
        console.warn("⚠️ No profile found, KYC not started");
        return {
          hasKyc: false,
          kycStatus: "not_started",
          canProceed: false,
          error: "Profile not found",
        };
      }

      // Check KYC profile using admin client
      const { data: kycProfile, error: kycError } = await supabaseAdmin
        .from("kyc_profiles")
        .select("kyc_status, bridge_customer_id, signed_agreement_id")
        .eq("profile_id", profile.id)
        .single();

      if (kycError || !kycProfile) {
        console.warn("⚠️ No KYC profile found");
        return {
          hasKyc: false,
          kycStatus: "not_started",
          canProceed: false,
          error: "KYC not started",
        };
      }

      // Determine if user can proceed based on KYC status
      const allowedStatuses = ["active"]; // Only 'active' KYC allows access
      const canProceed = allowedStatuses.includes(kycProfile.kyc_status);

      console.log("✅ KYC status checked:", {
        userId,
        kycStatus: kycProfile.kyc_status,
        bridgeCustomerId: kycProfile.bridge_customer_id,
        signedAgreementId: kycProfile.signed_agreement_id,
        canProceed,
      });

      return {
        hasKyc: true,
        kycStatus: kycProfile.kyc_status,
        bridgeCustomerId: kycProfile.bridge_customer_id,
        signedAgreementId: kycProfile.signed_agreement_id,
        canProceed,
      };
    } catch (err) {
      console.error("💥 Error checking KYC status:", err);
      return {
        hasKyc: false,
        kycStatus: "not_started",
        canProceed: false,
        error: `KYC check failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Comprehensive login with user status, KYC validation, and Bridge status check
   */
  signInWithValidation: async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: any;
    session?: any;
    userStatus?: "active" | "disabled" | "deleted";
    role?: "USER" | "SUPERADMIN";
    kycStatus?: string;
    bridgeCustomerId?: string;
    nextStep?: "home" | "kyc_pending" | "kyc_required" | "account_disabled" | "bridge_status";
    error?: string;
  }> => {
    try {
      console.log("🔐 Starting comprehensive login process...", { email });

      // Step 1: Basic authentication
      const authResult = await authService.signIn(email, password);

      if (authResult.error || !authResult.user) {
        return {
          success: false,
          error: authResult.error?.message || "Authentication failed",
        };
      }

      const { user, session } = authResult;
      console.log("✅ Basic authentication successful");

      // Step 2: Validate user status
      const userValidation = await authService.validateUserStatus(user.id);

      if (!userValidation.isValid) {
        console.warn("⚠️ User validation failed:", userValidation.error);

        // Sign out the user since they can't proceed
        await authService.signOut();

        return {
          success: false,
          userStatus: userValidation.status,
          role: userValidation.role,
          nextStep: "account_disabled",
          error: userValidation.error || "Account is not active",
        };
      }

      console.log("✅ User status validation passed");

      // Step 3: For regular users, check KYC status and Bridge status
      if (userValidation.role === "USER") {
        const kycResult = await authService.checkKycStatus(user.id);

        console.log("📋 KYC check result:", kycResult);

        // Determine next step based on KYC status
        let nextStep: "home" | "kyc_pending" | "kyc_required" | "bridge_status" = "kyc_required";

        if (kycResult.hasKyc) {
          switch (kycResult.kycStatus) {
            case "active":
              // Auto-refresh Bridge status on login
              try {
                const { bridgeStatusService } = await import('./bridgeStatusService');
                
                // Auto-refresh Bridge status first
                console.log('🔄 Auto-refreshing Bridge status on login...');
                await bridgeStatusService.autoRefreshOnAppStart(user.id);
                
                // Then check if user can access home
                const bridgeAccessResult = await bridgeStatusService.canUserAccessHome(user.id);
                
                if (bridgeAccessResult.canAccess) {
                  nextStep = "home";
                } else if (bridgeAccessResult.shouldRedirectToRejected) {
                  console.log("🚫 User rejected by Bridge, redirecting to rejected screen");
                  nextStep = "kyc_rejected";
                } else {
                  console.log("⚠️ KYC active but Bridge status prevents home access:", bridgeAccessResult.reason);
                  nextStep = "bridge_status";
                }
              } catch (error) {
                console.error("❌ Error checking Bridge status:", error);
                // If Bridge check fails, still allow access to home but log the error
                nextStep = "home";
              }
              break;
            case "under_review":
            case "awaiting_questionnaire":
            case "awaiting_ubo":
              nextStep = "kyc_pending";
              break;
            case "rejected":
            case "not_started":
            case "incomplete":
            default:
              nextStep = "kyc_required";
              break;
          }
        }

        return {
          success: true,
          user,
          session,
          userStatus: userValidation.status,
          role: userValidation.role,
          kycStatus: kycResult.kycStatus,
          bridgeCustomerId: kycResult.bridgeCustomerId,
          nextStep,
        };
      }

      // Step 4: For SUPERADMIN, bypass KYC and go directly to home
      console.log("👑 SUPERADMIN login - bypassing KYC checks");
      return {
        success: true,
        user,
        session,
        userStatus: userValidation.status,
        role: userValidation.role,
        nextStep: "home",
      };
    } catch (err) {
      console.error("💥 Error in comprehensive login:", err);
      return {
        success: false,
        error: `Login failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      };
    }
  },
};

export default authService;
