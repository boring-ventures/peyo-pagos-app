/**
 * Enhanced Wallet Service
 * Comprehensive wallet management combining Bridge.xyz API with Supabase persistence
 */

import { createId } from '@paralleldrive/cuid2';
import {
    canCreateWallets,
    getErrorMessages,
    getWalletEnvironmentConfig
} from '../config/walletConfig';
import {
    BridgeWallet,
    BridgeWalletCreateRequest,
    BridgeWalletCreateResponse,
    BridgeWalletListResponse,
    WALLET_CONSTANTS,
    Wallet,
    WalletCreateData,
    WalletServiceCreateRequest,
    WalletServiceResponse,
    WalletSyncResult,
    WalletTag,
    WalletUpdateData,
    isValidWalletChain,
    isValidWalletTag
} from '../types/WalletTypes';
import { bridgeService } from './bridgeService';
import { supabaseAdmin } from './supabaseAdmin';

// ==================== ENVIRONMENT CONFIGURATION ====================

// Now using centralized wallet configuration from ../config/walletConfig.ts

// ==================== UTILITY FUNCTIONS ====================

/**
 * Determine wallet tag based on Bridge tags
 */
const determineWalletTag = (bridgeTags: string[]): WalletTag => {
  // Simple logic: if contains 'p2p' or 'peer', use p2p, otherwise general_use
  const hasP2PTag = bridgeTags.some(tag => 
    tag.toLowerCase().includes('p2p') || 
    tag.toLowerCase().includes('peer')
  );
  
  return hasP2PTag ? 'p2p' : 'general_use';
};

/**
 * Format Bridge wallet data for Supabase database storage
 */
const formatBridgeWalletForDatabase = (
  bridgeWallet: BridgeWallet, 
  profileId: string
): WalletCreateData => {
  const walletTag = determineWalletTag(bridgeWallet.tags || []);
  
  return {
    profileId,
    walletTag,
    bridgeWalletId: bridgeWallet.id,
    chain: bridgeWallet.chain,
    address: bridgeWallet.address,
    bridgeTags: bridgeWallet.tags || [],
    bridgeCreatedAt: bridgeWallet.created_at ? new Date(bridgeWallet.created_at) : null,
    bridgeUpdatedAt: bridgeWallet.updated_at ? new Date(bridgeWallet.updated_at) : null,
  };
};

/**
 * Validate wallet creation request
 */
const validateWalletCreateRequest = (request: WalletServiceCreateRequest): string | null => {
  if (!request.profileId || typeof request.profileId !== 'string') {
    return 'Invalid profile ID';
  }
  
  if (!request.customerId || typeof request.customerId !== 'string') {
    return 'Invalid customer ID';
  }
  
  if (!isValidWalletChain(request.chain)) {
    return `Unsupported chain: ${request.chain}`;
  }
  
  if (!WALLET_CONSTANTS.SUPPORTED_CURRENCIES.includes(request.currency)) {
    return `Unsupported currency: ${request.currency}`;
  }
  
  if (request.walletTag && !isValidWalletTag(request.walletTag)) {
    return `Invalid wallet tag: ${request.walletTag}`;
  }
  
  return null;
};

// ==================== BRIDGE API INTEGRATION ====================

/**
 * Create a new wallet on Bridge.xyz
 */
const createWalletOnBridge = async (
  customerId: string, 
  walletData: BridgeWalletCreateRequest
): Promise<BridgeWalletCreateResponse> => {
  try {
    console.log('💳 Creating wallet on Bridge:', { customerId, chain: walletData.chain, currency: walletData.currency });

    if (!canCreateWallets()) {
      const errorMessages = getErrorMessages();
      return {
        success: false,
        error: errorMessages.sandboxLimitation || errorMessages.notInProduction,
        errorCode: 'ENVIRONMENT_NOT_SUPPORTED'
      };
    }

    // Use existing bridgeService createWallet function
    // Following Bridge.xyz official documentation: only chain is required
    const walletPayload: any = {
      chain: walletData.chain,
    };
    
    // Add optional parameters only if specified
    if (walletData.currency) {
      walletPayload.currency = walletData.currency;
    }
    if (walletData.tags && walletData.tags.length > 0) {
      walletPayload.tags = walletData.tags;
    }
    
    const result = await bridgeService.createWallet(customerId, walletPayload);

    if (!result.success) {
      console.error('❌ Bridge wallet creation failed:', result.error);
      return {
        success: false,
        error: result.error,
        errorCode: 'BRIDGE_API_ERROR'
      };
    }

    console.log('✅ Bridge wallet created successfully:', result.data?.id);
    
    return {
      success: true,
      wallet: result.data as BridgeWallet
    };

  } catch (error) {
    console.error('💥 Error creating wallet on Bridge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'BRIDGE_API_ERROR'
    };
  }
};

