/**
 * Enhanced Wallet Management Types
 * Comprehensive type definitions for Bridge.xyz integration and Supabase persistence
 */

// ==================== ENUMS ====================

export type WalletChain = 'solana' | 'base';
export type WalletCurrency = 'usdc' | 'sol' | 'eth';
export type WalletTag = 'general_use' | 'p2p';

// ==================== BRIDGE API TYPES ====================

/**
 * Bridge.xyz Wallet as returned by their API
 */
export interface BridgeWallet {
  id: string;                           // Bridge wallet ID (e.g., "bridge_wallet_xxxxx")
  chain: WalletChain;                   // Blockchain network
  address: string;                      // Wallet address on blockchain
  tags: string[];                       // Bridge tags array
  created_at: string;                   // ISO timestamp
  updated_at: string;                   // ISO timestamp
  currency?: WalletCurrency;            // Optional currency info
}

/**
 * Bridge API Request to create a new wallet
 */
export interface BridgeWalletCreateRequest {
  chain: WalletChain;                   // Required: blockchain network
  currency?: WalletCurrency;            // Optional: wallet currency (Bridge may default to USDC)
  tags?: string[];                      // Optional: Bridge tags
}

/**
 * Bridge API Response for wallet creation
 */
export interface BridgeWalletCreateResponse {
  success: boolean;
  wallet?: BridgeWallet;
  error?: string;
  errorCode?: string;
}

/**
 * Bridge API Response for listing wallets
 */
export interface BridgeWalletListResponse {
  success: boolean;
  wallets?: BridgeWallet[];
  count?: number;
  error?: string;
  errorCode?: string;
}

// ==================== SUPABASE TYPES ====================

/**
 * Wallet record as stored in Supabase database
 */
export interface Wallet {
  id: string;                           // Supabase record ID (cuid)
  createdAt: Date;                      // Record creation timestamp
  updatedAt: Date;                      // Record update timestamp
  profileId: string;                    // Foreign key to profiles table
  walletTag: WalletTag;                 // App-specific wallet categorization
  isActive: boolean;                    // Wallet active status
  bridgeWalletId: string;               // Bridge wallet ID (unique)
  chain: WalletChain;                   // Blockchain network
  address: string;                      // Wallet address
  bridgeTags: string[];                 // Bridge tags array
  bridgeCreatedAt: Date | null;         // Bridge creation timestamp
  bridgeUpdatedAt: Date | null;         // Bridge update timestamp
}

/**
 * Data structure for creating a new wallet in Supabase
 */
export interface WalletCreateData {
  profileId: string;
  walletTag: WalletTag;
  bridgeWalletId: string;
  chain: WalletChain;
  address: string;
  bridgeTags: string[];
  bridgeCreatedAt: Date | null;
  bridgeUpdatedAt: Date | null;
}

/**
 * Data structure for updating wallet in Supabase
 */
export interface WalletUpdateData {
  walletTag?: WalletTag;
  isActive?: boolean;
  bridgeTags?: string[];
  bridgeUpdatedAt?: Date | null;
  updatedAt?: Date;
}

// ==================== SERVICE INTERFACES ====================

/**
 * Response interface for wallet service operations
 */
export interface WalletServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Request interface for creating a wallet via service
 */
export interface WalletServiceCreateRequest {
  profileId: string;
  customerId: string;                   // Bridge customer ID
  chain: WalletChain;
  currency: WalletCurrency;
  walletTag?: WalletTag;                // App-specific tag (defaults to general_use)
  bridgeTags?: string[];                // Bridge-specific tags
}

/**
 * Sync operation result
 */
export interface WalletSyncResult {
  success: boolean;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  errors: string[];
}

// ==================== UI COMPONENT PROPS ====================

/**
 * Props for WalletList component
 */
export interface WalletListProps {
  wallets: Wallet[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  onWalletPress?: (wallet: Wallet) => void;
}

/**
 * Props for WalletItem component
 */
export interface WalletItemProps {
  wallet: Wallet;
  onPress?: (wallet: Wallet) => void;
  showActions?: boolean;
}

/**
 * Props for CreateWalletModal component
 */
export interface CreateWalletModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: (wallet: Wallet) => void;
  profileId: string;
  customerId: string;
}

