import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { LiquidationAddressData, liquidationAddressService } from '../services/liquidationAddressService';

interface LiquidationAddressState {
  // Current address data
  currentAddress: string | null;
  currentLiquidationData: LiquidationAddressData | null;
  
  // State management
  isLoading: boolean;
  error: string | null;
  
  // Cache management
  addressCache: Record<string, {
    data: LiquidationAddressData;
    timestamp: number;
  }>;
  lastFetchedAt: Date | null;
  
  // Cache validity (24 hours for liquidation addresses since they're permanent)
  cacheValidityMs: number;
  
  // Actions
  getOrCreateDepositAddress: (
    profileId: string,
    customerId: string,
    userWalletAddress: string,
    chain?: string,
    currency?: string,
    bridgeWalletId?: string
  ) => Promise<void>;
  
  getAllLiquidationAddresses: (
    profileId: string,
    customerId: string
  ) => Promise<LiquidationAddressData[]>;
  
  refreshAddress: (
    profileId: string,
    customerId: string,
    userWalletAddress: string,
    chain?: string,
    currency?: string,
    bridgeWalletId?: string
  ) => Promise<void>;
  
  clearCache: () => Promise<void>;
  clearAddressCache: (cacheKey: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  
  // Utility methods
  getCacheKey: (customerId: string, chain: string, currency: string) => string;
  getFormattedAddress: (address: string) => string;
  isAddressCacheFresh: (cacheKey: string) => boolean;
  
  // Debug methods
  debugClearAllCache: () => Promise<void>;
  debugGetCacheInfo: () => {
    cacheKeys: string[];
    cacheSize: number;
    oldestEntry?: { key: string; age: number };
    newestEntry?: { key: string; age: number };
  };
}

export const useLiquidationAddressStore = create<LiquidationAddressState>((set, get) => ({
  // Initial state
  currentAddress: null,
  currentLiquidationData: null,
  isLoading: false,
  error: null,
  addressCache: {},
  lastFetchedAt: null,
  
  // Cache validity: 24 hours (liquidation addresses are permanent)
  cacheValidityMs: 24 * 60 * 60 * 1000,
  
  // Get or create deposit address with caching
  getOrCreateDepositAddress: async (
    profileId: string,
    customerId: string,
    userWalletAddress: string,
    chain: string = 'solana',
    currency: string = 'usdc',
    bridgeWalletId?: string
  ) => {
    const state = get();
    const cacheKey = state.getCacheKey(customerId, chain, currency);
    
    set({ isLoading: true, error: null });
    
    // Check cache first, but ALWAYS verify with Supabase for data consistency
    if (state.isAddressCacheFresh(cacheKey)) {
      console.log('💰 Found cached liquidation address, verifying with Supabase...');
      const cachedData = state.addressCache[cacheKey].data;
      
      // Verify the cached address exists in Supabase
      try {
        const { liquidationAddressPersistenceService } = await import('../services/liquidationAddressPersistenceService');
        const existingResult = await liquidationAddressPersistenceService.getLiquidationAddressById(
          cachedData.bridgeLiquidationId
        );
        
        if (existingResult.success && existingResult.data) {
          console.log('✅ Cached liquidation address verified in Supabase');
          set({
            currentAddress: cachedData.liquidationAddress,
            currentLiquidationData: cachedData,
            isLoading: false,
            error: null,
          });
          return;
        } else {
          console.log('⚠️ Cached address not found in Supabase, proceeding with full flow...');
          // Clear this cache entry since it's not in Supabase
          await state.clearAddressCache(cacheKey);
        }
      } catch (error) {
        console.warn('⚠️ Failed to verify cached address in Supabase:', error);
        // Continue with full flow if verification fails
      }
    }
    
    try {
      console.log(`🏦 Getting/creating liquidation address for ${chain}/${currency}`);
      
      const result = await liquidationAddressService.getOrCreateDepositAddress(
        profileId,
        customerId,
        userWalletAddress,
        chain,
        currency,
        bridgeWalletId
      );
      
      if (result.success && result.data) {
        // Update cache
        const updatedCache = {
          ...state.addressCache,
          [cacheKey]: {
            data: result.data,
            timestamp: Date.now(),
          },
        };
        
        // Persist cache to AsyncStorage
        try {
          await AsyncStorage.setItem('liquidationAddressCache', JSON.stringify(updatedCache));
        } catch (error) {
          console.warn('⚠️ Failed to persist liquidation address cache:', error);
        }
        
        set({
          currentAddress: result.data.liquidationAddress,
          currentLiquidationData: result.data,
          addressCache: updatedCache,
          lastFetchedAt: new Date(),
          isLoading: false,
          error: null,
        });
        
        if (result.isNewAddress) {
          console.log('🆕 New liquidation address created and saved:', result.data.liquidationAddress);
        } else {
          console.log('✅ Existing liquidation address retrieved from Supabase:', result.data.liquidationAddress);
        }
      } else {
        set({
          error: result.error || 'Failed to get liquidation address',
          isLoading: false,
        });
        console.error('❌ Failed to get liquidation address:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        error: `Liquidation address error: ${errorMessage}`,
        isLoading: false,
      });
      console.error('💥 Exception in getOrCreateDepositAddress:', error);
    }
  },
  
  // Get all liquidation addresses for a customer
  getAllLiquidationAddresses: async (
    profileId: string,
    customerId: string
  ): Promise<LiquidationAddressData[]> => {
    try {
      console.log(`📋 Getting all liquidation addresses for customer ${customerId}`);
      
      const result = await liquidationAddressService.getAllLiquidationAddresses(
        profileId,
        customerId
      );
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('❌ Failed to get all liquidation addresses:', result.error);
        return [];
      }
    } catch (error) {
      console.error('💥 Exception getting all liquidation addresses:', error);
      return [];
    }
  },
  
  // Force refresh address (bypass cache)
  refreshAddress: async (
    profileId: string,
    customerId: string,
    userWalletAddress: string,
    chain: string = 'solana',
    currency: string = 'usdc',
    walletId?: string
  ) => {
    const state = get();
    const cacheKey = state.getCacheKey(customerId, chain, currency);
    
    // Clear cache for this specific address
    await state.clearAddressCache(cacheKey);
    
    // Fetch fresh data
    await state.getOrCreateDepositAddress(
      profileId,
      customerId,
      userWalletAddress,
      chain,
      currency,
      walletId
    );
  },
  
  // Clear all cache
  clearCache: async () => {
    try {
      await AsyncStorage.removeItem('liquidationAddressCache');
      set({
        addressCache: {},
        currentAddress: null,
        currentLiquidationData: null,
        lastFetchedAt: null,
        error: null,
      });
      console.log('🧹 Liquidation address cache cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear liquidation address cache:', error);
    }
  },
  
  // Clear specific address cache
  clearAddressCache: async (cacheKey: string) => {
    const state = get();
    const updatedCache = { ...state.addressCache };
    delete updatedCache[cacheKey];
    
    try {
      await AsyncStorage.setItem('liquidationAddressCache', JSON.stringify(updatedCache));
      set({ addressCache: updatedCache });
      console.log(`🧹 Cleared cache for key: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ Failed to clear specific cache:', error);
    }
  },
  
  // Clear error state
  clearError: () => {
    set({ error: null });
  },
  
  // Reset all state
  reset: () => {
    set({
      currentAddress: null,
      currentLiquidationData: null,
      isLoading: false,
      error: null,
      lastFetchedAt: null,
    });
  },
  
  // Utility: Generate cache key
  getCacheKey: (customerId: string, chain: string, currency: string): string => {
    return `${customerId}_${chain}_${currency}`;
  },
  
  // Utility: Format address for display
  getFormattedAddress: (address: string): string => {
    return liquidationAddressService.formatAddressForDisplay(address);
  },
  
  // Utility: Check if address cache is fresh
  isAddressCacheFresh: (cacheKey: string): boolean => {
    const state = get();
    const cachedItem = state.addressCache[cacheKey];
    
    if (!cachedItem) {
      return false;
    }
    
    const age = Date.now() - cachedItem.timestamp;
    return age < state.cacheValidityMs;
  },

  // DEBUG: Clear all cache and force fresh data
  debugClearAllCache: async (): Promise<void> => {
    try {
      console.log('🧹 DEBUG: Clearing all liquidation address cache');
      await AsyncStorage.removeItem('liquidationAddressCache');
      set({
        addressCache: {},
        currentAddress: null,
        currentLiquidationData: null,
        lastFetchedAt: null,
        error: null,
      });
      console.log('✅ DEBUG: All cache cleared successfully');
    } catch (error) {
      console.error('❌ DEBUG: Failed to clear cache:', error);
    }
  },

  // DEBUG: Get cache information
  debugGetCacheInfo: (): {
    cacheKeys: string[];
    cacheSize: number;
    oldestEntry?: { key: string; age: number };
    newestEntry?: { key: string; age: number };
  } => {
    const state = get();
    const cache = state.addressCache;
    const keys = Object.keys(cache);
    
    if (keys.length === 0) {
      return { cacheKeys: [], cacheSize: 0 };
    }

    const now = Date.now();
    let oldest: { key: string; age: number } | undefined;
    let newest: { key: string; age: number } | undefined;

    keys.forEach(key => {
      const age = now - cache[key].timestamp;
      if (!oldest || age > oldest.age) {
        oldest = { key, age };
      }
      if (!newest || age < newest.age) {
        newest = { key, age };
      }
    });

    console.log('🔍 DEBUG: Cache info:', {
      keys,
      size: keys.length,
      oldest: oldest ? `${oldest.key} (${Math.round(oldest.age / 1000 / 60)} min ago)` : 'none',
      newest: newest ? `${newest.key} (${Math.round(newest.age / 1000 / 60)} min ago)` : 'none'
    });

    return {
      cacheKeys: keys,
      cacheSize: keys.length,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  },
}));

// Initialize cache from AsyncStorage on app start
const initializeCache = async () => {
  try {
    // EMERGENCY: Check if cache should be cleared
    const shouldClearCache = await AsyncStorage.getItem('CLEAR_LIQUIDATION_CACHE');
    if (shouldClearCache === 'true') {
      console.log('🚨 EMERGENCY: Clearing liquidation cache on startup');
      await AsyncStorage.removeItem('liquidationAddressCache');
      await AsyncStorage.removeItem('CLEAR_LIQUIDATION_CACHE');
      console.log('✅ EMERGENCY: Cache cleared successfully');
      return;
    }

    const cachedData = await AsyncStorage.getItem('liquidationAddressCache');
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      useLiquidationAddressStore.setState({ addressCache: parsedCache });
      console.log('📥 Liquidation address cache loaded from storage');
    }
  } catch (error) {
    console.warn('⚠️ Failed to load liquidation address cache:', error);
  }
};

// Initialize cache on import
initializeCache(); 