/**
 * Get all wallets from Bridge.xyz for a customer
 */
const getWalletsFromBridge = async (customerId: string): Promise<BridgeWalletListResponse> => {
  try {
    console.log('💳 Getting wallets from Bridge for customer:', customerId);

    const result = await bridgeService.getCustomerWallets(customerId);

    if (!result.success) {
      console.error('❌ Failed to get Bridge wallets:', result.error);
      return {
        success: false,
        error: result.error,
        errorCode: 'BRIDGE_API_ERROR'
      };
    }

    const wallets = (result.data || []) as BridgeWallet[];
    console.log(`✅ Retrieved ${wallets.length} wallets from Bridge`);

    return {
      success: true,
      wallets,
      count: wallets.length
    };

  } catch (error) {
    console.error('💥 Error getting wallets from Bridge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'BRIDGE_API_ERROR'
    };
  }
};

// ==================== SUPABASE DATABASE INTEGRATION ====================

/**
 * Save wallet to Supabase database
 */
const saveWalletToDatabase = async (walletData: WalletCreateData): Promise<WalletServiceResponse<Wallet>> => {
  try {
    console.log('💾 Saving wallet to database:', { 
      profileId: walletData.profileId, 
      chain: walletData.chain,
      bridgeWalletId: walletData.bridgeWalletId 
    });

    const walletId = createId();
    const now = new Date();

    const dbWallet = {
      id: walletId,
      createdAt: now,
      updatedAt: now,
      profile_id: walletData.profileId,
      wallet_tag: walletData.walletTag,
      is_active: true,
      bridge_wallet_id: walletData.bridgeWalletId,
      chain: walletData.chain,
      address: walletData.address,
      bridge_tags: walletData.bridgeTags,
      bridge_created_at: walletData.bridgeCreatedAt,
      bridge_updated_at: walletData.bridgeUpdatedAt,
    };

    const { data, error } = await supabaseAdmin
      .from('wallets')
      .insert(dbWallet)
      .select()
      .single();

    if (error) {
      console.error('❌ Database wallet save error:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
        errorCode: 'DATABASE_ERROR'
      };
    }

    console.log('✅ Wallet saved to database successfully:', data.id);

    // Transform response to match Wallet interface
    const wallet: Wallet = {
      id: data.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      profileId: data.profile_id,
      walletTag: data.wallet_tag,
      isActive: data.is_active,
      bridgeWalletId: data.bridge_wallet_id,
      chain: data.chain,
      address: data.address,
      bridgeTags: data.bridge_tags || [],
      bridgeCreatedAt: data.bridge_created_at ? new Date(data.bridge_created_at) : null,
      bridgeUpdatedAt: data.bridge_updated_at ? new Date(data.bridge_updated_at) : null,
    };

    return {
      success: true,
      data: wallet
    };

  } catch (error) {
    console.error('💥 Error saving wallet to database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'DATABASE_ERROR'
    };
  }
};

/**
 * Get all wallets from database for a profile
 */
