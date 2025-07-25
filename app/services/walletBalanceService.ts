import { BridgeWalletWithBalance } from '../types/BridgeTypes';
import { bridgeService } from './bridgeService';

export interface WalletBalanceData {
  totalUSDCBalance: number;
  formattedBalance: string;
  lastUpdated: Date;
  walletCount: number;
}

export interface TransactionDisplay {
  id: string;
  counterparty: string;
  amount: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  currency: string;
  flagIcon: string;
  positive: boolean;
}

/**
 * Service for managing wallet balance calculations and transaction formatting
 */
export const walletBalanceService = {
  /**
   * Calculate total USDC balance from all user's Bridge wallets
   */
  calculateTotalBalance: async (customerId: string): Promise<{
    success: boolean;
    data?: WalletBalanceData;
    error?: string;
  }> => {
    try {
      console.log('💰 Calculating total wallet balance for customer:', customerId);

      // Get all customer wallets
      const walletsResponse = await bridgeService.getCustomerWallets(customerId);
      
      if (!walletsResponse.success || !walletsResponse.data) {
        return {
          success: false,
          error: walletsResponse.error || 'Failed to fetch customer wallets',
        };
      }

      const wallets = walletsResponse.data;
      console.log(`💳 Found ${wallets.length} wallets for balance calculation`);

      // Get detailed balance for each wallet
      let totalUSDCBalance = 0;
      let successfulWallets = 0;

      for (const wallet of wallets) {
        try {
          const walletDetailsResponse = await bridgeService.getWalletDetails(customerId, wallet.id);
          
          if (walletDetailsResponse.success && walletDetailsResponse.data) {
            const walletDetails = walletDetailsResponse.data as BridgeWalletWithBalance;
            
            // Handle different balance formats from Bridge API
            if (walletDetails.balances && Array.isArray(walletDetails.balances)) {
              // Multi-currency wallet - find USDC balance
              const usdcBalance = walletDetails.balances.find(b => 
                b.currency.toLowerCase() === 'usdc'
              );
              if (usdcBalance) {
                totalUSDCBalance += parseFloat(usdcBalance.balance || '0');
                successfulWallets++;
              }
            } else if (walletDetails.balance) {
              // Single balance wallet - assume USDC if currency matches
              if (wallet.currency?.toLowerCase() === 'usdc' || !wallet.currency) {
                totalUSDCBalance += parseFloat(walletDetails.balance);
                successfulWallets++;
              }
            }
          } else {
            console.warn(`⚠️ Failed to get details for wallet ${wallet.id}:`, walletDetailsResponse.error);
          }
        } catch (error) {
          console.warn(`⚠️ Error processing wallet ${wallet.id}:`, error);
          // Continue with other wallets
        }
      }

      const formattedBalance = formatCurrency(totalUSDCBalance);
      
      console.log(`✅ Total USDC balance calculated: ${formattedBalance} from ${successfulWallets}/${wallets.length} wallets`);

      return {
        success: true,
        data: {
          totalUSDCBalance,
          formattedBalance,
          lastUpdated: new Date(),
          walletCount: wallets.length,
        },
      };
    } catch (error) {
      console.error('💥 Error calculating total balance:', error);
      return {
        success: false,
        error: `Balance calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Get recent transactions formatted for UI display
   * Now using the correct Bridge.xyz endpoint: /wallets/{walletId}/history
   */
  getRecentTransactions: async (customerId: string, limit: number = 5): Promise<{
    success: boolean;
    data?: TransactionDisplay[];
    error?: string;
  }> => {
    try {
      console.log('📊 Fetching recent transactions for customer:', customerId);

      const transactionsResponse = await bridgeService.getCustomerTransactions(customerId, { limit });
      
      if (!transactionsResponse.success) {
        return {
          success: false,
          error: transactionsResponse.error || 'Failed to fetch transactions',
        };
      }

      const transactions = transactionsResponse.data || [];
      console.log(`📋 Processing ${transactions.length} transactions for display`);

      // If no transactions, return informative empty state
      if (transactions.length === 0) {
        return {
          success: true,
          data: [
            {
              id: 'empty_1',
              counterparty: 'Sin transacciones aún',
              amount: '--',
              direction: 'incoming',
              timestamp: new Date().toISOString(),
              currency: 'USDC',
              flagIcon: '💰',
              positive: true,
            },
          ],
        };
      }

      const formattedTransactions: TransactionDisplay[] = transactions.map((tx: any) => {
        const amount = parseFloat(tx.amount || '0');
        const isOutgoing = tx.type === 'send' || tx.type === 'withdrawal' || amount < 0;
        const direction: 'incoming' | 'outgoing' = isOutgoing ? 'outgoing' : 'incoming';
        
        // Determine counterparty from transaction data
        let counterparty = 'Unknown';
        if (tx.to?.name) {
          counterparty = tx.to.name;
        } else if (tx.from?.name) {
          counterparty = tx.from.name;
        } else if (tx.to?.address) {
          // Truncate address for display
          counterparty = `${tx.to.address.substring(0, 6)}...${tx.to.address.substring(tx.to.address.length - 4)}`;
        } else if (tx.from?.address) {
          counterparty = `${tx.from.address.substring(0, 6)}...${tx.from.address.substring(tx.from.address.length - 4)}`;
        } else if (tx.description) {
          counterparty = tx.description;
        }

        // Format amount with direction indicator
        const formattedAmount = `${direction === 'incoming' ? '+' : '-'}${Math.abs(amount).toFixed(2)} ${(tx.currency || 'USDC').toUpperCase()}`;

        // Get flag icon based on transaction data or default
        const flagIcon = getFlagForTransaction(tx);

        return {
          id: tx.id || `tx_${Date.now()}_${Math.random()}`,
          counterparty,
          amount: formattedAmount,
          direction,
          timestamp: tx.created_at || tx.confirmed_at || new Date().toISOString(),
          currency: tx.currency || 'USDC',
          flagIcon,
          positive: direction === 'incoming',
        };
      });

      console.log(`✅ Formatted ${formattedTransactions.length} transactions for display`);

      return {
        success: true,
        data: formattedTransactions,
      };
    } catch (error) {
      console.error('💥 Error fetching recent transactions:', error);
      return {
        success: false,
        error: `Transaction fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Get empty state data when no transactions exist
   */
  getEmptyTransactionState: (): TransactionDisplay[] => {
    return [
      {
        id: 'empty_1',
        counterparty: 'Sin transacciones aún',
        amount: '--',
        direction: 'incoming',
        timestamp: new Date().toISOString(),
        currency: 'USDC',
        flagIcon: '💰',
        positive: true,
      },
    ];
  },
};

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' USDC';
}

/**
 * Get flag icon for transaction based on available data
 */
function getFlagForTransaction(transaction: any): string {
  // Try to determine country/region from transaction data
  if (transaction.metadata?.country) {
    const countryFlags: Record<string, string> = {
      'US': '🇺🇸',
      'MX': '🇲🇽',
      'BR': '🇧🇷',
      'EU': '🇪🇺',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
    };
    return countryFlags[transaction.metadata.country] || '🌍';
  }

  // Default flags based on transaction type or random for variety
  const defaultFlags = ['🇺🇸', '🇪🇺', '🇲🇽', '🇧🇷', '🇨🇦'];
  return defaultFlags[Math.floor(Math.random() * defaultFlags.length)];
} 