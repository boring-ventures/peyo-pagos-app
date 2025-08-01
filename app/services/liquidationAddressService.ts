import { BridgeLiquidationAddress, CreateLiquidationAddressParams } from '../types/BridgeTypes';
import { bridgeService } from './bridgeService';
import { liquidationAddressPersistenceService, LiquidationAddressRecord } from './liquidationAddressPersistenceService';

export interface LiquidationAddressData {
  liquidationAddress: string;
  bridgeLiquidationId: string;
  chain: string;
  currency: string;
  destinationPaymentRail: string;
  destinationCurrency: string;
  destinationAddress: string;
  state: string;
  bridgeData: BridgeLiquidationAddress;
  supabaseRecord?: LiquidationAddressRecord;
}

/**
 * Service for managing Bridge.xyz liquidation addresses with Supabase persistence
 */
export const liquidationAddressService = {
  /**
   * Get or create a deposit address for crypto deposits
   * This function implements the complete flow:
   * 1. Check Supabase for existing address
   * 2. Check Bridge for existing address (and save to Supabase if found)
   * 3. Create new address in Bridge and save to Supabase
   */
  getOrCreateDepositAddress: async (
    profileId: string,
    customerId: string,
    userWalletAddress: string,
    chain: string,
    currency: string,
    walletId?: string
  ): Promise<{
    success: boolean;
    data?: LiquidationAddressData;
    error?: string;
    isNewAddress?: boolean;
  }> => {
    try {
      console.log(`🔄 Getting or creating liquidation address for ${chain}/${currency}`);
      console.log(`📝 Parameters: profileId=${profileId}, customerId=${customerId}, wallet=${userWalletAddress}, walletId=${walletId}`);

      // Always liquidate to Solana USDC
      const destinationPaymentRail = 'solana';
      const destinationCurrency = 'usdc';

      console.log(`🎯 Liquidation destination: ${destinationPaymentRail}/${destinationCurrency}`);

      // Step 1: Check Supabase for existing liquidation address
      console.log('🔍 Step 1: Checking Supabase for existing liquidation address');
      const existingResult = await liquidationAddressPersistenceService.findExistingLiquidationAddress(
        profileId,
        customerId,
        chain,
        currency,
        destinationPaymentRail,
        destinationCurrency
      );

      console.log('📊 Supabase check result:', existingResult);

      if (!existingResult.success) {
        console.error('❌ Failed to check existing addresses in Supabase:', existingResult.error);
        return {
          success: false,
          error: `Failed to check existing addresses: ${existingResult.error}`,
        };
      }

      if (existingResult.data) {
        console.log('✅ Found existing liquidation address in Supabase:', existingResult.data.bridge_liquidation_id);
        
        // Verify it still exists in Bridge
        const bridgeResult = await bridgeService.getLiquidationAddress(
          customerId,
          existingResult.data.bridge_liquidation_id
        );

        if (bridgeResult.success && bridgeResult.data) {
          console.log('✅ Confirmed address exists in Bridge');
          return {
            success: true,
            data: {
              liquidationAddress: existingResult.data.address,
              bridgeLiquidationId: existingResult.data.bridge_liquidation_id,
              chain: existingResult.data.chain,
              currency: existingResult.data.currency,
              destinationPaymentRail: existingResult.data.destination_payment_rail,
              destinationCurrency: existingResult.data.destination_currency,
              destinationAddress: existingResult.data.destination_address,
              state: existingResult.data.state,
              bridgeData: bridgeResult.data,
              supabaseRecord: existingResult.data,
            },
            isNewAddress: false,
          };
        } else {
          console.warn('⚠️ Liquidation address exists in Supabase but not in Bridge, marking as inactive');
          await liquidationAddressPersistenceService.updateLiquidationAddressState(
            existingResult.data.bridge_liquidation_id,
            'inactive'
          );
        }
      } else {
        console.log('ℹ️ No existing liquidation address found in Supabase');
      }

      // Step 2: Check Bridge directly for existing addresses
      console.log('🔍 Step 2: Checking Bridge for existing liquidation addresses');
      const bridgeLiquidationsResult = await bridgeService.getLiquidationAddresses(customerId);
      
      console.log('📊 Bridge liquidations result:', {
        success: bridgeLiquidationsResult.success,
        dataLength: bridgeLiquidationsResult.data?.length || 0,
        error: bridgeLiquidationsResult.error
      });

      if (bridgeLiquidationsResult.success && bridgeLiquidationsResult.data) {
        // Look for matching address with our criteria
        const matchingAddress = bridgeLiquidationsResult.data.find((addr: BridgeLiquidationAddress) => 
          addr.chain === chain &&
          addr.currency === currency &&
          addr.destination_payment_rail === destinationPaymentRail &&
          addr.destination_currency === destinationCurrency &&
          addr.state === 'active'
        );

        console.log('📊 Matching address search result:', {
          found: !!matchingAddress,
          matchingAddressId: matchingAddress?.id,
          searchCriteria: { chain, currency, destinationPaymentRail, destinationCurrency }
        });

        if (matchingAddress) {
          console.log('✅ Found existing liquidation address in Bridge:', matchingAddress.id);
          
          // Save to Supabase for future reference
          console.log('💾 Saving existing Bridge address to Supabase');
          console.log('💾 About to call saveLiquidationAddress with:', {
            profileId,
            customerId,
            bridgeLiquidationId: matchingAddress.id,
            userWalletAddress,
            walletId
          });
          
          const saveResult = await liquidationAddressPersistenceService.saveLiquidationAddress(
            profileId,
            customerId,
            matchingAddress,
            walletId
          );

          console.log('📊 Save result:', saveResult);

          if (!saveResult.success) {
            console.error('❌ CRITICAL: Failed to save existing liquidation address to Supabase:', saveResult.error);
            // Still return success but mark as warning
            console.warn('⚠️ Continuing without Supabase persistence - this may cause cache issues');
          } else {
            console.log('✅ Successfully saved existing Bridge address to Supabase');
          }

          return {
            success: true,
            data: {
              liquidationAddress: matchingAddress.address,
              bridgeLiquidationId: matchingAddress.id,
              chain: matchingAddress.chain,
              currency: matchingAddress.currency,
              destinationPaymentRail: matchingAddress.destination_payment_rail,
              destinationCurrency: matchingAddress.destination_currency,
              destinationAddress: matchingAddress.destination_address || userWalletAddress,
              state: matchingAddress.state || 'active',
              bridgeData: matchingAddress,
              supabaseRecord: saveResult.data,
            },
            isNewAddress: false,
          };
        } else {
          console.log('ℹ️ No matching liquidation address found in Bridge with our criteria');
        }
      }

      // Step 3: Create new liquidation address
      console.log('🆕 Step 3: Creating new liquidation address in Bridge');

      const createParams: CreateLiquidationAddressParams = {
        chain: chain as 'arbitrum' | 'avalanche_c_chain' | 'base' | 'ethereum' | 'optimism' | 'polygon' | 'solana' | 'stellar' | 'tron',
        currency: currency as 'usdb' | 'usdc' | 'usdt' | 'dai' | 'pyusd' | 'eurc',
        destination_payment_rail: destinationPaymentRail as 'arbitrum' | 'avalanche_c_chain' | 'base' | 'ethereum' | 'optimism' | 'polygon' | 'solana' | 'stellar' | 'tron',
        destination_currency: destinationCurrency as 'usdb' | 'usdc' | 'usdt' | 'dai' | 'pyusd' | 'eurc',
        destination_address: userWalletAddress,
      };

      console.log('📤 Creating with params:', createParams);
      const createResult = await bridgeService.createLiquidationAddress(customerId, createParams);

      console.log('📊 Create result:', {
        success: createResult.success,
        dataId: createResult.data?.id,
        error: createResult.error
      });

      if (!createResult.success || !createResult.data) {
        console.error('❌ Failed to create liquidation address in Bridge:', createResult.error);
        return {
          success: false,
          error: `Failed to create liquidation address: ${createResult.error}`,
        };
      }

      console.log('✅ Created new liquidation address in Bridge:', createResult.data.id);

      // Save to Supabase
      console.log('💾 Saving new Bridge address to Supabase');
      console.log('💾 About to call saveLiquidationAddress with new address:', {
        profileId,
        customerId,
        bridgeLiquidationId: createResult.data.id,
        userWalletAddress,
        walletId
      });
      
      const saveResult = await liquidationAddressPersistenceService.saveLiquidationAddress(
        profileId,
        customerId,
        createResult.data,
        walletId
      );

      console.log('📊 Save new result:', saveResult);

      if (!saveResult.success) {
        console.error('❌ CRITICAL: Failed to save new liquidation address to Supabase:', saveResult.error);
        console.error('❌ This will cause cache inconsistency issues');
        // Still return success but mark as warning
        console.warn('⚠️ Continuing without Supabase persistence - this may cause cache issues');
      } else {
        console.log('✅ Successfully saved new Bridge address to Supabase');
      }

      return {
        success: true,
        data: {
          liquidationAddress: createResult.data.address,
          bridgeLiquidationId: createResult.data.id,
          chain: createResult.data.chain,
          currency: createResult.data.currency,
          destinationPaymentRail: createResult.data.destination_payment_rail,
          destinationCurrency: createResult.data.destination_currency,
          destinationAddress: createResult.data.destination_address || userWalletAddress,
          state: createResult.data.state || 'active',
          bridgeData: createResult.data,
          supabaseRecord: saveResult.data,
        },
        isNewAddress: true,
      };
    } catch (error) {
      console.error('💥 Exception in getOrCreateDepositAddress:', error);
      console.error('💥 Exception details:', error instanceof Error ? error.stack : error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * DEBUG FUNCTION: Test the complete liquidation address flow
   * Use this to verify that the Supabase persistence is working correctly
   */
  debugTestLiquidationAddressFlow: async (
    profileId: string,
    customerId: string,
    userWalletAddress: string
  ): Promise<{
    success: boolean;
    results?: {
      supabaseCheck: any;
      bridgeCheck: any;
      finalResult: any;
    };
    error?: string;
  }> => {
    try {
      console.log('🧪 DEBUG: Testing liquidation address flow');
      console.log(`📝 Test parameters: profileId=${profileId}, customerId=${customerId}, wallet=${userWalletAddress}`);

      // Test parameters
      const chain = 'solana';
      const currency = 'usdc';

      // 1. Check current state in Supabase
      console.log('🔍 DEBUG: Checking current Supabase state');
      const supabaseCheck = await liquidationAddressPersistenceService.getLiquidationAddressesForProfile(
        profileId,
        customerId,
        chain,
        currency
      );

      // 2. Check current state in Bridge
      console.log('🔍 DEBUG: Checking current Bridge state');
      const bridgeCheck = await bridgeService.getLiquidationAddresses(customerId);

      // 3. Test the main flow
      console.log('🧪 DEBUG: Testing main getOrCreateDepositAddress flow');
      const finalResult = await liquidationAddressService.getOrCreateDepositAddress(
        profileId,
        customerId,
        userWalletAddress,
        chain,
        currency
      );

      const results = {
        supabaseCheck,
        bridgeCheck,
        finalResult,
      };

      console.log('🧪 DEBUG: Test completed', results);

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('💥 DEBUG: Exception in test flow:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Get all liquidation addresses for a customer
   */
  getAllLiquidationAddresses: async (
    profileId: string,
    customerId: string
  ): Promise<{
    success: boolean;
    data?: LiquidationAddressData[];
    error?: string;
  }> => {
    try {
      console.log(`📋 Getting all liquidation addresses for customer ${customerId}`);

      // Get from Supabase first
      const supabaseResult = await liquidationAddressPersistenceService.getLiquidationAddressesForProfile(
        profileId,
        customerId
      );

      if (!supabaseResult.success) {
        return {
          success: false,
          error: `Failed to get addresses from Supabase: ${supabaseResult.error}`,
        };
      }

      // Also get from Bridge to ensure we have the latest data
      const bridgeResult = await bridgeService.getLiquidationAddresses(customerId);

      if (!bridgeResult.success) {
        return {
          success: false,
          error: `Failed to get addresses from Bridge: ${bridgeResult.error}`,
        };
      }

      const addresses: LiquidationAddressData[] = [];
      const supabaseAddresses = supabaseResult.data || [];
      const bridgeAddresses = bridgeResult.data || [];

      // Combine and deduplicate
      for (const supabaseAddr of supabaseAddresses) {
        const bridgeAddr = bridgeAddresses.find(ba => ba.id === supabaseAddr.bridge_liquidation_id);
        
        if (bridgeAddr) {
          addresses.push({
            liquidationAddress: supabaseAddr.address,
            bridgeLiquidationId: supabaseAddr.bridge_liquidation_id,
            chain: supabaseAddr.chain,
            currency: supabaseAddr.currency,
            destinationPaymentRail: supabaseAddr.destination_payment_rail,
            destinationCurrency: supabaseAddr.destination_currency,
            destinationAddress: supabaseAddr.destination_address,
            state: supabaseAddr.state,
            bridgeData: bridgeAddr,
            supabaseRecord: supabaseAddr,
          });
        }
      }

      return {
        success: true,
        data: addresses,
      };
    } catch (error) {
      console.error('💥 Exception getting all liquidation addresses:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Get available chains/networks supported by Bridge for liquidation addresses
   */
  getSupportedNetworks: (): Array<{
    id: string;
    name: string;
    displayName: string;
    chain: string;
    supportedCurrencies: string[];
    icon: string;
    iconColor: string;
    backgroundColor: string;
  }> => {
    return [
      {
        id: 'solana',
        name: 'Solana',
        displayName: 'Solana (SPL)',
        chain: 'solana',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '◎',
        iconColor: '#FFFFFF',
        backgroundColor: '#9945FF',
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        displayName: 'Ethereum (ERC-20)',
        chain: 'ethereum',
        supportedCurrencies: ['usdc', 'usdt', 'dai'],
        icon: 'Ξ',
        iconColor: '#FFFFFF',
        backgroundColor: '#627EEA',
      },
      {
        id: 'polygon',
        name: 'Polygon',
        displayName: 'Polygon (POS)',
        chain: 'polygon',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '⬟',
        iconColor: '#FFFFFF',
        backgroundColor: '#8247E5',
      },
      {
        id: 'stellar',
        name: 'Stellar',
        displayName: 'Stellar (XLM)',
        chain: 'stellar',
        supportedCurrencies: ['usdc'],
        icon: '✦',
        iconColor: '#FFFFFF',
        backgroundColor: '#14C6FF',
      },
      {
        id: 'arbitrum',
        name: 'Arbitrum',
        displayName: 'Arbitrum One',
        chain: 'arbitrum',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '⟠',
        iconColor: '#FFFFFF',
        backgroundColor: '#28A0F0',
      },
      {
        id: 'avalanche_c_chain',
        name: 'Avalanche',
        displayName: 'Avalanche C-Chain',
        chain: 'avalanche_c_chain',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '❄',
        iconColor: '#FFFFFF',
        backgroundColor: '#E84142',
      },
      {
        id: 'base',
        name: 'Base',
        displayName: 'Base',
        chain: 'base',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '🔵',
        iconColor: '#FFFFFF',
        backgroundColor: '#0052FF',
      },
      {
        id: 'optimism',
        name: 'Optimism',
        displayName: 'Optimism',
        chain: 'optimism',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '🔴',
        iconColor: '#FFFFFF',
        backgroundColor: '#FF0420',
      },
      {
        id: 'tron',
        name: 'TRON',
        displayName: 'TRON',
        chain: 'tron',
        supportedCurrencies: ['usdc', 'usdt'],
        icon: '⚡',
        iconColor: '#FFFFFF',
        backgroundColor: '#FF0000',
      },
    ];
  },

  /**
   * Get liquidation address details
   */
  getLiquidationAddressDetails: async (
    customerId: string,
    liquidationId: string
  ): Promise<{
    success: boolean;
    data?: BridgeLiquidationAddress;
    error?: string;
  }> => {
    return await bridgeService.getLiquidationAddress(customerId, liquidationId);
  },

  /**
   * Validate address ownership
   */
  validateAddressOwnership: async (
    customerId: string,
    liquidationAddress: string
  ): Promise<{ success: boolean; isValid?: boolean; error?: string }> => {
    try {
      const addressesResult = await bridgeService.getLiquidationAddresses(customerId);
      
      if (!addressesResult.success || !addressesResult.data) {
        return {
          success: false,
          error: addressesResult.error || 'Failed to get addresses',
        };
      }

      const isValid = addressesResult.data.some(
        (addr: BridgeLiquidationAddress) => addr.address === liquidationAddress
      );

      return {
        success: true,
        isValid,
      };
    } catch (error) {
      return {
        success: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Format address for display (truncate middle)
   */
  formatAddressForDisplay: (address: string, prefixLength: number = 6, suffixLength: number = 4): string => {
    if (address.length <= prefixLength + suffixLength + 3) {
      return address;
    }
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
  },

  /**
   * Generate Binance withdrawal instructions
   */
  generateBinanceInstructions: (liquidationAddress: string, chain: string = 'solana'): {
    title: string;
    steps: string[];
    warnings: string[];
    networkInfo: {
      name: string;
      displayName: string;
      tokenStandard: string;
    };
  } => {
    const networkInfo = {
      solana: {
        name: 'Solana',
        displayName: 'Solana (SPL)',
        tokenStandard: 'SPL-Token',
      },
      ethereum: {
        name: 'Ethereum',
        displayName: 'Ethereum (ERC-20)',
        tokenStandard: 'ERC-20',
      },
      polygon: {
        name: 'Polygon',
        displayName: 'Polygon (POS)',
        tokenStandard: 'Polygon POS',
      },
    }[chain] || {
      name: 'Solana',
      displayName: 'Solana (SPL)',
      tokenStandard: 'SPL-Token',
    };

    return {
      title: `Enviar USDC desde Binance via ${networkInfo.displayName}`,
      steps: [
        '1. Abre la app de Binance y ve a "Spot"',
        '2. Busca y selecciona "USDC" en tu cartera',
        '3. Toca "Retirar" o "Withdraw"',
        '4. Selecciona "Crypto" como método de retiro',
        `5. Elige "${networkInfo.displayName}" como red`,
        '6. Pega la dirección de depósito mostrada arriba',
        '7. Ingresa el monto que deseas enviar',
        '8. Revisa todos los detalles y confirma el retiro',
      ],
      warnings: [
        `⚠️ IMPORTANTE: Usa SOLO la red ${networkInfo.displayName}`,
        '⚠️ Verifica que la dirección sea exactamente la mostrada',
        '⚠️ El depósito mínimo es $1.00 USD',
        '⚠️ Los depósitos pueden tomar 1-3 minutos en procesarse',
        '⚠️ Binance puede cobrar comisiones por el retiro',
      ],
      networkInfo,
    };
  },
}; 