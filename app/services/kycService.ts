import { useAuthStore } from "../store/authStore";
import useBridgeStore from "../store/bridgeStore";
import useKycStore from "../store/kycStore";
import { KycProfileForBridge } from "../types/BridgeTypes";
import { KycStep } from "../types/KycTypes";
import { profileService } from "./profileService";

/**
 * Convert database profile data to Bridge format
 */
export const convertDatabaseProfileToBridge = (profileData: any): KycProfileForBridge | null => {
  try {
    console.log('🔄 Converting database profile to Bridge format...');
    console.log('🔍 Raw profileData structure:', JSON.stringify(profileData, null, 2));
    
    if (!profileData) {
      console.error("❌ No profile data provided");
      return null;
    }

    // Check if kycProfile exists and is an array
    if (!profileData.kycProfile || !Array.isArray(profileData.kycProfile) || profileData.kycProfile.length === 0) {
      console.error("❌ No KYC profile data found in database");
      console.log('🔍 kycProfile structure:', profileData.kycProfile);
      return null;
    }

    const kycProfile = profileData.kycProfile[0];
    console.log('🔍 KYC Profile data:', JSON.stringify(kycProfile, null, 2));

    // Check address data
    const address = kycProfile.address?.[0];
    console.log('🔍 Address data:', JSON.stringify(address, null, 2));
    
    // Check identifying info data
    const identifyingInfo = kycProfile.identifyingInfo?.[0];
    console.log('🔍 IdentifyingInfo data:', JSON.stringify(identifyingInfo, null, 2));

    if (!address) {
      console.error("❌ Missing address in database");
      return null;
    }

    if (!identifyingInfo) {
      console.error("❌ Missing identifying info in database");
      return null;
    }

    // Map country codes (Bridge expects 3-character ISO codes)
    const mapCountryCode = (country: string): string => {
      const countryMap: Record<string, string> = {
        BO: "BOL", // Bolivia
        BOL: "BOL", // Bolivia (already 3-char)
        Bolivia: "BOL",
        PE: "PER", // Peru
        PER: "PER", // Peru (already 3-char)
        Peru: "PER",
        US: "USA", // United States
        USA: "USA", // United States (already 3-char)
        "United States": "USA",
        AR: "ARG", // Argentina
        ARG: "ARG", // Argentina (already 3-char)
        Argentina: "ARG",
        BR: "BRA", // Brazil
        BRA: "BRA", // Brazil (already 3-char)
        Brazil: "BRA",
        // Add more as needed
      };
      return countryMap[country] || (country.length === 3 ? country : "BOL"); // Default to Bolivia if unknown
    };

    // Map subdivision codes for Bolivia (ISO 3166-2 without country prefix)
    const mapSubdivisionCode = (subdivision: string, countryCode: string): string | undefined => {
      // For Bolivia (BOL)
      if (countryCode === "BOL") {
        const boliviaSubdivisions: Record<string, string> = {
          // Full names
          "La Paz": "L",
          "Cochabamba": "C", 
          "Santa Cruz": "S",
          "Oruro": "O",
          "Potosí": "P",
          "Tarija": "T",
          "Chuquisaca": "H",
          "Beni": "B",
          "Pando": "N",
          // Standard codes (2-char)
          "LP": "L",
          "CB": "C",
          "SC": "S",
          "OR": "O",
          "PT": "P",
          "TJ": "T",
          "CH": "H",
          "BN": "B",
          "PD": "N",
          // Extended codes (3-char) - common variations
          "LPZ": "L", // La Paz
          "CBB": "C", // Cochabamba ← ESTE ES EL QUE FALTA
          "SCZ": "S", // Santa Cruz
          "ORU": "O", // Oruro
          "POT": "P", // Potosí
          "TAR": "T", // Tarija
          "CHU": "H", // Chuquisaca
          "BEN": "B", // Beni
          "PAN": "N", // Pando
          // Direct ISO codes (single char)
          "L": "L",
          "C": "C",
          "S": "S",
          "O": "O",
          "P": "P",
          "T": "T",
          "H": "H",
          "B": "B",
          "N": "N"
        };
        
        console.log(`🗺️ Mapping subdivision "${subdivision}" for country ${countryCode}`);
        const mappedCode = boliviaSubdivisions[subdivision];
        console.log(`🔍 Mapped result: "${subdivision}" → "${mappedCode}"`);
        
        return mappedCode;
      }
      
      // For other countries, return as-is or undefined if not needed
      return subdivision && subdivision.length <= 3 ? subdivision : undefined;
    };

    // Validate and format birth date
    const formatBirthDate = (birthDate: string): string => {
      if (!birthDate) return "";
      
      // If it's already in YYYY-MM-DD format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return birthDate;
      }
      
      // Try to parse and format
      try {
        const date = new Date(birthDate);
        if (isNaN(date.getTime())) return "";
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting birth date:', error);
        return "";
      }
    };

    // For now, we'll use file paths directly - Bridge service will handle conversion to base64
    const bridgeProfile: KycProfileForBridge = {
      userId: profileData.userId,
      email: kycProfile.email || "",
      firstName: kycProfile.first_name || "",
      lastName: kycProfile.last_name || "",
      birthDate: formatBirthDate(kycProfile.birth_date || ""),
      phone: kycProfile.phone || "",
      address: {
        streetLine1: address.street_line_1 || "",
        streetLine2: address.street_line_2 || undefined,
        city: address.city || "",
        subdivision: mapSubdivisionCode(address.subdivision || "", mapCountryCode(address.country || "")),
        postalCode: address.postal_code || undefined,
        country: mapCountryCode(address.country || ""),
      },
      identifyingInfo: {
        type: identifyingInfo.document_type || "national_id",
        issuingCountry: mapCountryCode(identifyingInfo.issuing_country || "").toLowerCase(), // Bridge expects lowercase
        number: identifyingInfo.number || undefined,
        imageFront: identifyingInfo.image_front || "",
        imageBack: identifyingInfo.image_back || undefined,
      },
      kycStatus: "completed",
    };

    console.log('✅ Bridge profile converted successfully');
    console.log('🔍 Bridge profile preview:', {
      userId: bridgeProfile.userId,
      email: bridgeProfile.email,
      firstName: bridgeProfile.firstName,
      lastName: bridgeProfile.lastName,
      hasImageFront: !!bridgeProfile.identifyingInfo.imageFront,
      hasImageBack: !!bridgeProfile.identifyingInfo.imageBack,
    });

    return bridgeProfile;
  } catch (error) {
    console.error("💥 Error converting database profile to Bridge format:", error);
    return null;
  }
};

