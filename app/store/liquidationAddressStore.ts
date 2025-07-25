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
    currency?: string
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
    currency?: string
  ) => Promise<void>;
  
  clearCache: () => Promise<void>;
  clearAddressCache: (cacheKey: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  
  // Utility methods
  getCacheKey: (customerId: string, chain: string, currency: string) => string;
  getFormattedAddress: (address: string) => string;
  isAddressCacheFresh: (cacheKey: string) => boolean;
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
    currency: string = 'usdc'
  ) => {
    const state = get();
    const cacheKey = state.getCacheKey(customerId, chain, currency);
    
    // Check cache first
    if (state.isAddressCacheFresh(cacheKey)) {
      console.log('💰 Using cached liquidation address');
      const cachedData = state.addressCache[cacheKey].data;
      set({
        currentAddress: cachedData.liquidationAddress,
        currentLiquidationData: cachedData,
        error: null,
      });
      return;
    }
    
    set({ isLoading: true, error: null, currentAddress: null, currentLiquidationData: null });
    
    try {
      console.log(`🏦 Getting/creating liquidation address for ${chain}/${currency}`);
      
      const result = await liquidationAddressService.getOrCreateDepositAddress(
        profileId,
        customerId,
        userWalletAddress,
        chain,
        currency
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
          console.log('🆕 New liquidation address created:', result.data.liquidationAddress);
        } else {
          console.log('✅ Existing liquidation address retrieved:', result.data.liquidationAddress);
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
    currency: string = 'usdc'
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
      currency
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
}));

// Initialize cache from AsyncStorage on app start
const initializeCache = async () => {
  try {
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