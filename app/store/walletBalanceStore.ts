import { create } from 'zustand';
import { TransactionDisplay, WalletBalanceData, walletBalanceService } from '../services/walletBalanceService';

interface WalletBalanceState {
  // Balance data
  balanceData: WalletBalanceData | null;
  isLoadingBalance: boolean;
  balanceError: string | null;
  balanceLastFetched: Date | null;
  
  // Transaction data
  transactions: TransactionDisplay[];
  isLoadingTransactions: boolean;
  transactionError: string | null;
  transactionsLastFetched: Date | null;
  
  // Cache settings
  balanceCacheValidityMs: number; // How long balance data is considered fresh
  transactionCacheValidityMs: number; // How long transaction data is considered fresh
  
  // Actions
  loadBalance: (customerId: string, forceRefresh?: boolean) => Promise<void>;
  loadTransactions: (customerId: string, limit?: number, forceRefresh?: boolean) => Promise<void>;
  refreshAll: (customerId: string) => Promise<void>;
  clearBalanceError: () => void;
  clearTransactionError: () => void;
  clearAllData: () => void;
  
  // Utility methods
  isBalanceDataFresh: () => boolean;
  areTransactionsFresh: () => boolean;
}

export const useWalletBalanceStore = create<WalletBalanceState>((set, get) => ({
  // Initial state
  balanceData: null,
  isLoadingBalance: false,
  balanceError: null,
  balanceLastFetched: null,
  
  transactions: [],
  isLoadingTransactions: false,
  transactionError: null,
  transactionsLastFetched: null,
  
  // Cache validity: 30 seconds for balance, 2 minutes for transactions
  balanceCacheValidityMs: 30 * 1000,
  transactionCacheValidityMs: 2 * 60 * 1000,
  
  // Load balance with caching
  loadBalance: async (customerId: string, forceRefresh = false) => {
    const state = get();
    
    // Check if we have fresh data and don't need to refresh
    if (!forceRefresh && state.balanceData && state.isBalanceDataFresh()) {
      console.log('💰 Using cached balance data');
      return;
    }
    
    set({ isLoadingBalance: true, balanceError: null });
    
    try {
      console.log('💰 Loading fresh balance data for customer:', customerId);
      const result = await walletBalanceService.calculateTotalBalance(customerId);
      
      if (result.success && result.data) {
        set({
          balanceData: result.data,
          balanceLastFetched: new Date(),
          isLoadingBalance: false,
          balanceError: null,
        });
        console.log('✅ Balance data loaded successfully');
      } else {
        set({
          balanceError: result.error || 'Failed to load balance',
          isLoadingBalance: false,
        });
        console.error('❌ Failed to load balance:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        balanceError: `Balance load failed: ${errorMessage}`,
        isLoadingBalance: false,
      });
      console.error('💥 Exception loading balance:', error);
    }
  },
  
  // Load transactions with caching
  loadTransactions: async (customerId: string, limit = 5, forceRefresh = false) => {
    const state = get();
    
    // Check if we have fresh data and don't need to refresh
    if (!forceRefresh && state.transactions.length > 0 && state.areTransactionsFresh()) {
      console.log('📊 Using cached transaction data');
      return;
    }
    
    set({ isLoadingTransactions: true, transactionError: null });
    
    try {
      console.log('📊 Loading fresh transaction data for customer:', customerId);
      const result = await walletBalanceService.getRecentTransactions(customerId, limit);
      
      if (result.success && result.data) {
        const transactionData = result.data.length > 0 
          ? result.data 
          : walletBalanceService.getEmptyTransactionState();
          
        set({
          transactions: transactionData,
          transactionsLastFetched: new Date(),
          isLoadingTransactions: false,
          transactionError: null,
        });
        console.log('✅ Transaction data loaded successfully');
      } else {
        set({
          transactionError: result.error || 'Failed to load transactions',
          isLoadingTransactions: false,
        });
        
        // Set empty state if no existing data
        if (state.transactions.length === 0) {
          set({ transactions: walletBalanceService.getEmptyTransactionState() });
        }
        
        console.error('❌ Failed to load transactions:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        transactionError: `Transaction load failed: ${errorMessage}`,
        isLoadingTransactions: false,
      });
      
      // Set empty state if no existing data
      if (state.transactions.length === 0) {
        set({ transactions: walletBalanceService.getEmptyTransactionState() });
      }
      
      console.error('💥 Exception loading transactions:', error);
    }
  },
  
  // Refresh all data
  refreshAll: async (customerId: string) => {
    console.log('🔄 Refreshing all wallet data for customer:', customerId);
    
    // Load both balance and transactions in parallel, forcing refresh
    await Promise.all([
      get().loadBalance(customerId, true),
      get().loadTransactions(customerId, 5, true),
    ]);
    
    console.log('✅ All wallet data refreshed');
  },
  
  // Clear errors
  clearBalanceError: () => set({ balanceError: null }),
  clearTransactionError: () => set({ transactionError: null }),
  
  // Clear all data (useful for logout)
  clearAllData: () => set({
    balanceData: null,
    balanceError: null,
    balanceLastFetched: null,
    transactions: [],
    transactionError: null,
    transactionsLastFetched: null,
  }),
  
  // Utility methods
  isBalanceDataFresh: () => {
    const state = get();
    if (!state.balanceLastFetched) return false;
    
    const now = new Date().getTime();
    const lastFetched = state.balanceLastFetched.getTime();
    const age = now - lastFetched;
    
    return age < state.balanceCacheValidityMs;
  },
  
  areTransactionsFresh: () => {
    const state = get();
    if (!state.transactionsLastFetched) return false;
    
    const now = new Date().getTime();
    const lastFetched = state.transactionsLastFetched.getTime();
    const age = now - lastFetched;
    
    return age < state.transactionCacheValidityMs;
  },
})); 