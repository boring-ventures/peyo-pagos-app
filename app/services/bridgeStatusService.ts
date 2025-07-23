import { bridgeService } from './bridgeService';
import { supabaseAdmin } from './supabaseAdmin';
import { walletService } from './walletService';

export interface BridgeStatusCheck {
  success: boolean;
  bridgeCustomerId?: string | null;
  verificationStatus?: string;
  requirementsDue?: string[];
  hasActiveWallet?: boolean;
  canAccessHome?: boolean;
  walletCount?: number;
  error?: string;
}

// Mapeo de status Bridge API a nuestro enum KYCStatus
function mapBridgeStatusToKYCStatus(bridgeStatus: string): string {
  const statusMapping: Record<string, string> = {
    pending: "under_review",
    active: "active",
    approved: "active",
    rejected: "rejected",
    under_review: "under_review",
    incomplete: "incomplete",
    not_started: "not_started",
    awaiting_questionnaire: "awaiting_questionnaire",
    awaiting_ubo: "awaiting_ubo",
    paused: "paused",
    offboarded: "offboarded",
  };

  // Basado en la respuesta real de Bridge que incluye capabilities
  if (bridgeStatus === "active") {
    return "active";
  }

  return statusMapping[bridgeStatus] || "not_started";
}

export const bridgeStatusService = {
  /**
   * Verificar el estado real de Bridge y actualizar la base de datos
   * Versión mejorada que también sincroniza wallets
   */
  checkAndUpdateBridgeStatus: async (userId: string): Promise<BridgeStatusCheck> => {
    try {
      console.log('🔍 Verificando estado real de Bridge para usuario:', userId);

      // 1. Obtener profile y KYC profile del usuario
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', userId)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile no encontrado:', profileError);
        return {
          success: false,
          error: 'Profile no encontrado'
        };
      }

      const { data: kycProfile, error: kycError } = await supabaseAdmin
        .from('kyc_profiles')
        .select('bridge_customer_id, kyc_status')
        .eq('profile_id', profile.id)
        .single();

      if (kycError || !kycProfile) {
        console.error('❌ KYC profile no encontrado:', kycError);
        return {
          success: false,
          error: 'KYC profile no encontrado'
        };
      }

      // 2. Si no hay bridge_customer_id, el usuario no ha completado Bridge
      if (!kycProfile.bridge_customer_id) {
        console.log('⚠️ Usuario no tiene Bridge customer ID');
        return {
          success: true,
          bridgeCustomerId: null,
          verificationStatus: 'not_started',
          requirementsDue: [],
          hasActiveWallet: false,
          canAccessHome: false,
          walletCount: 0
        };
      }

      // 3. Verificar estado real en Bridge API
      console.log('🌉 Consultando estado real en Bridge API:', kycProfile.bridge_customer_id);
      const bridgeResponse = await bridgeService.getCustomer(kycProfile.bridge_customer_id);

      if (!bridgeResponse.success || !bridgeResponse.data) {
        console.error('❌ Error consultando Bridge API:', bridgeResponse.error);
        return {
          success: false,
          error: `Error consultando Bridge: ${bridgeResponse.error}`
        };
      }

      const bridgeData = bridgeResponse.data;
      console.log('✅ Estado real de Bridge obtenido:', {
        status: bridgeData.status,
        verification_status: bridgeData.verification_status,
        requirements_due: bridgeData.requirements_due,
        capabilities: bridgeData.capabilities
      });

      // 4. Obtener wallets desde Bridge
      console.log('💳 Obteniendo wallets desde Bridge...');
      const walletsResponse = await bridgeService.getCustomerWallets(kycProfile.bridge_customer_id);
      
      let walletCount = 0;
      if (walletsResponse.success && walletsResponse.data) {
        walletCount = walletsResponse.data.length;
        console.log(`✅ Encontradas ${walletCount} wallets en Bridge`);
        
        // 5. Sincronizar wallets con la base de datos
        if (walletCount > 0) {
          console.log('🔄 Sincronizando wallets con la base de datos...');
          const syncResult = await walletService.syncWallets(profile.id, kycProfile.bridge_customer_id);
          
          if (syncResult.success) {
            console.log(`✅ Wallets sincronizadas: ${syncResult.syncedCount} total, ${syncResult.createdCount} creadas, ${syncResult.updatedCount} actualizadas`);
          } else {
            console.warn('⚠️ Error sincronizando wallets:', syncResult.errors);
          }
        }
      } else {
        console.log('ℹ️ No se encontraron wallets en Bridge o error al obtenerlas');
      }

      // 6. Mapear datos de Bridge a nuestros campos KYC
      // Usar status si está disponible, sino verification_status
      const bridgeStatus = bridgeData.status || bridgeData.verification_status;
      const mappedKycStatus = mapBridgeStatusToKYCStatus(bridgeStatus);
      
      const updateData = {
        kyc_status: mappedKycStatus,
        updatedAt: new Date().toISOString(),
        bridge_raw_response: bridgeData, // Guardar respuesta completa para auditoría
        
        // Actualizar campos específicos de Bridge
        kyc_approved_at: bridgeStatus === "active" && bridgeData.updated_at
          ? new Date(bridgeData.updated_at).toISOString()
          : null,
        kyc_rejected_at: bridgeStatus === "rejected" && bridgeData.updated_at
          ? new Date(bridgeData.updated_at).toISOString()
          : null,
        kyc_rejection_reason: null, // Se actualizará después si hay rejection_reasons
        
        // Actualizar capacidades de Bridge
        payin_crypto: bridgeData.capabilities?.payin_crypto || bridgeData.payin_crypto || 'pending',
        payout_crypto: bridgeData.capabilities?.payout_crypto || bridgeData.payout_crypto || 'pending',
        payin_fiat: bridgeData.capabilities?.payin_fiat || 'pending',
        payout_fiat: bridgeData.capabilities?.payout_fiat || 'pending',
        
        // Actualizar requirements
        requirements_due: bridgeData.requirements_due || [],
        future_requirements_due: bridgeData.future_requirements_due || [],
        
        // Actualizar términos de servicio
        has_accepted_terms_of_service: !!bridgeData.has_accepted_terms_of_service,
      };

      // 7. Actualizar KYC profile con datos mapeados
      const { error: updateError } = await supabaseAdmin
        .from('kyc_profiles')
        .update(updateData)
        .eq('profile_id', profile.id);

      if (updateError) {
        console.error('❌ Error actualizando estado en base de datos:', updateError);
        return {
          success: false,
          error: `Error actualizando estado: ${updateError.message}`
        };
      }

      console.log('✅ Estado actualizado en base de datos con información real de Bridge');

      // 8. Manejar rejection reasons si existen
      if (bridgeData.rejection_reasons && Array.isArray(bridgeData.rejection_reasons) && bridgeData.rejection_reasons.length > 0) {
        console.log('📝 Procesando rejection reasons...');
        
        // Actualizar rejection reason en KYC profile
        const rejectionReason = bridgeData.rejection_reasons.join(', ');
        await supabaseAdmin
          .from('kyc_profiles')
          .update({ kyc_rejection_reason: rejectionReason })
          .eq('profile_id', profile.id);
        
        console.log('✅ Rejection reasons actualizados');
      }

      // 9. Manejar endorsements si existen
      if (bridgeData.endorsements && Array.isArray(bridgeData.endorsements)) {
        console.log('📝 Procesando endorsements...');
        
        // Eliminar endorsements anteriores
        await supabaseAdmin
          .from('endorsements')
          .delete()
          .eq('kyc_profile_id', profile.id);

        // Crear nuevos endorsements
        for (const endorsement of bridgeData.endorsements) {
          await supabaseAdmin
            .from('endorsements')
            .insert({
              kyc_profile_id: profile.id,
              endorsement_type: endorsement.name,
              status: endorsement.status,
              requirements: endorsement.requirements,
            });
        }
        
        console.log('✅ Endorsements actualizados');
      }

      // 10. Verificar si tiene wallet activa
      const hasActiveWallet = bridgeStatus === 'active' && walletCount > 0;

      // 11. Determinar si puede acceder a home
      const canAccessHome = bridgeStatus === 'active' && hasActiveWallet;

      console.log('✅ Refresh completo de Bridge completado:', {
        bridgeCustomerId: kycProfile.bridge_customer_id,
        mappedStatus: mappedKycStatus,
        hasActiveWallet,
        canAccessHome,
        walletCount,
        requirementsDue: bridgeData.requirements_due?.length || 0,
        endorsements: bridgeData.endorsements?.length || 0,
        rejectionReasons: bridgeData.rejection_reasons?.length || 0
      });

      return {
        success: true,
        bridgeCustomerId: kycProfile.bridge_customer_id,
        verificationStatus: mappedKycStatus,
        requirementsDue: bridgeData.requirements_due || [],
        hasActiveWallet,
        canAccessHome,
        walletCount
      };

    } catch (error) {
      console.error('💥 Error en checkAndUpdateBridgeStatus:', error);
      return {
        success: false,
        error: `Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Verificar si el usuario puede acceder a home basado en estado real de Bridge
   */
  canUserAccessHome: async (userId: string): Promise<{
    canAccess: boolean;
    reason?: string;
    bridgeStatus?: string;
    hasActiveWallet?: boolean;
    shouldRedirectToRejected?: boolean;
  }> => {
    try {
      const bridgeResult = await bridgeStatusService.checkAndUpdateBridgeStatus(userId);
      
      if (!bridgeResult.success) {
        return {
          canAccess: false,
          reason: `Error verificando Bridge: ${bridgeResult.error}`
        };
      }

      if (!bridgeResult.bridgeCustomerId) {
        return {
          canAccess: false,
          reason: 'Usuario no tiene Bridge customer ID'
        };
      }

      if (!bridgeResult.canAccessHome) {
        let reason = 'Estado de Bridge no permite acceso';
        let shouldRedirectToRejected = false;
        
        // Verificar si el usuario está rechazado
        if (bridgeResult.verificationStatus === 'rejected') {
          reason = 'Cuenta rechazada por Bridge';
          shouldRedirectToRejected = true;
        } else if (bridgeResult.verificationStatus !== 'active') {
          reason = `Verificación en proceso (${bridgeResult.verificationStatus})`;
        } else if (!bridgeResult.hasActiveWallet) {
          reason = 'Wallet no está activa';
        }

        return {
          canAccess: false,
          reason,
          bridgeStatus: bridgeResult.verificationStatus,
          hasActiveWallet: bridgeResult.hasActiveWallet,
          shouldRedirectToRejected
        };
      }

      return {
        canAccess: true,
        bridgeStatus: bridgeResult.verificationStatus,
        hasActiveWallet: bridgeResult.hasActiveWallet
      };

    } catch (error) {
      console.error('💥 Error en canUserAccessHome:', error);
      return {
        canAccess: false,
        reason: `Error verificando acceso: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Sincronizar estado de Bridge y actualizar store
   */
  syncBridgeStatus: async (userId: string): Promise<{
    success: boolean;
    bridgeStatus?: string;
    hasActiveWallet?: boolean;
    canAccessHome?: boolean;
    error?: string;
  }> => {
    try {
      const bridgeResult = await bridgeStatusService.checkAndUpdateBridgeStatus(userId);
      
      if (!bridgeResult.success) {
        return {
          success: false,
          error: bridgeResult.error
        };
      }

      // Actualizar Bridge store con información real
      const { updateBridgeStatus } = (await import('@/app/store/bridgeStore')).useBridgeStore.getState();
      updateBridgeStatus({
        isInitialized: !!bridgeResult.bridgeCustomerId,
        bridgeCustomerId: bridgeResult.bridgeCustomerId,
        verificationStatus: bridgeResult.verificationStatus,
        hasActiveWallet: bridgeResult.hasActiveWallet,
        canAccessHome: bridgeResult.canAccessHome
      });

      return {
        success: true,
        bridgeStatus: bridgeResult.verificationStatus,
        hasActiveWallet: bridgeResult.hasActiveWallet,
        canAccessHome: bridgeResult.canAccessHome
      };

    } catch (error) {
      console.error('💥 Error en syncBridgeStatus:', error);
      return {
        success: false,
        error: `Error sincronizando Bridge: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Refresh automático al entrar a la app
   */
  autoRefreshOnAppStart: async (userId: string): Promise<void> => {
    try {
      console.log('🔄 Auto-refresh de Bridge al iniciar app...');
      
      const result = await bridgeStatusService.syncBridgeStatus(userId);
      
      if (result.success) {
        console.log('✅ Auto-refresh completado:', {
          bridgeStatus: result.bridgeStatus,
          hasActiveWallet: result.hasActiveWallet,
          canAccessHome: result.canAccessHome
        });
      } else {
        console.warn('⚠️ Auto-refresh falló:', result.error);
      }
    } catch (error) {
      console.error('💥 Error en auto-refresh:', error);
    }
  }
}; 