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
  // New fields for enhanced display
  formattedDate: string;
  formattedTime: string;
  timeAgo: string;
  sourceChain?: string;
  destinationChain?: string;
  isCrossChain: boolean;
  status: string;
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
      console.log('💰 Transactions:', transactions);
      console.log(`📋 Processing ${transactions.length} transactions for display`);

      // If no transactions, return informative empty state
      if (transactions.length === 0) {
        const now = new Date();
        return {
          success: true,
          data: [
            {
              id: 'empty_1',
              counterparty: 'No hay transacciones recientes',
              amount: '--',
              direction: 'incoming',
              timestamp: now.toISOString(),
              currency: 'USDC',
              flagIcon: '💰',
              positive: true,
              formattedDate: formatDate(now),
              formattedTime: formatTime(now),
              timeAgo: 'ahora',
              isCrossChain: false,
              status: '--',
            },
          ],
        };
      }

      const formattedTransactions: TransactionDisplay[] = transactions.map((tx: any) => {
        const amount = parseFloat(tx.amount || '0');
        
        // Determine transaction direction based on Bridge data structure
        // For Bridge transactions, we need to determine if it's incoming or outgoing
        // Since we're looking at the user's wallet transactions, positive amounts are typically incoming
        const isOutgoing = amount < 0; // Negative amounts indicate outgoing
        const direction: 'incoming' | 'outgoing' = isOutgoing ? 'outgoing' : 'incoming';
        
        // Determine counterparty from transaction data - improved for Bridge structure
        let counterparty = 'Transferencia';
        
        // Try to get meaningful counterparty information
        if (tx.source?.payment_rail && tx.destination?.payment_rail) {
          const sourceChain = tx.source.payment_rail.charAt(0).toUpperCase() + tx.source.payment_rail.slice(1);
          const destChain = tx.destination.payment_rail.charAt(0).toUpperCase() + tx.destination.payment_rail.slice(1);
          
          if (sourceChain !== destChain) {
            // Cross-chain transfer
            counterparty = `Bridge ${sourceChain} → ${destChain}`;
          } else {
            // Same chain transfer
            counterparty = `Transferencia ${sourceChain}`;
          }
        } else if (tx.walletChain) {
          const chainName = tx.walletChain.charAt(0).toUpperCase() + tx.walletChain.slice(1);
          counterparty = `Transferencia ${chainName}`;
        }
        
        // Add more context if it's a bridge transaction
        if (tx.source?.payment_rail && tx.destination?.payment_rail && 
            tx.source.payment_rail !== tx.destination.payment_rail) {
          counterparty = 'Transferencia Bridge';
        }

        // Format amount with direction indicator
        const formattedAmount = `${direction === 'incoming' ? '+' : '-'}${Math.abs(amount).toFixed(2)} ${(tx.destination?.currency || 'USDC').toUpperCase()}`;

        // Get flag icon based on transaction data - improved for Bridge structure
        const flagIcon = getFlagForTransaction(tx);

        // Process timestamps
        const timestamp = tx.created_at || tx.updated_at || new Date().toISOString();
        const transactionDate = new Date(timestamp);
        const formattedDate = formatDate(transactionDate);
        const formattedTime = formatTime(transactionDate);
        const timeAgo = getTimeAgo(transactionDate);

        // Determine if it's a cross-chain transaction
        const isCrossChain = tx.source?.payment_rail && tx.destination?.payment_rail && 
                            tx.source.payment_rail !== tx.destination.payment_rail;

        // Get transaction status
        const status = getTransactionStatus(tx.created_at || timestamp, tx.updated_at || timestamp);

        return {
          id: tx.walletId || tx.id || `tx_${Date.now()}_${Math.random()}`,
          counterparty,
          amount: formattedAmount,
          direction,
          timestamp,
          currency: tx.destination?.currency || 'USDC',
          flagIcon,
          positive: direction === 'incoming',
          formattedDate,
          formattedTime,
          timeAgo,
          sourceChain: tx.source?.payment_rail,
          destinationChain: tx.destination?.payment_rail,
          isCrossChain,
          status,
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
    const now = new Date();
    return [
      {
        id: 'empty_1',
        counterparty: 'No hay transacciones recientes',
        amount: '--',
        direction: 'incoming',
        timestamp: now.toISOString(),
        currency: 'USDC',
        flagIcon: '💰',
        positive: true,
        formattedDate: formatDate(now),
        formattedTime: formatTime(now),
        timeAgo: 'ahora',
        isCrossChain: false,
        status: '--',
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
 * Format date for display (e.g., "1 Ago", "15 Dic")
 */
function formatDate(date: Date): string {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

/**
 * Format time for display (e.g., "15:48", "09:30")
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Get relative time ago (e.g., "hace 2h", "hace 5m", "hace 1d")
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'ahora';
  } else if (diffInMinutes < 60) {
    return `hace ${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `hace ${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `hace ${diffInDays}d`;
  } else {
    return formatDate(date);
  }
}

/**
 * Get transaction status based on timestamps
 */
function getTransactionStatus(createdAt: string, updatedAt: string): string {
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  const now = new Date();
  
  // If updated time is significantly after created time, it's confirmed
  const timeDiff = updated.getTime() - created.getTime();
  if (timeDiff > 60000) { // More than 1 minute difference
    return 'Confirmada';
  }
  
  // If transaction is recent (within last 5 minutes), it might be pending
  const recentDiff = now.getTime() - created.getTime();
  if (recentDiff < 300000) { // Less than 5 minutes
    return 'Procesando';
  }
  
  return 'Confirmada';
}

/**
 * Get flag icon for transaction based on available data
 */
function getFlagForTransaction(transaction: any): string {
  // Try to determine flag based on payment rails/chains from Bridge data
  if (transaction.source?.payment_rail || transaction.destination?.payment_rail) {
    const sourceRail = transaction.source?.payment_rail?.toLowerCase();
    const destRail = transaction.destination?.payment_rail?.toLowerCase();
    
    // Map payment rails to appropriate flags
    const railFlags: Record<string, string> = {
      'solana': '🔵', // Solana blue
      'polygon': '🟣', // Polygon purple
      'ethereum': '🔷', // Ethereum diamond
      'bitcoin': '🟡', // Bitcoin gold
      'arbitrum': '🔵', // Arbitrum blue
      'optimism': '🔴', // Optimism red
      'base': '🔵', // Base blue
      'avalanche': '🔴', // Avalanche red
      'bsc': '🟡', // BSC yellow
    };
    
    // Use destination rail if available, otherwise source rail
    const rail = destRail || sourceRail;
    if (rail && railFlags[rail]) {
      return railFlags[rail];
    }
  }
  
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
  const defaultFlags = ['🔵', '🟣', '🔷', '🟡', '🔴'];
  return defaultFlags[Math.floor(Math.random() * defaultFlags.length)];
} 