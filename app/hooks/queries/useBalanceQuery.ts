import { walletBalanceService } from '@/app/services/walletBalanceService';
import { useBridgeStore } from '@/app/store/bridgeStore';
import { useQuery } from '@tanstack/react-query';

export function useBalanceQuery() {
  const { bridgeCustomerId } = useBridgeStore();

  return useQuery({
    queryKey: ['balance', bridgeCustomerId],
    queryFn: async () => {
      if (!bridgeCustomerId) {
        throw new Error('No Bridge customer ID available');
      }
      
      console.log('🔄 Fetching balance via TanStack Query...');
      const result = await walletBalanceService.calculateTotalBalance(bridgeCustomerId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch balance');
      }
      
      console.log('✅ Balance fetched successfully:', result.data);
      return result.data;
    },
    enabled: !!bridgeCustomerId,
    refetchInterval: 60000, // 1 minuto
    staleTime: 30000, // 30 segundos - balance se actualiza frecuente
  });
} 