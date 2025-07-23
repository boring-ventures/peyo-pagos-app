import { bridgeStatusService } from '@/app/services/bridgeStatusService';
import { useAuthStore } from '@/app/store/authStore';
import { useEffect } from 'react';

/**
 * Hook para auto-refresh de Bridge status
 * Se ejecuta automáticamente cuando el usuario está autenticado
 */
export const useBridgeAutoRefresh = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔄 Auto-refresh de Bridge al montar componente...');
      
      // Ejecutar auto-refresh de forma asíncrona sin bloquear la UI
      bridgeStatusService.autoRefreshOnAppStart(user.id).catch(error => {
        console.warn('⚠️ Auto-refresh falló:', error);
      });
    }
  }, [isAuthenticated, user?.id]);

  return {
    triggerRefresh: async () => {
      if (user?.id) {
        return await bridgeStatusService.autoRefreshOnAppStart(user.id);
      }
      return { success: false, error: 'No user found' };
    }
  };
};

/**
 * Hook para auto-refresh en pantallas específicas
 * Útil para pantallas que necesitan datos actualizados de Bridge
 */
export const useBridgeRefreshOnScreen = (screenName: string) => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Auto-refresh de Bridge en pantalla: ${screenName}`);
      
      // Pequeño delay para evitar conflictos con otros refreshes
      const timer = setTimeout(() => {
        bridgeStatusService.autoRefreshOnAppStart(user.id).catch(error => {
          console.warn(`⚠️ Auto-refresh en ${screenName} falló:`, error);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, screenName]);

  return {
    refreshNow: async () => {
      if (user?.id) {
        return await bridgeStatusService.autoRefreshOnAppStart(user.id);
      }
      return { success: false, error: 'No user found' };
    }
  };
}; 