/**
 * Props for WalletSyncButton component
 */
export interface WalletSyncButtonProps {
  onSync: () => Promise<void>;
  isLoading?: boolean;
  showText?: boolean;
  disabled?: boolean;
}

// ==================== STORE INTERFACES ====================

/**
 * Wallet-related state in auth store
 */
export interface WalletState {
  wallets: Wallet[];
  walletsLoading: boolean;
  walletsError: string | null;
  walletsSyncedAt: Date | null;
}

/**
 * Wallet-related actions for auth store
 */
export interface WalletActions {
  loadUserWallets: (profileId: string) => Promise<boolean>;
  createWallet: (request: WalletServiceCreateRequest) => Promise<Wallet | null>;
  syncWallets: (profileId: string, customerId: string) => Promise<WalletSyncResult>;
  refreshWallets: (profileId: string) => Promise<boolean>;
  clearWalletError: () => void;
  setWalletLoading: (loading: boolean) => void;
}

// ==================== UTILITY TYPES ====================

/**
 * Configuration for wallet creation
 */
export interface WalletConfig {
  enableWalletCreation: boolean;
  supportedChains: WalletChain[];
  supportedCurrencies: WalletCurrency[];
  defaultWalletTag: WalletTag;
  maxWalletsPerUser: number;
}

/**
 * Wallet statistics for analytics
 */
export interface WalletStats {
  totalWallets: number;
  activeWallets: number;
  chainDistribution: Record<WalletChain, number>;
  tagDistribution: Record<WalletTag, number>;
}

/**
 * Environment configuration for wallet features
 */
export interface WalletEnvironmentConfig {
  isSandboxMode: boolean;
  bridgeApiUrl: string;
  bridgeApiKey: string;
  enableWalletCreation: boolean;
}

// ==================== ERROR TYPES ====================

export type WalletErrorCode = 
  | 'BRIDGE_API_ERROR'
  | 'BRIDGE_CUSTOMER_NOT_FOUND'
  | 'WALLET_CREATION_FAILED'
  | 'WALLET_SYNC_FAILED'
  | 'DATABASE_ERROR'
  | 'INVALID_WALLET_DATA'
  | 'ENVIRONMENT_NOT_SUPPORTED'
  | 'MAX_WALLETS_EXCEEDED'
  | 'CHAIN_NOT_SUPPORTED';

export interface WalletError {
  code: WalletErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
}

// ==================== CONSTANTS ====================

export const WALLET_CONSTANTS = {
  MAX_WALLETS_PER_USER: 10,
  SUPPORTED_CHAINS: ['solana', 'base'] as WalletChain[],
  SUPPORTED_CURRENCIES: ['usdc'] as WalletCurrency[], // Start with USDC only
  DEFAULT_WALLET_TAG: 'general_use' as WalletTag,
  SYNC_TIMEOUT_MS: 30000,
  DEFAULT_BRIDGE_TAGS: ['primary'], // Remove as const to make it mutable
};

// ==================== TYPE GUARDS ====================

/**
 * Type guard to check if a value is a valid WalletChain
 */
export const isValidWalletChain = (chain: any): chain is WalletChain => {
  return typeof chain === 'string' && WALLET_CONSTANTS.SUPPORTED_CHAINS.includes(chain as WalletChain);
};

/**
 * Type guard to check if a value is a valid WalletCurrency
 */
export const isValidWalletCurrency = (currency: any): currency is WalletCurrency => {
  return typeof currency === 'string' && WALLET_CONSTANTS.SUPPORTED_CURRENCIES.includes(currency as WalletCurrency);
};

/**
 * Type guard to check if a value is a valid WalletTag
 */
export const isValidWalletTag = (tag: any): tag is WalletTag => {
  return typeof tag === 'string' && ['general_use', 'p2p'].includes(tag);
}; 