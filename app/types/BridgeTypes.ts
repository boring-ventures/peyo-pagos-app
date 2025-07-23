// Bridge.xyz Types for API Integration
export type BridgeVerificationStatus = 
  | 'pending' 
  | 'in_review' 
  | 'active' 
  | 'rejected' 
  | 'suspended';

export type BridgeCapabilityStatus = 
  | 'enabled' 
  | 'disabled' 
  | 'pending' 
  | 'restricted';

export type BridgeCustomerType = 'individual' | 'business';

export type BridgeDocumentType = 
  | 'drivers_license' 
  | 'passport' 
  | 'national_id' 
  | 'voter_id';

export type BridgeEndorsementType = 'base' | 'sepa' | 'spei';

export type BridgeEndorsementStatus = 'incomplete' | 'approved' | 'revoked';

// Bridge Endorsement (from customer response)
export interface BridgeEndorsement {
  name: BridgeEndorsementType;
  status: BridgeEndorsementStatus;
  requirements?: {
    issues?: string[];
    missing?: string[];
    pending?: string[];
    complete?: string[];
  };
}

// Bridge Customer Request (for POST /customers)
export interface BridgeCustomerRequest {
  type: BridgeCustomerType;
  first_name: string;
  last_name: string;
  email: string;
  residential_address: {
    street_line_1: string;
    street_line_2?: string;
    city: string;
    subdivision?: string;
    postal_code?: string;
    country: string; // ISO 3166-1 alpha-2 country code
  };
  birth_date: string; // YYYY-MM-DD format
  signed_agreement_id: string;
  identifying_information: Array<{
    type: BridgeDocumentType;
    issuing_country: string; // ISO 3166-1 alpha-2 country code
    number?: string;
    image_front: string; // Base64 encoded image
    image_back?: string; // Base64 encoded image (optional for some docs)
  }>;
}

// Bridge Customer Response (from GET /customers/{id})
export interface BridgeCustomer {
  id: string;
  type: BridgeCustomerType;
  first_name: string;
  last_name: string;
  email: string;
  status: BridgeVerificationStatus; // Campo real de Bridge
  residential_address: {
    street_line_1: string;
    street_line_2?: string;
    city: string;
    subdivision?: string;
    postal_code?: string;
    country: string;
  };
  birth_date: string;
  verification_status: BridgeVerificationStatus; // Mantener para compatibilidad
  requirements_due: string[];
  future_requirements_due?: string[]; // Campo adicional de Bridge
  payin_crypto: BridgeCapabilityStatus;
  payout_crypto: BridgeCapabilityStatus;
  signed_agreement_id: string;
  has_accepted_terms_of_service: boolean; // Campo real de Bridge
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  endorsements?: BridgeEndorsement[]; // Optional endorsements array
  rejection_reasons?: string[]; // Campo real de Bridge
  capabilities?: {
    payin_crypto: BridgeCapabilityStatus;
    payout_crypto: BridgeCapabilityStatus;
    payin_fiat: BridgeCapabilityStatus;
    payout_fiat: BridgeCapabilityStatus;
  }; // Campo real de Bridge
}

// Bridge Terms of Service Response
export interface BridgeTosResponse {
  id: string;
  url: string;
  expires_at: string; // ISO 8601 timestamp
}

// Bridge Wallet Request (for POST /customers/{id}/wallets)
export interface BridgeWalletRequest {
  currency: string; // e.g., "usdc", "btc", "eth"
  network?: string; // e.g., "ethereum", "polygon", "base"
}

// Bridge Wallet Response
export interface BridgeWallet {
  id: string;
  customer_id: string;
  currency: string;
  network: string;
  address: string;
  balance: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Bridge API Error Response
export interface BridgeApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Bridge API Response wrapper
export interface BridgeApiResponse<T> {
  data?: T;
  error?: BridgeApiError;
}

// Local Bridge Integration Status (for our stores)
export interface BridgeIntegrationStatus {
  bridgeCustomerId: string | null;
  bridgeVerificationStatus: BridgeVerificationStatus | null;
  signedAgreementId: string | null;
  hasAcceptedTermsOfService: boolean;
  requirementsDue: string[];
  payinCrypto: BridgeCapabilityStatus | null;
  payoutCrypto: BridgeCapabilityStatus | null;
  wallets: BridgeWallet[];
  lastSyncAt: string | null;
  integrationError: string | null;
  isLoading: boolean;
}

// Extended KYC Profile for Bridge integration (maps to Supabase profiles)
export interface KycProfileForBridge {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  phone: string;
  address: {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    subdivision?: string;
    postalCode?: string;
    country: string; // ISO 3166-1 alpha-2
  };
  identifyingInfo: {
    type: BridgeDocumentType;
    issuingCountry: string; // ISO 3166-1 alpha-2
    number?: string;
    imageFront: string; // Base64 or URL
    imageBack?: string; // Base64 or URL
  };
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'rejected';
}

// Service layer types
export interface BridgeServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface BridgeCreateCustomerResponse extends BridgeServiceResponse<BridgeCustomer> {}
export interface BridgeGetCustomerResponse extends BridgeServiceResponse<BridgeCustomer> {}
export interface BridgeCreateWalletResponse extends BridgeServiceResponse<BridgeWallet> {}
export interface BridgeGetWalletsResponse extends BridgeServiceResponse<BridgeWallet[]> {}
export interface BridgeTosLinkResponse extends BridgeServiceResponse<BridgeTosResponse> {} 