const getWalletsFromDatabase = async (profileId: string): Promise<WalletServiceResponse<Wallet[]>> => {
  try {
    console.log('💾 Getting wallets from database for profile:', profileId);

    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Database wallet fetch error:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
        errorCode: 'DATABASE_ERROR'
      };
    }

    const wallets: Wallet[] = (data || []).map(item => ({
      id: item.id,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      profileId: item.profile_id,
      walletTag: item.wallet_tag,
      isActive: item.is_active,
      bridgeWalletId: item.bridge_wallet_id,
      chain: item.chain,
      address: item.address,
      bridgeTags: item.bridge_tags || [],
      bridgeCreatedAt: item.bridge_created_at ? new Date(item.bridge_created_at) : null,
      bridgeUpdatedAt: item.bridge_updated_at ? new Date(item.bridge_updated_at) : null,
    }));

    console.log(`✅ Retrieved ${wallets.length} wallets from database`);
    
    return {
      success: true,
      data: wallets
    };

  } catch (error) {
    console.error('💥 Error getting wallets from database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'DATABASE_ERROR'
    };
  }
};

/**
 * Update wallet in database
 */
const updateWalletInDatabase = async (
  walletId: string, 
  updates: WalletUpdateData
): Promise<WalletServiceResponse<Wallet>> => {
  try {
    console.log('💾 Updating wallet in database:', { walletId, updates });

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const { data, error } = await supabaseAdmin
      .from('wallets')
      .update(updateData)
      .eq('id', walletId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database wallet update error:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
        errorCode: 'DATABASE_ERROR'
      };
    }

    console.log('✅ Wallet updated in database successfully');

    const wallet: Wallet = {
      id: data.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      profileId: data.profile_id,
      walletTag: data.wallet_tag,
      isActive: data.is_active,
      bridgeWalletId: data.bridge_wallet_id,
      chain: data.chain,
      address: data.address,
      bridgeTags: data.bridge_tags || [],
      bridgeCreatedAt: data.bridge_created_at ? new Date(data.bridge_created_at) : null,
      bridgeUpdatedAt: data.bridge_updated_at ? new Date(data.bridge_updated_at) : null,
    };

    return {
      success: true,
      data: wallet
    };

  } catch (error) {
    console.error('💥 Error updating wallet in database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'DATABASE_ERROR'
    };
  }
};

// ==================== MAIN WALLET SERVICE ====================