/**
 * Convert KYC store data to Bridge format (fallback)
 */
const convertKycDataToBridgeProfile = (): KycProfileForBridge | null => {
  const { personalInfo, addressInfo, documents } = useKycStore.getState();
  const { user, profile } = useAuthStore.getState();

  // Check if we have all required data with specific field validation
  const missingFields: string[] = [];

  if (!personalInfo.firstName) missingFields.push("personalInfo.firstName");
  if (!personalInfo.lastName) missingFields.push("personalInfo.lastName");
  if (!personalInfo.dateOfBirth) missingFields.push("personalInfo.dateOfBirth");
  if (!addressInfo.country) missingFields.push("addressInfo.country");
  if (!addressInfo.city) missingFields.push("addressInfo.city");
  if (!addressInfo.address) missingFields.push("addressInfo.address");
  if (!documents.idFront) missingFields.push("documents.idFront");
  if (!user) missingFields.push("user");
  if (!profile) missingFields.push("profile");
  if (profile && !profile.phone) missingFields.push("profile.phone");

  if (missingFields.length > 0) {
    console.warn(
      "⚠️ Missing KYC data for Bridge integration:",
      missingFields.join(", ")
    );
    console.warn("⚠️ Current data:", {
      personalInfo,
      addressInfo,
      documents: {
        // ...documents,
        idFront: documents.idFront ? "present" : "missing",
        idBack: documents.idBack ? "present" : "missing",
        selfie: documents.selfie ? "present" : "missing",
      },
      user: user ? "present" : "missing",
      profile: profile
        ? {
            ...profile,
            phone: profile.phone || "missing",
          }
        : "missing",
    });
    return null;
  }

  // Map country codes (assuming you have Bolivia as default)
  const mapCountryCode = (country: string): string => {
    const countryMap: Record<string, string> = {
      BO: "BO", // Bolivia
      Bolivia: "BO",
      PE: "PE", // Peru
      Peru: "PE",
      // Add more as needed
    };
    return countryMap[country] || country;
  };

  return {
    userId: user!.id,
    email: profile!.email || "",
    firstName: personalInfo.firstName!,
    lastName: personalInfo.lastName!,
    birthDate: personalInfo.dateOfBirth!, // Assuming YYYY-MM-DD format
    phone: profile!.phone || "",
    address: {
      streetLine1: addressInfo.address!,
      streetLine2: undefined,
      city: addressInfo.city!,
      subdivision: addressInfo.state,
      postalCode: addressInfo.postalCode,
      country: mapCountryCode(addressInfo.country!),
    },
    identifyingInfo: {
      type: "national_id", // Default for Bolivia
      issuingCountry: mapCountryCode(addressInfo.country!),
      number: undefined, // Could be extracted from document OCR
      imageFront: documents.idFront!,
      imageBack: documents.idBack || undefined,
    },
    kycStatus: "completed",
  };
};

