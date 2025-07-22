import { Platform } from 'react-native';
import {
    AnalyticsError,
    EventServiceResponse,
    JourneyStage,
    JourneyStats,
    KycApprovedMetadata,
    KycRejectedMetadata,
    KycSubmittedMetadata,
    KycVerificationMetadata,
    SignUpMetadata
} from '../types/Analytics';
import { eventService } from './eventService';

/**
 * Analytics Service
 * High-level wrapper around eventService for specific user journey tracking
 * Provides convenient methods for each type of analytics event
 */
export const analyticsService = {
  /**
   * Track user sign up event
   */
  trackSignUp: async (profileId: string, metadata?: Partial<SignUpMetadata>): Promise<boolean> => {
    try {
      console.log('📊 Tracking sign up for profile:', profileId);

      const fullMetadata: SignUpMetadata = {
        email: metadata?.email || '',
        signUpMethod: metadata?.signUpMethod || 'email',
        platform: Platform.OS as 'ios' | 'android',
        userAgent: metadata?.userAgent,
        ...metadata
      };

      const result = await eventService.createEventWithRetry({
        profileId,
        type: 'USER_SIGNED_UP',
        module: 'AUTH',
        description: 'Usuario registrado en la plataforma',
        metadata: fullMetadata
      });

      if (result.success) {
        console.log('✅ Sign up event tracked successfully');
        return true;
      } else {
        console.error('❌ Failed to track sign up:', result.error);
        await analyticsService.trackError({
          type: 'event_creation',
          message: result.error || 'Failed to track sign up',
          userId: profileId,
          eventType: 'USER_SIGNED_UP',
          timestamp: new Date()
        });
        return false;
      }

    } catch (error) {
      console.error('💥 Error in trackSignUp:', error);
      await analyticsService.trackError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error in trackSignUp',
        userId: profileId,
        eventType: 'USER_SIGNED_UP',
        timestamp: new Date()
      });
      return false;
    }
  },

  /**
   * Track KYC submission event
   */
  trackKycSubmitted: async (profileId: string, metadata?: Partial<KycSubmittedMetadata>): Promise<boolean> => {
    try {
      console.log('📊 Tracking KYC submitted for profile:', profileId);

      const fullMetadata: KycSubmittedMetadata = {
        documentsCount: metadata?.documentsCount || 0,
        kycStep: metadata?.kycStep || 'completed',
        timeToComplete: metadata?.timeToComplete || 0,
        documentTypes: metadata?.documentTypes || [],
        hasProfilePhoto: metadata?.hasProfilePhoto || false,
        ...metadata
      };

      const result = await eventService.createEventWithRetry({
        profileId,
        type: 'USER_SUBMITTED_KYC',
        module: 'KYC',
        description: 'Usuario envió información para verificación KYC',
        metadata: fullMetadata
      });

      if (result.success) {
        console.log('✅ KYC submitted event tracked successfully');
        return true;
      } else {
        console.error('❌ Failed to track KYC submitted:', result.error);
        await analyticsService.trackError({
          type: 'event_creation',
          message: result.error || 'Failed to track KYC submitted',
          userId: profileId,
          eventType: 'USER_SUBMITTED_KYC',
          timestamp: new Date()
        });
        return false;
      }

    } catch (error) {
      console.error('💥 Error in trackKycSubmitted:', error);
      await analyticsService.trackError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error in trackKycSubmitted',
        userId: profileId,
        eventType: 'USER_SUBMITTED_KYC',
        timestamp: new Date()
      });
      return false;
    }
  },

  /**
   * Track KYC under verification event
   */
  trackKycUnderVerification: async (profileId: string, metadata?: Partial<KycVerificationMetadata>): Promise<boolean> => {
    try {
      console.log('📊 Tracking KYC under verification for profile:', profileId);

      const fullMetadata: KycVerificationMetadata = {
        bridgeCustomerId: metadata?.bridgeCustomerId || '',
        bridgeStatus: metadata?.bridgeStatus || '',
        submittedAt: metadata?.submittedAt || new Date().toISOString(),
        expectedProcessingTime: metadata?.expectedProcessingTime,
        ...metadata
      };

      const result = await eventService.createEventWithRetry({
        profileId,
        type: 'USER_KYC_UNDER_VERIFICATION',
        module: 'KYC',
        description: 'KYC del usuario en proceso de verificación',
        metadata: fullMetadata
      });

      if (result.success) {
        console.log('✅ KYC under verification event tracked successfully');
        return true;
      } else {
        console.error('❌ Failed to track KYC under verification:', result.error);
        await analyticsService.trackError({
          type: 'event_creation',
          message: result.error || 'Failed to track KYC under verification',
          userId: profileId,
          eventType: 'USER_KYC_UNDER_VERIFICATION',
          timestamp: new Date()
        });
        return false;
      }

    } catch (error) {
      console.error('💥 Error in trackKycUnderVerification:', error);
      await analyticsService.trackError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error in trackKycUnderVerification',
        userId: profileId,
        eventType: 'USER_KYC_UNDER_VERIFICATION',
        timestamp: new Date()
      });
      return false;
    }
  },

  /**
   * Track KYC approved event
   */
  trackKycApproved: async (profileId: string, metadata?: Partial<KycApprovedMetadata>): Promise<boolean> => {
    try {
      console.log('📊 Tracking KYC approved for profile:', profileId);

      const fullMetadata: KycApprovedMetadata = {
        bridgeCustomerId: metadata?.bridgeCustomerId || '',
        userTag: metadata?.userTag || '',
        approvedAt: metadata?.approvedAt || new Date().toISOString(),
        timeToApproval: metadata?.timeToApproval || 0,
        autoApproved: metadata?.autoApproved || false,
        ...metadata
      };

      const result = await eventService.createEventWithRetry({
        profileId,
        type: 'USER_KYC_APPROVED',
        module: 'KYC',
        description: 'KYC del usuario aprobado exitosamente',
        metadata: fullMetadata
      });

      if (result.success) {
        console.log('✅ KYC approved event tracked successfully');
        return true;
      } else {
        console.error('❌ Failed to track KYC approved:', result.error);
        await analyticsService.trackError({
          type: 'event_creation',
          message: result.error || 'Failed to track KYC approved',
          userId: profileId,
          eventType: 'USER_KYC_APPROVED',
          timestamp: new Date()
        });
        return false;
      }

    } catch (error) {
      console.error('💥 Error in trackKycApproved:', error);
      await analyticsService.trackError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error in trackKycApproved',
        userId: profileId,
        eventType: 'USER_KYC_APPROVED',
        timestamp: new Date()
      });
      return false;
    }
  },

  /**
   * Track KYC rejected event
   */
  trackKycRejected: async (profileId: string, metadata?: Partial<KycRejectedMetadata>): Promise<boolean> => {
    try {
      console.log('📊 Tracking KYC rejected for profile:', profileId);

      const fullMetadata: KycRejectedMetadata = {
        bridgeCustomerId: metadata?.bridgeCustomerId || '',
        rejectionReason: metadata?.rejectionReason || 'Unknown reason',
        rejectedAt: metadata?.rejectedAt || new Date().toISOString(),
        timeToRejection: metadata?.timeToRejection || 0,
        canRetry: metadata?.canRetry || false,
        requiredActions: metadata?.requiredActions || [],
        ...metadata
      };

      const result = await eventService.createEventWithRetry({
        profileId,
        type: 'USER_KYC_REJECTED',
        module: 'KYC',
        description: `KYC del usuario rechazado: ${fullMetadata.rejectionReason}`,
        metadata: fullMetadata
      });

      if (result.success) {
        console.log('✅ KYC rejected event tracked successfully');
        return true;
      } else {
        console.error('❌ Failed to track KYC rejected:', result.error);
        await analyticsService.trackError({
          type: 'event_creation',
          message: result.error || 'Failed to track KYC rejected',
          userId: profileId,
          eventType: 'USER_KYC_REJECTED',
          timestamp: new Date()
        });
        return false;
      }

    } catch (error) {
      console.error('💥 Error in trackKycRejected:', error);
      await analyticsService.trackError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error in trackKycRejected',
        userId: profileId,
        eventType: 'USER_KYC_REJECTED',
        timestamp: new Date()
      });
      return false;
    }
  },

  /**
   * Get user journey stats with analytics
   */
  getUserJourneyStats: async (profileId: string): Promise<EventServiceResponse<JourneyStats>> => {
    try {
      console.log('📈 Getting user journey stats for:', profileId);

      const journeyResult = await eventService.trackUserJourney(profileId);
      if (!journeyResult.success || !journeyResult.data) {
        return {
          success: false,
          error: journeyResult.error || 'Failed to get user journey'
        };
      }

      const journey = journeyResult.data;
      
             // Calculate completed stages
       const completedStages: JourneyStage[] = [];
       if (journey.signUpDate) completedStages.push('signup');
       if (journey.kycSubmittedDate) completedStages.push('kyc_submitted');
       if (journey.kycApprovedDate) completedStages.push('kyc_approved');
       if (journey.kycRejectedDate) completedStages.push('kyc_rejected');

      // Calculate time spent in each stage
      const timeSpentInStage = {
        signup: journey.timeToKycSubmission || 0,
        kyc_submitted: 0,
        kyc_verification: journey.timeToKycDecision || 0,
        kyc_approved: 0,
        kyc_rejected: 0
      };

      // Calculate conversion rate
      const totalStages = 4; // signup, kyc_submitted, kyc_verification, kyc_approved
      const conversionRate = completedStages.length / totalStages;

      // Calculate average completion time
      const signUpTime = journey.signUpDate ? new Date(journey.signUpDate) : new Date();
      const completionTime = journey.kycApprovedDate ? new Date(journey.kycApprovedDate) : new Date();
      const averageCompletionTime = (completionTime.getTime() - signUpTime.getTime()) / (1000 * 60 * 60 * 24); // days

      const stats: JourneyStats = {
        totalEvents: completedStages.length,
        completedStages,
        timeSpentInStage,
        conversionRate,
        averageCompletionTime
      };

      console.log('✅ User journey stats calculated:', stats);
      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('💥 Error in getUserJourneyStats:', error);
      return {
        success: false,
        error: `Failed to get user journey stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Track analytical errors for debugging
   */
  trackError: async (error: AnalyticsError): Promise<void> => {
    try {
      console.error('📊 Tracking analytics error:', error);

      // Create error event
      if (error.userId) {
        await eventService.createEvent({
          profileId: error.userId,
          type: 'USER_SIGNED_UP', // Use a base type for error tracking
          module: 'PROFILE',
          description: `Analytics Error: ${error.type} - ${error.message}`,
          metadata: {
            errorType: error.type,
            errorMessage: error.message,
            originalEventType: error.eventType,
            errorMetadata: error.metadata,
            timestamp: error.timestamp.toISOString()
          }
        });
      }

      // Also log to console for immediate debugging
      console.error('🚨 Analytics Error Details:', {
        type: error.type,
        message: error.message,
        userId: error.userId,
        eventType: error.eventType,
        metadata: error.metadata,
        timestamp: error.timestamp
      });

    } catch (trackingError) {
      console.error('💥 Failed to track analytics error:', trackingError);
    }
  },

  /**
   * Helper: Calculate time between two dates in different units
   */
  calculateTimeDifference: (startDate: string, endDate: string, unit: 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes'): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();

    switch (unit) {
      case 'seconds': return Math.round(diffMs / 1000);
      case 'minutes': return Math.round(diffMs / (1000 * 60));
      case 'hours': return Math.round(diffMs / (1000 * 60 * 60));
      case 'days': return Math.round(diffMs / (1000 * 60 * 60 * 24));
      default: return Math.round(diffMs / (1000 * 60)); // default to minutes
    }
  },

  /**
   * Helper: Get analytics summary for a user
   */
  getAnalyticsSummary: async (profileId: string) => {
    try {
      const [journeyResult, timelineResult] = await Promise.all([
        eventService.trackUserJourney(profileId),
        eventService.getEventTimeline(profileId)
      ]);

      return {
        journey: journeyResult.data,
        timeline: timelineResult.data,
        success: journeyResult.success && timelineResult.success,
        error: journeyResult.error || timelineResult.error
      };

    } catch (error) {
      console.error('💥 Error getting analytics summary:', error);
      return {
        journey: null,
        timeline: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}; 