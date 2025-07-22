/**
 * Wallet Configuration
 * Centralized configuration and environment validation for wallet functionality
 */

import { WalletConfig, WalletEnvironmentConfig } from '../types/WalletTypes';

// ==================== ENVIRONMENT CONFIGURATION ====================

/**
 * Get wallet environment configuration from environment variables
 */
export const getWalletEnvironmentConfig = (): WalletEnvironmentConfig => {
  const isSandboxMode = process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE === 'true';
  const bridgeApiKey = process.env.EXPO_PUBLIC_BRIDGE_API_KEY || '';
  const enableWalletCreation = process.env.EXPO_PUBLIC_ENABLE_WALLET_CREATION === 'true';
  
  return {
    isSandboxMode,
    bridgeApiUrl: process.env.EXPO_PUBLIC_BRIDGE_API_URL || 'https://api.bridge.xyz/v0',
    bridgeApiKey,
    enableWalletCreation: enableWalletCreation && !isSandboxMode, // Only enable in production
  };
};

/**
 * Get wallet feature configuration
 */
export const getWalletConfig = (): WalletConfig => {
  return {
    enableWalletCreation: canCreateWallets(),
    supportedChains: ['solana', 'base'],
    supportedCurrencies: ['usdc'],
    defaultWalletTag: 'general_use',
    maxWalletsPerUser: 10,
  };
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Check if wallet creation is available in current environment
 */
export const canCreateWallets = (): boolean => {
  const config = getWalletEnvironmentConfig();
  
  // Wallet creation requires:
  // 1. Not in sandbox mode (production only)
  // 2. Bridge API key configured
  // 3. Feature flag enabled
  return !config.isSandboxMode && 
         !!config.bridgeApiKey && 
         config.enableWalletCreation;
};

/**
 * Check if Bridge integration is properly configured
 */
export const isBridgeConfigured = (): boolean => {
  const config = getWalletEnvironmentConfig();
  return !!config.bridgeApiKey && !!config.bridgeApiUrl;
};

/**
 * Check if wallet sync is available
 */
export const canSyncWallets = (): boolean => {
  // Wallet sync is available in both sandbox and production if Bridge is configured
  return isBridgeConfigured();
};

/**
 * Get environment status for debugging
 */
export const getEnvironmentStatus = () => {
  const config = getWalletEnvironmentConfig();
  
  return {
    environment: config.isSandboxMode ? 'sandbox' : 'production',
    bridgeConfigured: isBridgeConfigured(),
    canCreateWallets: canCreateWallets(),
    canSyncWallets: canSyncWallets(),
    apiUrl: config.bridgeApiUrl,
    hasApiKey: !!config.bridgeApiKey,
    features: {
      walletCreation: config.enableWalletCreation,
      walletSync: canSyncWallets(),
    },
  };
};

// ==================== FEATURE FLAGS ====================

/**
 * Feature flags for wallet functionality
 */
export const WALLET_FEATURES = {
  // Core features
  WALLET_CREATION: 'wallet_creation',
  WALLET_SYNC: 'wallet_sync',
  WALLET_MANAGEMENT: 'wallet_management',
  
  // UI features
  WALLET_LIST: 'wallet_list',
  WALLET_DETAILS: 'wallet_details',
  CREATE_WALLET_MODAL: 'create_wallet_modal',
  
  // Advanced features
  MULTI_CHAIN_SUPPORT: 'multi_chain_support',
  WALLET_ANALYTICS: 'wallet_analytics',
} as const;

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (feature: string): boolean => {
  const config = getWalletConfig();
  
  switch (feature) {
    case WALLET_FEATURES.WALLET_CREATION:
      return config.enableWalletCreation;
    
    case WALLET_FEATURES.WALLET_SYNC:
      return canSyncWallets();
    
    case WALLET_FEATURES.WALLET_MANAGEMENT:
      return isBridgeConfigured();
    
    case WALLET_FEATURES.WALLET_LIST:
      return true; // Always enabled
    
    case WALLET_FEATURES.CREATE_WALLET_MODAL:
      return config.enableWalletCreation;
    
    case WALLET_FEATURES.MULTI_CHAIN_SUPPORT:
      return config.supportedChains.length > 1;
    
    case WALLET_FEATURES.WALLET_ANALYTICS:
      return true; // Always enabled for analytics
    
    default:
      return false;
  }
};

// ==================== ERROR MESSAGES ====================

/**
 * Get user-friendly error messages for different scenarios
 */
export const getErrorMessages = () => {
  const config = getWalletEnvironmentConfig();
  
  return {
    notInProduction: 'Wallet creation is only available in production environment.',
    bridgeNotConfigured: 'Bridge integration is not properly configured.',
    noApiKey: 'Bridge API key is missing.',
    featureDisabled: 'This feature is currently disabled.',
    sandboxLimitation: config.isSandboxMode 
      ? 'This feature is not available in sandbox mode.' 
      : null,
  };
};

// ==================== DEBUGGING ====================

/**
 * Log current wallet configuration for debugging
 */
export const logWalletConfig = () => {
  if (__DEV__) {
    const status = getEnvironmentStatus();
    const config = getWalletConfig();
    
    console.log('🔧 Wallet Configuration:', {
      ...status,
      config,
      errorMessages: getErrorMessages(),
    });
  }
};

// ==================== EXPORTS ====================

export default {
  getWalletEnvironmentConfig,
  getWalletConfig,
  canCreateWallets,
  isBridgeConfigured,
  canSyncWallets,
  isFeatureEnabled,
  getEnvironmentStatus,
  getErrorMessages,
  logWalletConfig,
  WALLET_FEATURES,
}; 