/**
 * Advance to next KYC step and complete KYC when reaching final step
 */
const advanceToNextStep = async (currentStep: KycStep): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📋 Advancing from KYC step:', currentStep);
    
    const { setCurrentStep } = useKycStore.getState();
    
    // Define step progression
    const stepProgression: Record<KycStep, KycStep | 'complete'> = {
      'personal_info': 'address',
      'address': 'economic_activity',
      'economic_activity': 'document_upload',
      'document_upload': 'selfie',
      'selfie': 'complete',
      'completed': 'completed', // Already completed
    };
    
    const nextStep = stepProgression[currentStep];
    
    if (nextStep === 'complete') {
      console.log('📋 Reached final step, submitting KYC data and creating profiles...');
      
      // Complete KYC process: create profiles and initialize Bridge
      const result = await submitKycData();
      
      if (result.success) {
        setCurrentStep('completed');
        console.log('✅ KYC completion successful');
        return { success: true };
      } else {
        console.error('❌ KYC completion failed:', result.error);
        return { success: false, error: result.error };
      }
    } else if (nextStep === 'completed') {
      console.log('✅ KYC already completed');
      return { success: true };
    } else {
      console.log('📋 Advancing to next step:', nextStep);
      setCurrentStep(nextStep);
      return { success: true };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Error advancing KYC step:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Initialize Bridge integration after KYC completion
 */
const initializeBridgeIntegration = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    console.log("🌉 Initializing Bridge integration after KYC completion...");

    const { user } = useAuthStore.getState();
    if (!user) {
      return {
        success: false,
        error: "No user found for Bridge integration",
      };
    }

    // Try to get profile data from database first
    console.log("🌉 Getting profile data from database for Bridge...");
    const profileData = await profileService.getProfileForBridge(user.id);
    
    let bridgeProfile: KycProfileForBridge | null = null;
    
    if (profileData) {
      console.log("✅ Using profile data from database");
      console.log("🔍 Calling convertDatabaseProfileToBridge...");
      bridgeProfile = convertDatabaseProfileToBridge(profileData);
      console.log("🔍 convertDatabaseProfileToBridge result:", bridgeProfile ? "SUCCESS" : "NULL");
      
      if (bridgeProfile) {
        console.log("🔍 Converted Bridge profile preview:", {
          userId: bridgeProfile.userId,
          email: bridgeProfile.email,
          firstName: bridgeProfile.firstName,
          lastName: bridgeProfile.lastName,
          hasIdentifyingInfo: !!bridgeProfile.identifyingInfo,
          hasImageFront: !!bridgeProfile.identifyingInfo?.imageFront,
        });
      }
    } else {
      console.log("⚠️ No profile in database, falling back to store data");
      bridgeProfile = convertKycDataToBridgeProfile();
    }

    if (!bridgeProfile) {
      return {
        success: false,
        error: "Incomplete KYC data for Bridge integration",
      };
    }

    // Start Bridge integration
    const { initializeBridgeIntegration } = useBridgeStore.getState();
    const result = await initializeBridgeIntegration(bridgeProfile);

    if (result.success) {
      console.log("✅ Bridge integration completed successfully");
    } else {
      console.error("💥 Bridge integration failed:", result.error);
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("💥 Bridge integration initialization failed:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

const submitKycData = async () => {
  const { completeVerification } = useKycStore.getState();

  console.log("📋 Submitting KYC Data and creating profiles...");

  // Complete KYC verification first
  await completeVerification();

  const { verificationStatus } = useKycStore.getState();
  console.log("KYC submission finished. Status:", verificationStatus);

  // If KYC completed successfully, create profiles and then initialize Bridge
  if (verificationStatus === "completed") {
    console.log("📋 KYC completed - creating profiles in database...");

    // Create Profile and KYCProfile in database
    const profileResult = await profileService.createProfileAfterKyc();
    
    if (!profileResult.success) {
      console.error("❌ Profile creation failed:", profileResult.error);
      return { success: false, error: profileResult.error };
    }

    console.log("✅ Profiles created successfully in database");

    // Update auth store with new profile data
    const { user } = useAuthStore.getState();
    if (user) {
      console.log("🔄 Refreshing auth store with new profile data...");
      const { initialize } = useAuthStore.getState();
      await initialize();
    }

    console.log("🌉 KYC and profile creation completed - checking Bridge configuration...");

    // Only initialize Bridge if API key is configured
    if (process.env.EXPO_PUBLIC_BRIDGE_API_KEY) {
      console.log("🌉 Bridge API key found, starting integration...");

      // Initialize Bridge integration in background (don't block UI)
      initializeBridgeIntegration()
        .then((result) => {
          console.log("initializeBridgeIntegration result", result);
          if (!result.success) {
            console.warn(
              "⚠️ Bridge integration failed, but KYC was successful:",
              result.error
            );
            // Could show a retry button in UI or attempt retry later
          }
        })
        .catch((error) => {
          console.error("💥 Bridge integration error:", error);
        });
    } else {
      console.log(
        "⚠️ Bridge API key not configured, skipping Bridge integration"
      );
    }
  }

  return { success: verificationStatus === "completed" };
};

/**
 * Retry Bridge integration for already completed KYC
 */
const retryBridgeIntegration = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  const { verificationStatus } = useKycStore.getState();

  if (verificationStatus !== "completed") {
    return {
      success: false,
      error: "KYC must be completed before Bridge integration",
    };
  }

  return initializeBridgeIntegration();
};

/**
 * Check Bridge integration status
 */
const getBridgeIntegrationStatus = () => {
  const {
    isBridgeReady,
    isCustomerActive,
    hasActiveWallet,
    bridgeCustomerId,
    integrationError,
    isLoading,
  } = useBridgeStore.getState();

  return {
    isReady: isBridgeReady(),
    isActive: isCustomerActive(),
    hasWallet: hasActiveWallet(),
    customerId: bridgeCustomerId,
    error: integrationError,
    isLoading,
  };
};

export const kycService = {
  advanceToNextStep,
  submitKycData,
  initializeBridgeIntegration,
  convertDatabaseProfileToBridge,
};
