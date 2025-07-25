import { createId } from '@paralleldrive/cuid2';
import { BridgeLiquidationAddress } from '../types/BridgeTypes';
import { supabase } from './supabaseClient';

export interface LiquidationAddressRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  bridge_liquidation_id: string;
  profile_id: string;
  customer_id: string;
  chain: string;
  address: string;
  currency: string;
  destination_payment_rail: string;
  destination_currency: string;
  destination_address: string;
  state: string;
  bridge_created_at: string;
  bridge_updated_at: string;
  wallet_id?: string;
}

/**
 * Service for persisting Bridge.xyz liquidation addresses in Supabase
 */
export const liquidationAddressPersistenceService = {
  /**
   * Save a Bridge liquidation address to Supabase
   */
  saveLiquidationAddress: async (
    profileId: string,
    customerId: string,
    bridgeLiquidationAddress: BridgeLiquidationAddress,
    walletId?: string
  ): Promise<{ success: boolean; data?: LiquidationAddressRecord; error?: string }> => {
    try {
      console.log(`💾 Saving liquidation address ${bridgeLiquidationAddress.id} to Supabase`);

      const now = new Date().toISOString();
      const recordId = createId(); // Generate unique ID using cuid2

      const record = {
        id: recordId,
        createdAt: now,
        updatedAt: now,
        bridge_liquidation_id: bridgeLiquidationAddress.id,
        profile_id: profileId,
        customer_id: customerId,
        chain: bridgeLiquidationAddress.chain,
        address: bridgeLiquidationAddress.address,
        currency: bridgeLiquidationAddress.currency,
        destination_payment_rail: bridgeLiquidationAddress.destination_payment_rail,
        destination_currency: bridgeLiquidationAddress.destination_currency,
        destination_address: bridgeLiquidationAddress.destination_address || '',
        state: bridgeLiquidationAddress.state || 'active',
        bridge_created_at: bridgeLiquidationAddress.created_at,
        bridge_updated_at: bridgeLiquidationAddress.updated_at,
        wallet_id: walletId || null,
      };

      console.log('📝 Inserting record with ID:', recordId);

      const { data, error } = await supabase
        .from('liquidation_addresses')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving liquidation address:', error);
        console.error('📝 Record being inserted:', record);
        return {
          success: false,
          error: `Failed to save: ${error.message}`,
        };
      }

      console.log('✅ Liquidation address saved successfully with ID:', recordId);
      return {
        success: true,
        data: data as LiquidationAddressRecord,
      };
    } catch (error) {
      console.error('💥 Exception saving liquidation address:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Get liquidation addresses for a profile
   */
  getLiquidationAddressesForProfile: async (
    profileId: string,
    customerId?: string,
    chain?: string,
    currency?: string
  ): Promise<{ success: boolean; data?: LiquidationAddressRecord[]; error?: string }> => {
    try {
      console.log(`🔍 Getting liquidation addresses for profile ${profileId}`);

      let query = supabase
        .from('liquidation_addresses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('state', 'active')
        .order('createdAt', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (chain) {
        query = query.eq('chain', chain);
      }

      if (currency) {
        query = query.eq('currency', currency);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error getting liquidation addresses:', error);
        return {
          success: false,
          error: `Failed to fetch: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data as LiquidationAddressRecord[],
      };
    } catch (error) {
      console.error('💥 Exception getting liquidation addresses:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Get a specific liquidation address by Bridge liquidation ID
   */
  getLiquidationAddressById: async (
    bridgeLiquidationId: string
  ): Promise<{ success: boolean; data?: LiquidationAddressRecord; error?: string }> => {
    try {
      console.log(`🔍 Getting liquidation address ${bridgeLiquidationId}`);

      const { data, error } = await supabase
        .from('liquidation_addresses')
        .select('*')
        .eq('bridge_liquidation_id', bridgeLiquidationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return {
            success: true,
            data: undefined,
          };
        }
        console.error('❌ Error getting liquidation address:', error);
        return {
          success: false,
          error: `Failed to fetch: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data as LiquidationAddressRecord,
      };
    } catch (error) {
      console.error('💥 Exception getting liquidation address:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Update liquidation address state
   */
  updateLiquidationAddressState: async (
    bridgeLiquidationId: string,
    state: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`🔄 Updating liquidation address ${bridgeLiquidationId} state to ${state}`);

      const { error } = await supabase
        .from('liquidation_addresses')
        .update({
          state,
          updatedAt: new Date().toISOString(),
        })
        .eq('bridge_liquidation_id', bridgeLiquidationId);

      if (error) {
        console.error('❌ Error updating liquidation address state:', error);
        return {
          success: false,
          error: `Failed to update: ${error.message}`,
        };
      }

      console.log('✅ Liquidation address state updated successfully');
      return {
        success: true,
      };
    } catch (error) {
      console.error('💥 Exception updating liquidation address state:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Check if a liquidation address exists for specific parameters
   */
  findExistingLiquidationAddress: async (
    profileId: string,
    customerId: string,
    chain: string,
    currency: string,
    destinationPaymentRail: string,
    destinationCurrency: string
  ): Promise<{ success: boolean; data?: LiquidationAddressRecord; error?: string }> => {
    try {
      console.log(`🔍 Looking for existing liquidation address with parameters: ${chain}/${currency} -> ${destinationPaymentRail}/${destinationCurrency}`);

      const { data, error } = await supabase
        .from('liquidation_addresses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('customer_id', customerId)
        .eq('chain', chain)
        .eq('currency', currency)
        .eq('destination_payment_rail', destinationPaymentRail)
        .eq('destination_currency', destinationCurrency)
        .eq('state', 'active')
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error finding existing liquidation address:', error);
        return {
          success: false,
          error: `Failed to search: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data as LiquidationAddressRecord | undefined,
      };
    } catch (error) {
      console.error('💥 Exception finding existing liquidation address:', error);
      return {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
}; 