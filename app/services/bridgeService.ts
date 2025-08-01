import * as AuthSession from 'expo-auth-session';
import Constants from "expo-constants";
import {
    BridgeApiResponse,
    BridgeCreateCustomerResponse,
    BridgeCustomer,
    BridgeCustomerRequest,
    BridgeDocumentType,
    BridgeGetCustomerResponse,
    BridgeLiquidationAddress,
    BridgeTosLinkResponse,
    BridgeTosResponse,
    CreateLiquidationAddressParams,
    KycProfileForBridge
} from "../types/BridgeTypes";

// Bridge API Configuration
const BRIDGE_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BRIDGE_API_URL ||
  process.env.EXPO_PUBLIC_BRIDGE_API_URL ||
  "https://api.sandbox.bridge.xyz/v0";

const BRIDGE_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BRIDGE_API_KEY ||
  process.env.EXPO_PUBLIC_BRIDGE_API_KEY;

// FIX: Corregir la evaluación del modo sandbox
const BRIDGE_SANDBOX_MODE = (() => {
  const envValue = Constants.expoConfig?.extra?.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE ||
                   process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE;
  
  if (envValue === undefined || envValue === null) {
    // Si no está definido, asumir sandbox por seguridad
    console.log("⚠️ BRIDGE_SANDBOX_MODE not defined, defaulting to sandbox mode");
    return true;
  }
  
  // Convertir string a boolean correctamente
  const isSandbox = envValue === 'true' || envValue === true;
  console.log(`🔧 Bridge mode detected: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log(`🔧 Environment value: "${envValue}" (type: ${typeof envValue})`);
  
  return isSandbox;
})();

if (!BRIDGE_API_KEY) {
  console.warn("⚠️ Bridge API key is missing. Bridge features will not work.");
}

/**
 * Generate idempotency key for Bridge API calls
 */
const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate redirect URI using expo-auth-session for consistent OAuth flow
 * Based on expo-auth-session documentation: https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
 */
const generateRedirectUri = (): string => {
  try {
    // Use expo-auth-session to generate a consistent redirect URI
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'peyopagos',
      // For production, we can also use a web URL
      // useProxy: false, // Set to false for production web URLs
    });
    
    console.log('🔗 Generated redirect URI using expo-auth-session:', redirectUri);
    return redirectUri;
  } catch (error) {
    console.error('❌ Error generating redirect URI:', error);
    
    // Fallback to manual generation
    const isSandbox = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true';
    const fallbackUri = isSandbox 
      ? 'peyopagos://bridge-tos-callback'
      : 'https://app.peyopagos.com/bridge-tos-callback';
    
    console.log('🔄 Using fallback redirect URI:', fallbackUri);
    return fallbackUri;
  }
};

/**
 * Bridge API HTTP client with common headers
 */
const bridgeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BridgeApiResponse<T>> => {
  if (!BRIDGE_API_KEY) {
    return {
      error: {
        code: "BRIDGE_API_KEY_MISSING",
        message: "Bridge API key is not configured",
      },
    };
  }

  try {
    const url = `${BRIDGE_API_URL}${endpoint}`;
    const method = options.method || "GET";
    
    // Only include Idempotency-Key for non-GET requests
    // Bridge API doesn't support Idempotency-Key for GET requests
    const headers: Record<string, string> = {
      "Api-Key": BRIDGE_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    // Add Idempotency-Key only for POST, PUT, PATCH, DELETE requests
    if (method !== "GET") {
      const idempotencyKey = generateIdempotencyKey();
      headers["Idempotency-Key"] = idempotencyKey;
    }

    console.log(`🌉 Bridge API ${method}: ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("🚨 Bridge API Error:", responseData);
      return {
        error: {
          code: responseData.code || `HTTP_${response.status}`,
          message:
            responseData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          details: responseData,
        },
      };
    }

    console.log("✅ Bridge API Success:", endpoint);
    
    // Log useful response info for debugging without exposing sensitive data
    if (endpoint.includes('/wallets') && responseData) {
      if (Array.isArray(responseData)) {
        console.log(`🔍 Response: Array with ${responseData.length} items`);
      } else if (responseData.count !== undefined && responseData.data) {
        console.log(`🔍 Response: Object with count=${responseData.count}, data array length=${Array.isArray(responseData.data) ? responseData.data.length : 'not array'}`);
      } else {
        console.log(`🔍 Response: Object type=${typeof responseData}, hasData=${!!responseData.data}`);
      }
    }
    
    return { data: responseData };
  } catch (error) {
    console.error("💥 Bridge API Network Error:", error);
    return {
      error: {
        code: "NETWORK_ERROR",
        message: `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
    };
  }
};

/**
 * Convert image URL or base64 to base64 format for Bridge API
 * Bridge expects: data:image/(jpeg|jpg|png|heic|heif);base64,(valid_base_64_data)
 */
const convertImageToBase64 = async (imageSource: string): Promise<string> => {
  try {
    console.log('🖼️ Converting image to base64:', imageSource);
    
    // If already a valid data URI, return as-is
    if (imageSource.startsWith("data:image/")) {
      console.log('✅ Image already has data URI format');
      return imageSource;
    }
    
    // If it's just base64 without prefix, add jpeg prefix (most common)
    if (imageSource.startsWith("/9j/") || imageSource.match(/^[A-Za-z0-9+/=]+$/)) {
      console.log('📝 Adding data URI prefix to base64 string');
      return `data:image/jpeg;base64,${imageSource}`;
    }

    // If it's a Supabase Storage path (starts with bucket name or kyc-documents)
    if (imageSource.includes('kyc-documents/') || imageSource.includes('documents/')) {
      console.log('📁 Converting Supabase Storage path to base64');
      
      // Import Supabase client
      const { supabase } = await import('./supabaseClient');
      
      // Get the file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents') // Your bucket name
        .download(imageSource);

      if (downloadError) {
        console.error('❌ Error downloading file from Storage:', downloadError);
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      if (!fileData) {
        throw new Error('No file data received from Storage');
      }

      // Convert Blob to base64 with CORRECT MIME type for Bridge
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64WithPrefix = reader.result as string;
          
          // Extract just the base64 data (without the incorrect MIME type)
          const base64Data = base64WithPrefix.replace(/^data:[^;]+;base64,/, "");
          
          // Detect image type from magic numbers (file signature)
          let mimeType = 'image/jpeg'; // default
          if (base64Data.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
          } else if (base64Data.startsWith('iVBORw0K')) {
            mimeType = 'image/png';
          } else if (base64Data.startsWith('UklGR')) {
            mimeType = 'image/webp';
          }
          
          // Create the correct data URI for Bridge
          const correctDataUri = `data:${mimeType};base64,${base64Data}`;
          
          console.log('✅ Successfully converted Storage file to base64');
          console.log(`🔧 Fixed MIME type from octet-stream to ${mimeType}`);
          
          resolve(correctDataUri);
        };
        reader.onerror = () => {
          console.error('❌ Error reading file as base64');
          reject(new Error('Failed to convert file to base64'));
        };
        reader.readAsDataURL(fileData);
      });
    }

    // If it's a full URL, fetch and convert
    if (imageSource.startsWith("http")) {
      console.log('🌐 Fetching image from URL');
      const response = await fetch(imageSource);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64WithPrefix = reader.result as string;
          // Keep the data URI format that Bridge expects
          resolve(base64WithPrefix);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // If it's just base64 string without prefix, add default jpeg prefix
    console.log('📝 Treating as base64 string, adding data URI prefix');
    return `data:image/jpeg;base64,${imageSource}`;
  } catch (error) {
    console.error("❌ Error converting image to base64:", error);
    throw new Error(
      `Failed to convert image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Map KYC data to Bridge customer request format
 */
const formatKYCProfileForBridge = async (
  kycProfile: KycProfileForBridge
): Promise<BridgeCustomerRequest> => {
  console.log('🔄 Formatting KYC Profile for Bridge API...');
  console.log('🔍 Input KYC Profile:', JSON.stringify(kycProfile, null, 2));

  try {
    // Validate required fields
    if (!kycProfile.identifyingInfo) {
      throw new Error('Missing identifyingInfo in KYC profile');
    }

    if (!kycProfile.identifyingInfo.imageFront) {
      throw new Error('Missing imageFront in identifyingInfo');
    }

    console.log('🖼️ Processing images...');
    console.log('🔍 imageFront:', kycProfile.identifyingInfo.imageFront);
    console.log('🔍 imageBack:', kycProfile.identifyingInfo.imageBack);

    // Convert images to base64
    console.log('📄 Converting front image to base64...');
    const imageFront = await convertImageToBase64(
      kycProfile.identifyingInfo.imageFront
    );
    console.log('✅ Front image converted, length:', imageFront.length);

    let imageBack: string | undefined;
    if (kycProfile.identifyingInfo.imageBack) {
      console.log('📄 Converting back image to base64...');
      imageBack = await convertImageToBase64(kycProfile.identifyingInfo.imageBack);
      console.log('✅ Back image converted, length:', imageBack.length);
    } else {
      console.log('ℹ️ No back image provided');
    }

    // Map document type to Bridge format
    const mapDocumentType = (docType: string): BridgeDocumentType => {
      const typeMap: Record<string, BridgeDocumentType> = {
        cedula: "national_id",
        pasaporte: "passport",
        licencia: "drivers_license",
        carnet_electoral: "voter_id",
        national_id: "national_id", // Direct mapping
      };
      return typeMap[docType] || "national_id";
    };

    const bridgeRequest: BridgeCustomerRequest = {
      type: "individual",
      first_name: kycProfile.firstName,
      last_name: kycProfile.lastName,
      email: kycProfile.email,
      birth_date: kycProfile.birthDate,
      signed_agreement_id: "", // Will be set after ToS acceptance
      residential_address: {
        street_line_1: kycProfile.address.streetLine1,
        ...(kycProfile.address.streetLine2 && { street_line_2: kycProfile.address.streetLine2 }),
        city: kycProfile.address.city,
        ...(kycProfile.address.subdivision && { subdivision: kycProfile.address.subdivision }),
        ...(kycProfile.address.postalCode && { postal_code: kycProfile.address.postalCode }),
        country: kycProfile.address.country,
      },
      identifying_information: [
        {
          type: mapDocumentType(kycProfile.identifyingInfo.type),
          issuing_country: kycProfile.identifyingInfo.issuingCountry,
          number: kycProfile.identifyingInfo.number || "0000000000", // Bridge requires a number, use placeholder if missing
          image_front: imageFront,
          ...(imageBack && { image_back: imageBack }),
        },
      ],
    };

    console.log('✅ Bridge request formatted successfully');
    console.log('🔍 Bridge request preview:', {
      type: bridgeRequest.type,
      first_name: bridgeRequest.first_name,
      last_name: bridgeRequest.last_name,
      email: bridgeRequest.email,
      birth_date: bridgeRequest.birth_date,
      country: bridgeRequest.residential_address.country,
      city: bridgeRequest.residential_address.city,
      subdivision: bridgeRequest.residential_address.subdivision,
      document_type: bridgeRequest.identifying_information[0].type,
      issuing_country: bridgeRequest.identifying_information[0].issuing_country,
      hasImageFront: !!bridgeRequest.identifying_information[0].image_front,
      hasImageBack: !!bridgeRequest.identifying_information[0].image_back,
      imageFrontLength: bridgeRequest.identifying_information[0].image_front?.length || 0,
      imageBackLength: bridgeRequest.identifying_information[0].image_back?.length || 0,
    });

    // 🚨 DEBUG: Let's see the EXACT format being sent to Bridge
    console.log('🔍 DEBUG - Exact image format being sent to Bridge:');
    const imageFrontSample = bridgeRequest.identifying_information[0].image_front?.substring(0, 100) || 'none';
    const imageBackSample = bridgeRequest.identifying_information[0].image_back?.substring(0, 100) || 'none';
    
    console.log('📸 Front image starts with:', imageFrontSample);
    console.log('📸 Back image starts with:', imageBackSample);
    
    // Check if it's a valid data URI format
    const isValidDataUri = (uri: string) => {
      return uri.match(/^data:(image|application)\/(jpeg|jpg|png|heic|heif|pdf);base64,/);
    };
    
    console.log('🔍 Front image valid data URI:', isValidDataUri(bridgeRequest.identifying_information[0].image_front || ''));
    console.log('🔍 Back image valid data URI:', isValidDataUri(bridgeRequest.identifying_information[0].image_back || ''));

    return bridgeRequest;
  } catch (error) {
    console.error('💥 Error formatting KYC Profile for Bridge:', error);
    throw error;
  }
};

/**
 * Bridge.xyz Service
 */
export const bridgeService = {
  /**
   * Generate Terms of Service acceptance link
   * NOTE: ToS is not available in sandbox mode, so we return a dummy agreement
   */
  generateTosLink: async (): Promise<BridgeTosLinkResponse> => {
    try {
      console.log(`🌉 Starting ToS generation - Mode: ${BRIDGE_SANDBOX_MODE ? 'SANDBOX' : 'PRODUCTION'}`);
      
      // Validate production configuration
      if (!BRIDGE_SANDBOX_MODE) {
        if (!BRIDGE_API_KEY || BRIDGE_API_KEY.includes('test')) {
          console.error("❌ Production mode detected but using test API key");
          return {
            success: false,
            error: "ToS Error: Invalid API key for production mode",
          };
        }
      }
      
      // In sandbox mode, ToS endpoints don't exist, so we return a dummy response
      if (BRIDGE_SANDBOX_MODE) {
        console.log("🧪 Sandbox mode: Skipping ToS generation, using dummy agreement ID");
        
        const dummyAgreementId = `sandbox-tos-${Date.now()}`;
        return {
          success: true,
          data: {
            id: dummyAgreementId,
            url: `https://sandbox-bridge.xyz/tos/${dummyAgreementId}`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          },
        };
      }

      // Production mode: Use real ToS endpoint
      console.log("🔐 Production mode: Generating real Bridge ToS link");
      
      // Generate redirect URI for logging purposes (will be added to ToS URL by the hook)
      const finalRedirectUri = generateRedirectUri();
      console.log(`🔄 Generated redirect_uri: ${finalRedirectUri}`);
      
      // Call Bridge API without redirect_uri in query parameter
      const endpoint = "/customers/tos_links";
      console.log(`🌉 Making request to: ${BRIDGE_API_URL}${endpoint}`);

      const response = await bridgeRequest<BridgeTosResponse>(
        endpoint,
        {
          method: "POST",
          // No body needed - Bridge returns the ToS URL
        }
      );

      if (response.error) {
        console.error("❌ Bridge ToS API Error:", response.error);
        console.error("🔍 Error details:", {
          code: response.error.code,
          message: response.error.message,
          endpoint: `${BRIDGE_API_URL}${endpoint}`,
          redirectUri: finalRedirectUri,
          sandboxMode: BRIDGE_SANDBOX_MODE
        });
        return {
          success: false,
          error: `ToS Error: ${response.error.message}`,
        };
      }

      if (!response.data) {
        console.error("❌ Bridge ToS API returned no data");
        return {
          success: false,
          error: "ToS Error: No data returned from Bridge API",
        };
      }

      console.log("✅ Bridge ToS link generated successfully");
      console.log(`🔗 ToS URL: ${response.data.url}`);
      console.log(`ℹ️ signed_agreement_id will be provided after user accepts ToS`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("💥 ToS Generation Exception:", error);
      return {
        success: false,
        error: `ToS Generation Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Get Bridge customer details and sync status
   * Based on Bridge API documentation: GET /customers/{id}
   */
  getCustomer: async (customerId: string): Promise<BridgeGetCustomerResponse> => {
    console.log("🌉 Getting Bridge customer details:", customerId);

    try {
      const response = await bridgeRequest<BridgeCustomer>(`/customers/${customerId}`, {
        method: "GET",
      });

      if (response.error) {
        console.error("❌ Bridge Get Customer API Error:", response.error);
        return {
          success: false,
          error: `Get Customer Error: ${response.error.message}`,
        };
      }

      if (!response.data) {
        console.error("❌ Bridge Get Customer API returned no data");
        return {
          success: false,
          error: "Get Customer Error: No data returned from Bridge API",
        };
      }

      console.log("✅ Bridge customer details retrieved successfully");
      console.log("🔍 Customer details:", {
        id: response.data.id,
        verification_status: response.data.verification_status,
        requirements_due: response.data.requirements_due,
        payin_crypto: response.data.payin_crypto,
        payout_crypto: response.data.payout_crypto,
        endorsements: response.data.endorsements?.length || 0,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("💥 Error getting Bridge customer:", error);
      return {
        success: false,
        error: `Get Customer Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Create Bridge customer using KYC data
   */
  createCustomer: async (
    kycProfile: KycProfileForBridge,
    signedAgreementId: string
  ): Promise<BridgeCreateCustomerResponse> => {
    console.log("🌉 BRIDGE SERVICE: Starting createCustomer");
    console.log("🔍 Input parameters:", {
      email: kycProfile.email,
      userId: kycProfile.userId,
      signedAgreementId,
      hasIdentifyingInfo: !!kycProfile.identifyingInfo,
      hasAddress: !!kycProfile.address
    });

    try {
      console.log("🌉 Creating Bridge customer for:", kycProfile.email);

      // Format KYC data for Bridge API
      console.log("🔄 Formatting KYC profile for Bridge API...");
      const customerRequest = await formatKYCProfileForBridge(kycProfile);
      customerRequest.signed_agreement_id = signedAgreementId;

      console.log("🔍 Bridge API request payload:", {
        email: customerRequest.email,
        hasIdentifyingInfo: !!customerRequest.identifying_information,
        signedAgreementId: customerRequest.signed_agreement_id
      });

      // 🚨 NEW: Save Bridge raw request to database BEFORE sending to API
      console.log("🗄️ Saving Bridge raw request to database...");
      const { profileService } = await import('./profileService');
      const rawRequestResult = await profileService.saveBridgeRawRequest(
        kycProfile.userId, 
        customerRequest
      );
      
      console.log("🔍 Raw request save result:", rawRequestResult);
      
      if (!rawRequestResult.success) {
        console.warn("⚠️ Bridge raw request save failed:", rawRequestResult.error);
        // Don't fail the entire operation, just log the warning
      } else {
        console.log("✅ Bridge raw request saved to database successfully");
      }

      console.log("🌉 Making API call to Bridge /customers endpoint...");
      const response = await bridgeRequest<BridgeCustomer>("/customers", {
        method: "POST",
        body: JSON.stringify(customerRequest),
      });

      console.log("🔍 Bridge API response:", {
        hasError: !!response.error,
        hasData: !!response.data,
        errorCode: response.error?.code,
        errorMessage: response.error?.message,
        customerId: response.data?.id,
        verificationStatus: response.data?.verification_status
      });

      if (response.error) {
        console.error("❌ Bridge API returned error:", response.error);
        return {
          success: false,
          error: `Customer Creation Error: ${response.error.message}`,
        };
      }

      if (!response.data) {
        console.error("❌ Bridge API returned no data");
        return {
          success: false,
          error: "Customer Creation Error: No data returned from Bridge API",
        };
      }

      console.log("✅ Bridge customer created successfully:");
      console.log("🔍 Customer details:", {
        id: response.data.id,
        verification_status: response.data.verification_status,
        payin_crypto: response.data.payin_crypto,
        payout_crypto: response.data.payout_crypto,
        endorsements: response.data.endorsements?.length || 0,
        requirements_due: response.data.requirements_due?.length || 0
      });

      // 🚨 NEW: Save Bridge raw response to database AFTER successful creation
      console.log("🗄️ Saving Bridge raw response to database...");
      const rawResponseResult = await profileService.saveBridgeRawResponse(
        kycProfile.userId, 
        response.data
      );
      
      console.log("🔍 Raw response save result:", rawResponseResult);
      
      if (!rawResponseResult.success) {
        console.warn("⚠️ Bridge raw response save failed:", rawResponseResult.error);
        // Don't fail the entire operation, just log the warning
      } else {
        console.log("✅ Bridge raw response saved to database successfully");
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("💥 Error creating Bridge customer:", error);
      console.error("💥 Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        error: `Customer Creation Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Create wallet for Bridge customer
   */
  createWallet: async (customerId: string, walletRequest: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      console.log(`🌉 Creating wallet for customer: ${customerId}`);

      const response = await bridgeRequest(`/customers/${customerId}/wallets`, {
        method: "POST",
        body: JSON.stringify(walletRequest),
      });

      if (response.error) {
        return {
          success: false,
          error: `Wallet Creation Error: ${response.error.message}`,
        };
      }

      console.log("✅ Bridge wallet created successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Wallet Creation Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Get all wallets for Bridge customer
   */
  getCustomerWallets: async (customerId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> => {
    try {
      console.log(`💳 Bridge API: Getting wallets for customer ${customerId}`);
      
      const response = await bridgeRequest(`/customers/${customerId}/wallets`);

      if (response.error) {
        console.error(`❌ Bridge API Error getting wallets:`, response.error);
        return {
          success: false,
          error: `Get Wallets Error: ${response.error.message}`,
        };
      }

      // Log the exact response structure for debugging
      console.log(`🔍 Bridge API response structure:`, {
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        rawResponse: response.data
      });

      // Bridge API returns: { count: number, data: Array }
      // We need to extract the 'data' property from the response
      let walletsArray: any[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // If response.data is already an array (older API format)
          walletsArray = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Check if it's the new API format with count and data properties
          const responseObj = response.data as any;
          if (responseObj.data && Array.isArray(responseObj.data)) {
            // If response.data has a 'data' property with the array (current API format)
            walletsArray = responseObj.data;
            console.log(`📊 Bridge reported ${responseObj.count || 'unknown'} wallets, found ${walletsArray.length} in data array`);
          } else {
            console.warn(`⚠️ Unexpected Bridge API response format:`, response.data);
          }
        }
      }

      console.log(`✅ Successfully extracted ${walletsArray.length} wallets from Bridge API`);

      return {
        success: true,
        data: walletsArray,
      };
    } catch (error) {
      console.error(`💥 Exception getting wallets for customer ${customerId}:`, error);
      return {
        success: false,
        error: `Get Wallets Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Get specific wallet details with balance information
   * GET /customers/{customerId}/wallets/{walletId}
   */
  getWalletDetails: async (customerId: string, walletId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      console.log(`💳 Bridge API: Getting wallet details for ${walletId}`);
      
      const response = await bridgeRequest(`/customers/${customerId}/wallets/${walletId}`);

      if (response.error) {
        console.error(`❌ Bridge API Error getting wallet details:`, response.error);
        return {
          success: false,
          error: `Get Wallet Details Error: ${response.error.message}`,
        };
      }

      console.log(`✅ Wallet details retrieved for ${walletId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`💥 Exception getting wallet details for ${walletId}:`, error);
      return {
        success: false,
        error: `Get Wallet Details Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Get transaction history for a specific wallet
   * GET /wallets/{walletId}/history - This endpoint DOES exist in Bridge.xyz API
   */
  getWalletTransactions: async (
    walletId: string, 
    options: { 
      limit?: number; 
      offset?: number; 
      startDate?: string; 
      endDate?: string;
    } = {}
  ): Promise<{
    success: boolean;
    data?: any[];
    count?: number;
    error?: string;
  }> => {
    try {
      console.log(`📊 Bridge API: Getting transaction history for wallet ${walletId}`);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      if (options.startDate) queryParams.append('start_date', options.startDate);
      if (options.endDate) queryParams.append('end_date', options.endDate);
      
      const endpoint = `/wallets/${walletId}/history${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      const response = await bridgeRequest(endpoint);

      if (response.error) {
        console.error(`❌ Bridge API Error getting wallet history:`, response.error);
        return {
          success: false,
          error: `Get Wallet History Error: ${response.error.message}`,
        };
      }

      // Handle response format
      let transactionsArray: any[] = [];
      let totalCount = 0;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          transactionsArray = response.data;
          totalCount = transactionsArray.length;
        } else if (typeof response.data === 'object' && response.data !== null) {
          const responseObj = response.data as any;
          if (responseObj.data && Array.isArray(responseObj.data)) {
            transactionsArray = responseObj.data;
            totalCount = responseObj.count || transactionsArray.length;
          }
        }
      }

      console.log(`✅ Retrieved ${transactionsArray.length} transactions for wallet ${walletId}`);
      return {
        success: true,
        data: transactionsArray,
        count: totalCount,
      };
    } catch (error) {
      console.error(`💥 Exception getting wallet history for ${walletId}:`, error);
      return {
        success: false,
        error: `Get Wallet History Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Get recent transactions across all wallets for a customer
   * Uses the correct /wallets/{walletId}/history endpoint for each wallet
   */
  getCustomerTransactions: async (
    customerId: string, 
    options: { 
      limit?: number; 
      offset?: number; 
    } = {}
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> => {
    try {
      console.log(`📊 Bridge API: Getting recent transactions for customer ${customerId}`);
      
      // First get all customer wallets
      const walletsResponse = await bridgeService.getCustomerWallets(customerId);
      
      if (!walletsResponse.success || !walletsResponse.data) {
        return {
          success: false,
          error: walletsResponse.error || 'Failed to fetch customer wallets',
        };
      }

      const wallets = walletsResponse.data;
      console.log(`💳 Found ${wallets.length} wallets for customer`);

      // Get transactions from each wallet using correct endpoint
      const allTransactions: any[] = [];
      
      for (const wallet of wallets) {
        try {
          const transactionsResponse = await bridgeService.getWalletTransactions(
            wallet.id, 
            { limit: options.limit || 10 }
          );
          
          if (transactionsResponse.success && transactionsResponse.data) {
            // Add wallet info to each transaction
            const walletTransactions = transactionsResponse.data.map((tx: any) => ({
              ...tx,
              walletId: wallet.id,
              walletAddress: wallet.address,
              walletChain: wallet.chain || wallet.network,
            }));
            
            allTransactions.push(...walletTransactions);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get transactions for wallet ${wallet.id}:`, error);
          // Continue with other wallets even if one fails
        }
      }

      // Sort by timestamp (most recent first) and limit results
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
        const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      const limitedTransactions = allTransactions.slice(0, options.limit || 5);

      console.log(`✅ Retrieved ${limitedTransactions.length} recent transactions for customer`);
      return {
        success: true,
        data: limitedTransactions,
      };
    } catch (error) {
      console.error(`💥 Exception getting customer transactions:`, error);
      return {
        success: false,
        error: `Get Customer Transactions Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Get wallet balance for a specific wallet
   * This extracts balance information from wallet details
   */
  getWalletBalance: async (customerId: string, walletId: string): Promise<{
    success: boolean;
    balance?: string;
    currency?: string;
    error?: string;
  }> => {
    try {
      const walletResponse = await bridgeService.getWalletDetails(customerId, walletId);
      
      if (!walletResponse.success || !walletResponse.data) {
        return {
          success: false,
          error: walletResponse.error || 'Failed to get wallet details',
        };
      }

      const wallet = walletResponse.data;
      return {
        success: true,
        balance: wallet.balance || '0',
        currency: wallet.currency || 'USDC',
      };
    } catch (error) {
      console.error(`💥 Exception getting wallet balance:`, error);
      return {
        success: false,
        error: `Get Wallet Balance Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Sync customer status from Bridge (for updates)
   */
  syncCustomerStatus: async (customerId: string): Promise<{
    verificationStatus: string;
    requirementsDue: string[];
    error?: string;
  }> => {
    try {
      const customerResponse = await bridgeService.getCustomer(customerId);

      if (!customerResponse.success || !customerResponse.data) {
        return {
          verificationStatus: "pending",
          requirementsDue: [],
          error: customerResponse.error,
        };
      }

      return {
        verificationStatus: customerResponse.data.verification_status,
        requirementsDue: customerResponse.data.requirements_due,
      };
    } catch (error) {
      return {
        verificationStatus: "pending",
        requirementsDue: [],
        error: `Sync Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },

  /**
   * Create default USDC wallet for new customers
   */
  createDefaultWallet: async (customerId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    return bridgeService.createWallet(customerId, {
      chain: "solana", // Using Solana as per Bridge.xyz documentation
    });
  },

  /**
   * Utility: Check if Bridge API is configured
   */
  isConfigured: (): boolean => {
    return !!BRIDGE_API_KEY && !!BRIDGE_API_URL;
  },

  /**
   * Check if a crypto-to-crypto liquidation pair is supported by Bridge.xyz
   */
  isLiquidationPairSupported: (
    chain: string,
    currency: string,
    destinationPaymentRail: string,
    destinationCurrency: string
  ): boolean => {
    // Bridge.xyz supported chains and currencies based on API documentation
    const supportedChains = [
      'arbitrum',
      'avalanche_c_chain', 
      'base',
      'ethereum',
      'optimism',
      'polygon',
      'solana',
      'stellar',
      'tron'
    ];

    const supportedCurrencies = [
      'usdb',
      'usdc', 
      'usdt',
      'dai',
      'pyusd',
      'eurc'
    ];

    // Check if both chains and currencies are supported
    const isChainSupported = supportedChains.includes(chain);
    const isCurrencySupported = supportedCurrencies.includes(currency);
    const isDestinationRailSupported = supportedChains.includes(destinationPaymentRail);
    const isDestinationCurrencySupported = supportedCurrencies.includes(destinationCurrency);

    return isChainSupported && isCurrencySupported && isDestinationRailSupported && isDestinationCurrencySupported;
  },

  /**
   * Get supported liquidation pairs for a given chain
   */
  getSupportedLiquidationPairs: (chain: string): Array<{
    currency: string;
    destinationPaymentRail: string;
    destinationCurrency: string;
  }> => {
    // For now, we'll focus on the main chains you mentioned
    const mainChains = ['solana', 'ethereum', 'stellar', 'polygon'];
    
    if (!mainChains.includes(chain)) {
      return [];
    }

    // Default destination is always Solana USDC
    const defaultDestination = {
      destinationPaymentRail: 'solana',
      destinationCurrency: 'usdc'
    };

    // Supported currencies for each chain
    const supportedCurrencies = {
      solana: ['usdc', 'usdt'],
      ethereum: ['usdc', 'usdt', 'dai'],
      stellar: ['usdc'],
      polygon: ['usdc', 'usdt']
    };

    const currencies = supportedCurrencies[chain as keyof typeof supportedCurrencies] || [];

    return currencies.map(currency => ({
      currency,
      ...defaultDestination
    }));
  },

  /**
   * Create a liquidation address for crypto deposits
   * POST /customers/{customerId}/liquidation_addresses
   */
  createLiquidationAddress: async (
    customerId: string,
    params: CreateLiquidationAddressParams
  ): Promise<{
    success: boolean;
    data?: BridgeLiquidationAddress;
    error?: string;
  }> => {
    try {
      console.log(`📡 Bridge API: Creating liquidation address for customer ${customerId}`);
      console.log(`📡 Parameters:`, params);

      const response = await fetch(`${BRIDGE_API_URL}/customers/${customerId}/liquidation_addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': BRIDGE_API_KEY,
          'Idempotency-Key': `liquidation-${customerId}-${Date.now()}`,
        },
        body: JSON.stringify(params),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Bridge API: Failed to create liquidation address:', response.status, responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.log('✅ Bridge API: Liquidation address created successfully:', responseData);
      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('❌ Bridge API: Error creating liquidation address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get all liquidation addresses for a customer
   * GET /customers/{customerId}/liquidation_addresses
   */
  getLiquidationAddresses: async (customerId: string): Promise<{
    success: boolean;
    data?: BridgeLiquidationAddress[];
    error?: string;
  }> => {
    try {
      console.log(`📡 Bridge API: Getting liquidation addresses for customer ${customerId}`);

      const response = await fetch(`${BRIDGE_API_URL}/customers/${customerId}/liquidation_addresses`, {
        method: 'GET',
        headers: {
          'Api-Key': BRIDGE_API_KEY,
          'accept': 'application/json',
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Bridge API: Failed to get liquidation addresses:', response.status, responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.log(`✅ Bridge API: Retrieved ${responseData.data?.length || 0} liquidation addresses`);
      return {
        success: true,
        data: responseData.data || [],
      };
    } catch (error) {
      console.error('❌ Bridge API: Error getting liquidation addresses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Get specific liquidation address
   * GET /customers/{customerId}/liquidation_addresses/{liquidationId}
   */
  getLiquidationAddress: async (
    customerId: string, 
    liquidationId: string
  ): Promise<{
    success: boolean;
    data?: BridgeLiquidationAddress;
    error?: string;
  }> => {
    try {
      console.log(`📡 Bridge API: Getting liquidation address ${liquidationId} for customer ${customerId}`);

      const response = await fetch(
        `${BRIDGE_API_URL}/customers/${customerId}/liquidation_addresses/${liquidationId}`,
        {
          method: 'GET',
          headers: {
            'Api-Key': BRIDGE_API_KEY,
            'accept': 'application/json',
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Bridge API: Failed to get liquidation address:', response.status, responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.log('✅ Bridge API: Retrieved liquidation address:', responseData);
      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('❌ Bridge API: Error getting liquidation address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },

  /**
   * Utility: Test Bridge API connectivity
   */
  testConnection: async (): Promise<{ success: boolean; error?: string }> => {
    if (!bridgeService.isConfigured()) {
      return {
        success: false,
        error: "Bridge API not configured",
      };
    }

    try {
      // Test with ToS generation (lightweight test)
      const tosResponse = await bridgeService.generateTosLink();
      return {
        success: tosResponse.success,
        error: tosResponse.error,
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },
};