export const walletService = {
  /**
   * Create a new wallet (Bridge + Database)
   */
  createWallet: async (request: WalletServiceCreateRequest): Promise<WalletServiceResponse<Wallet>> => {
    try {
      console.log('💳 Creating new wallet:', { 
        profileId: request.profileId, 
        chain: request.chain, 
        currency: request.currency 
      });

      // Validate request
      const validationError = validateWalletCreateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          errorCode: 'INVALID_WALLET_DATA'
        };
      }

      // Check wallet limit
      const existingWallets = await getWalletsFromDatabase(request.profileId);
      if (existingWallets.success && existingWallets.data) {
        if (existingWallets.data.length >= WALLET_CONSTANTS.MAX_WALLETS_PER_USER) {
          return {
            success: false,
            error: `Maximum ${WALLET_CONSTANTS.MAX_WALLETS_PER_USER} wallets per user exceeded`,
            errorCode: 'MAX_WALLETS_EXCEEDED'
          };
        }
      }

      // Check environment support
      if (!canCreateWallets()) {
        const errorMessages = getErrorMessages();
        return {
          success: false,
          error: errorMessages.sandboxLimitation || errorMessages.notInProduction,
          errorCode: 'ENVIRONMENT_NOT_SUPPORTED'
        };
      }

      // Step 1: Create wallet on Bridge
      const bridgeResult = await createWalletOnBridge(request.customerId, {
        chain: request.chain,
        currency: request.currency,
        tags: request.bridgeTags || WALLET_CONSTANTS.DEFAULT_BRIDGE_TAGS
      });

      if (!bridgeResult.success || !bridgeResult.wallet) {
        return {
          success: false,
          error: bridgeResult.error || 'Failed to create wallet on Bridge',
          errorCode: bridgeResult.errorCode || 'BRIDGE_API_ERROR'
        };
      }

      // Step 2: Save to database
      const walletData = formatBridgeWalletForDatabase(bridgeResult.wallet, request.profileId);
      
      // Override wallet tag if provided
      if (request.walletTag) {
        walletData.walletTag = request.walletTag;
      }

      const dbResult = await saveWalletToDatabase(walletData);
      if (!dbResult.success || !dbResult.data) {
        return {
          success: false,
          error: dbResult.error || 'Failed to save wallet to database',
          errorCode: 'DATABASE_ERROR'
        };
      }

      console.log('✅ Wallet created successfully:', dbResult.data.id);
      return {
        success: true,
        data: dbResult.data
      };

    } catch (error) {
      console.error('💥 Error creating wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  },

  /**
   * Get wallets for a profile (from database)
   */
  getWallets: async (profileId: string): Promise<WalletServiceResponse<Wallet[]>> => {
    return getWalletsFromDatabase(profileId);
  },

  /**
   * Sync wallets from Bridge to database
   */
  syncWallets: async (profileId: string, customerId: string): Promise<WalletSyncResult> => {
    try {
      console.log('🔄 Syncing wallets from Bridge to database:', { profileId, customerId });

      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      // Get wallets from Bridge
      const bridgeResult = await getWalletsFromBridge(customerId);
      
      if (!bridgeResult.success || !bridgeResult.wallets) {
        return {
          success: false,
          syncedCount: 0,
          createdCount: 0,
          updatedCount: 0,
          errors: [bridgeResult.error || 'Failed to get wallets from Bridge']
        };
      }

      // Get existing wallets from database
      const dbResult = await getWalletsFromDatabase(profileId);
      const existingWallets = dbResult.success ? dbResult.data || [] : [];
      
      // Create a map for quick lookup
      const existingWalletMap = new Map(
        existingWallets.map(wallet => [wallet.bridgeWalletId, wallet])
      );

      // Process each Bridge wallet
      for (const bridgeWallet of bridgeResult.wallets) {
        try {
          const existingWallet = existingWalletMap.get(bridgeWallet.id);
          
          if (existingWallet) {
            // Update existing wallet if needed
            const needsUpdate = 
              existingWallet.address !== bridgeWallet.address ||
              JSON.stringify(existingWallet.bridgeTags) !== JSON.stringify(bridgeWallet.tags) ||
              existingWallet.bridgeUpdatedAt?.toISOString() !== bridgeWallet.updated_at;

            if (needsUpdate) {
              const updateResult = await updateWalletInDatabase(existingWallet.id, {
                bridgeTags: bridgeWallet.tags || [],
                bridgeUpdatedAt: bridgeWallet.updated_at ? new Date(bridgeWallet.updated_at) : null,
              });
              
              if (updateResult.success) {
                updatedCount++;
                syncedCount++;
              } else {
                errors.push(`Failed to update wallet ${bridgeWallet.id}: ${updateResult.error}`);
              }
            } else {
              syncedCount++;
            }
          } else {
            // Create new wallet in database
            const walletData = formatBridgeWalletForDatabase(bridgeWallet, profileId);
            const createResult = await saveWalletToDatabase(walletData);
            
            if (createResult.success) {
              createdCount++;
              syncedCount++;
            } else {
              errors.push(`Failed to create wallet ${bridgeWallet.id}: ${createResult.error}`);
            }
          }
        } catch (error) {
          errors.push(`Error processing wallet ${bridgeWallet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`✅ Wallet sync completed: ${syncedCount} synced, ${createdCount} created, ${updatedCount} updated`);

      return {
        success: errors.length === 0,
        syncedCount,
        createdCount,
        updatedCount,
        errors
      };

    } catch (error) {
      console.error('💥 Error in syncWallets:', error);
      return {
        success: false,
        syncedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  },

  /**
   * Get wallet environment configuration
   */
  getEnvironmentConfig: getWalletEnvironmentConfig,

  /**
   * Check if wallet creation is supported in current environment
   */
  canCreateWallets: (): boolean => {
    const config = getWalletEnvironmentConfig();
    return config.enableWalletCreation && !!config.bridgeApiKey;
  },

  /**
   * Utility functions
   */
  utils: {
    determineWalletTag,
    formatBridgeWalletForDatabase,
    validateWalletCreateRequest,
    isValidWalletChain,
    isValidWalletTag,
  }
}; 