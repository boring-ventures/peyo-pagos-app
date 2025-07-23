import { bridgeStatusService } from '@/app/services/bridgeStatusService';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export const useRejectedUserCheck = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkRejectedUser = async () => {
      if (!user?.id) return;

      try {
        setIsChecking(true);
        const bridgeResult = await bridgeStatusService.canUserAccessHome(user.id);
        
        if (isMounted && bridgeResult.shouldRedirectToRejected) {
          console.log('🚫 User rejected, redirecting to rejected screen');
          router.replace('/(auth)/kyc-rejected');
        }
      } catch (error) {
        console.error('❌ Error checking rejected user status:', error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    // Delay para evitar conflictos con la navegación
    const timeoutId = setTimeout(checkRejectedUser, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user?.id, router]);

  return { isChecking };
}; 