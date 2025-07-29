import { walletBalanceService } from '@/app/services/walletBalanceService';
import { useBridgeStore } from '@/app/store/bridgeStore';
import { useQuery } from '@tanstack/react-query';

export function useTransactionsQuery(limit: number = 5) {
  const { bridgeCustomerId } = useBridgeStore();

  return useQuery({
    queryKey: ['transactions', bridgeCustomerId, limit],
    queryFn: async () => {
      if (!bridgeCustomerId) {
        throw new Error('No Bridge customer ID available');
      }
      
      console.log('🔄 Fetching transactions via TanStack Query...');
      const result = await walletBalanceService.getRecentTransactions(bridgeCustomerId, limit);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
      
      console.log('✅ Transactions fetched successfully:', result.data?.length);
      return result.data || [];
    },
    enabled: !!bridgeCustomerId,
    refetchInterval: 60000, // 1 minuto
    staleTime: 45000, // 45 segundos
  });
} 