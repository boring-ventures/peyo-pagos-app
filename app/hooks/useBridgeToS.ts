import * as AuthSession from 'expo-auth-session';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../store';

/**
 * Custom hook for handling Bridge ToS flow using expo-auth-session
 * Enhanced with robust error handling, timeouts, and recovery mechanisms
 */
export const useBridgeToS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRetries = 3;
  
  const { 
    hasAcceptedTermsOfService, 
    isPendingTosAcceptance,
    acceptTermsOfService,
    setError: setBridgeError,
    clearError: clearBridgeError
  } = useBridgeStore();

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Generate redirect URI using expo-auth-session with fallback
   */
  const generateRedirectUri = useCallback(() => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'peyopagos',
        // For production web URLs, you can set useProxy: false
        // useProxy: false,
      });
      
      console.log('🔗 Generated redirect URI using expo-auth-session:', redirectUri);
      return redirectUri;
    } catch (error) {
      console.error('❌ Error generating redirect URI:', error);
      
      // Fallback redirect URI
      const fallbackUri = 'peyopagos://redirect';
      console.log('🔄 Using fallback redirect URI:', fallbackUri);
      return fallbackUri;
    }
  }, []);

  /**
   * Clear timeout and reset states
   */
  const clearTimeoutAndReset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
    setIsRetrying(false);
  }, []);

  /**
   * Start ToS flow with enhanced error handling and retry logic
   */
  const startToSFlow = useCallback(async (currentRetryAttempt: number = 0): Promise<{
    success: boolean;
    error?: string;
    alreadyAccepted?: boolean;
    dismissed?: boolean;
    signedAgreementId?: string;
  }> => {
    if (isLoading || isRetrying) {
      console.log('⏳ ToS flow already in progress');
      return { success: false, error: 'ToS flow already in progress' };
    }

    setIsLoading(true);
    setError(null);
    setRetryAttempt(currentRetryAttempt);

    const clearTimeoutAndReset = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
      setIsRetrying(false);
    };

    try {
      // Check if already accepted
      if (hasAcceptedTermsOfService) {
        console.log('✅ ToS already accepted');
        clearTimeoutAndReset();
        return { success: true, alreadyAccepted: true };
      }

      // Check if pending (and this is a fresh attempt)
      if (isPendingTosAcceptance && currentRetryAttempt === 0) {
        console.log('⏳ ToS acceptance already pending');
        clearTimeoutAndReset();
        return { success: false, error: 'ToS acceptance already in progress' };
      }

      // Use the store's showToSForUser method which now returns URL for WebView
      console.log('🌐 Starting ToS flow using store method...');
      const result = await useBridgeStore.getState().showToSForUser();
      
      clearTimeoutAndReset();

      if (result.success) {
        if (result.url) {
          console.log('✅ ToS URL ready for WebView:', result.url);
          // The WebView component will handle the actual flow
          return { success: true };
        } else if (result.signedAgreementId) {
          console.log('✅ ToS accepted with agreement ID:', result.signedAgreementId);
          return { success: true, signedAgreementId: result.signedAgreementId };
        } else if (result.dismissed) {
          console.log('ℹ️ ToS flow dismissed');
          return { success: true, dismissed: true };
        } else {
          console.log('✅ ToS flow completed successfully');
          return { success: true };
        }
      } else {
        console.error('❌ ToS flow failed:', result.error);
        
        // Retry logic for network errors
        if (currentRetryAttempt < maxRetries && result.error?.includes('network')) {
          console.log(`🔄 Retrying ToS flow due to network error... (attempt ${currentRetryAttempt + 1}/${maxRetries})`);
          setIsRetrying(true);
          const retryDelay = Math.pow(2, currentRetryAttempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return startToSFlow(currentRetryAttempt + 1);
        }
        
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('💥 ToS flow error:', error);
      clearTimeoutAndReset();
      
      // Retry logic for unexpected errors
      if (currentRetryAttempt < maxRetries) {
        console.log(`🔄 Retrying ToS flow due to error... (attempt ${currentRetryAttempt + 1}/${maxRetries})`);
        setIsRetrying(true);
        const retryDelay = Math.pow(2, currentRetryAttempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return startToSFlow(currentRetryAttempt + 1);
      }
      
      return { 
        success: false, 
        error: `ToS Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }, [hasAcceptedTermsOfService, isPendingTosAcceptance, isLoading, isRetrying, maxRetries]);

  /**
   * Handle ToS callback from deep link with validation
   */
  const handleToSCallback = useCallback((url: string) => {
    try {
      console.log('🔐 Handling ToS callback:', url);
      
      // Clear any active timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const signedAgreementId = urlParams.get('signed_agreement_id');

      if (signedAgreementId) {
        console.log('✅ Extracted signed_agreement_id from callback:', signedAgreementId);
        
        // Validate the agreement ID format (basic validation)
        if (signedAgreementId.length < 10) {
          console.error('❌ Invalid signed_agreement_id format:', signedAgreementId);
          return { success: false, error: 'Invalid agreement ID format' };
        }
        
        acceptTermsOfService(signedAgreementId);
        clearTimeoutAndReset();
        return { success: true, signedAgreementId };
      } else {
        console.error('❌ No signed_agreement_id found in callback URL');
        return { success: false, error: 'No signed_agreement_id found' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Error handling ToS callback:', errorMessage);
      clearTimeoutAndReset();
      return { success: false, error: errorMessage };
    }
  }, [acceptTermsOfService, clearTimeoutAndReset]);

  /**
   * Manual retry function for UI
   */
  const retryToSFlow = useCallback(async () => {
    console.log('🔄 Manual retry of ToS flow requested');
    setRetryAttempt(0);
    return startToSFlow(0);
  }, [startToSFlow]);

  /**
   * Cancel ToS flow and cleanup
   */
  const cancelToSFlow = useCallback(() => {
    console.log('❌ ToS flow cancelled by user');
    clearTimeoutAndReset();
    const { cancelTosFlow } = useBridgeStore.getState();
    cancelTosFlow();
  }, [clearTimeoutAndReset]);

  /**
   * Check if ToS flow is ready
   */
  const isToSReady = useCallback(() => {
    return !isLoading && !isPendingTosAcceptance && !hasAcceptedTermsOfService && !isRetrying;
  }, [isLoading, isPendingTosAcceptance, hasAcceptedTermsOfService, isRetrying]);

  return {
    // State
    isLoading,
    error,
    hasAcceptedTermsOfService,
    isPendingTosAcceptance,
    isToSReady: isToSReady(),
    retryAttempt,
    isRetrying,
    
    // Actions
    startToSFlow: () => startToSFlow(0), // Reset retry attempt for manual calls
    handleToSCallback,
    generateRedirectUri,
    retryToSFlow,
    cancelToSFlow,
    
    // Utilities
    clearError: () => {
      setError(null);
      clearBridgeError();
      clearTimeoutAndReset();
    }
  };
}; 