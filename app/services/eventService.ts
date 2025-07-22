import { createId } from '@paralleldrive/cuid2';
import {
    ANALYTICS_CONFIG,
    CreateEventRequest,
    Event,
    EVENT_DESCRIPTIONS,
    EventServiceResponse,
    EventTimeline,
    JourneyStage,
    JourneyStageInfo,
    UserJourneyAnalytics
} from '../types/Analytics';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Event Service
 * Handles creation and management of user journey events in Supabase
 * Provides comprehensive tracking for analytics and user journey insights
 */
export const eventService = {
  /**
   * Create a single event in the database
   */
  createEvent: async (eventData: CreateEventRequest): Promise<EventServiceResponse<Event>> => {
    try {
      console.log('📊 Creating event:', eventData);

      // Validate required fields
      if (!eventData.profileId || !eventData.type || !eventData.module) {
        return {
          success: false,
          error: 'Missing required event fields: profileId, type, or module'
        };
      }

      // Set default description if not provided
      const description = eventData.description || EVENT_DESCRIPTIONS[eventData.type];

      // Prepare event payload
      const eventPayload = {
        id: createId(), // Generate unique ID for the event
        profile_id: eventData.profileId,
        type: eventData.type,
        module: eventData.module,
        description,
        metadata: eventData.metadata || null,
        createdAt: eventData.timestamp ? eventData.timestamp.toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📊 Event payload:', eventPayload);

      // Insert into Supabase
      const { data, error } = await supabaseAdmin
        .from('events')
        .insert(eventPayload)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating event:', error);
        return {
          success: false,
          error: `Failed to create event: ${error.message}`
        };
      }

      // Transform response to match Event interface
      const event: Event = {
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
        type: data.type,
        module: data.module,
        description: data.description,
        profileId: data.profile_id,
        metadata: data.metadata
      };

      console.log('✅ Event created successfully:', event.id);
      return {
        success: true,
        data: event
      };

    } catch (error) {
      console.error('💥 Error in createEvent:', error);
      return {
        success: false,
        error: `Event creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Create event with automatic retry mechanism
   */
  createEventWithRetry: async (
    eventData: CreateEventRequest, 
    maxAttempts = ANALYTICS_CONFIG.MAX_RETRY_ATTEMPTS
  ): Promise<EventServiceResponse<Event>> => {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📊 Event creation attempt ${attempt}/${maxAttempts}`);

      const result = await eventService.createEvent(eventData);
      
      if (result.success) {
        console.log('✅ Event created successfully on attempt', attempt);
        return result;
      }

      lastError = result.error || 'Unknown error';
      console.log(`⚠️ Event creation failed on attempt ${attempt}:`, lastError);

      // Wait before retry (exponential backoff)
      if (attempt < maxAttempts) {
        const delay = ANALYTICS_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: `Failed to create event after ${maxAttempts} attempts: ${lastError}`
    };
  },

  /**
   * Create multiple events in a batch
   */
  createEventsBatch: async (events: CreateEventRequest[]): Promise<EventServiceResponse<Event[]>> => {
    try {
      console.log(`📊 Creating batch of ${events.length} events`);

      if (events.length === 0) {
        return { success: true, data: [] };
      }

      // Validate all events
      for (const event of events) {
        if (!event.profileId || !event.type || !event.module) {
          return {
            success: false,
            error: 'Invalid event in batch: missing required fields'
          };
        }
      }

      // Prepare batch payload
      const batchPayload = events.map(event => ({
        id: createId(), // Generate unique ID for each event
        profile_id: event.profileId,
        type: event.type,
        module: event.module,
        description: event.description || EVENT_DESCRIPTIONS[event.type],
        metadata: event.metadata || null,
        createdAt: event.timestamp ? event.timestamp.toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Insert batch into Supabase
      const { data, error } = await supabaseAdmin
        .from('events')
        .insert(batchPayload)
        .select();

      if (error) {
        console.error('❌ Error creating batch events:', error);
        return {
          success: false,
          error: `Failed to create batch events: ${error.message}`
        };
      }

      // Transform response
      const createdEvents: Event[] = data.map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        type: item.type,
        module: item.module,
        description: item.description,
        profileId: item.profile_id,
        metadata: item.metadata
      }));

      console.log(`✅ Batch of ${createdEvents.length} events created successfully`);
      return {
        success: true,
        data: createdEvents
      };

    } catch (error) {
      console.error('💥 Error in createEventsBatch:', error);
      return {
        success: false,
        error: `Batch event creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Get all events for a specific user
   */
  getUserEvents: async (profileId: string, limit = ANALYTICS_CONFIG.MAX_TIMELINE_EVENTS): Promise<EventServiceResponse<Event[]>> => {
    try {
      console.log('🔍 Getting events for profile:', profileId);

      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('profile_id', profileId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting user events:', error);
        return {
          success: false,
          error: `Failed to get user events: ${error.message}`
        };
      }

      // Transform response
      const events: Event[] = data.map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        type: item.type,
        module: item.module,
        description: item.description,
        profileId: item.profile_id,
        metadata: item.metadata
      }));

      console.log(`✅ Retrieved ${events.length} events for user`);
      return {
        success: true,
        data: events
      };

    } catch (error) {
      console.error('💥 Error in getUserEvents:', error);
      return {
        success: false,
        error: `Failed to get user events: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Get user journey analytics
   */
  trackUserJourney: async (profileId: string): Promise<EventServiceResponse<UserJourneyAnalytics>> => {
    try {
      console.log('📈 Tracking user journey for:', profileId);

      const eventsResult = await eventService.getUserEvents(profileId);
      if (!eventsResult.success || !eventsResult.data) {
        return {
          success: false,
          error: eventsResult.error || 'Failed to get user events'
        };
      }

      const events = eventsResult.data;
      
      // Find key events
      const signUpEvent = events.find(e => e.type === 'USER_SIGNED_UP');
      const kycSubmittedEvent = events.find(e => e.type === 'USER_SUBMITTED_KYC');
      const kycApprovedEvent = events.find(e => e.type === 'USER_KYC_APPROVED');
      const kycRejectedEvent = events.find(e => e.type === 'USER_KYC_REJECTED');

      // Calculate journey analytics
      const analytics: UserJourneyAnalytics = {
        userId: profileId,
        signUpDate: signUpEvent?.createdAt || new Date().toISOString(),
        kycSubmittedDate: kycSubmittedEvent?.createdAt,
        kycApprovedDate: kycApprovedEvent?.createdAt,
        kycRejectedDate: kycRejectedEvent?.createdAt,
        
        // Calculate timing metrics
        timeToKycSubmission: signUpEvent && kycSubmittedEvent 
          ? Math.round((new Date(kycSubmittedEvent.createdAt).getTime() - new Date(signUpEvent.createdAt).getTime()) / (1000 * 60))
          : undefined,
        
        timeToKycDecision: kycSubmittedEvent && (kycApprovedEvent || kycRejectedEvent)
          ? Math.round((new Date((kycApprovedEvent || kycRejectedEvent)!.createdAt).getTime() - new Date(kycSubmittedEvent.createdAt).getTime()) / (1000 * 60))
          : undefined,
        
        // Determine current stage
        currentStage: eventService.getCurrentJourneyStage(events),
        isComplete: !!kycApprovedEvent,
        hasErrors: !!kycRejectedEvent
      };

      console.log('✅ User journey analytics calculated:', analytics);
      return {
        success: true,
        data: analytics
      };

    } catch (error) {
      console.error('💥 Error in trackUserJourney:', error);
      return {
        success: false,
        error: `Failed to track user journey: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Get event timeline for user
   */
  getEventTimeline: async (profileId: string): Promise<EventServiceResponse<EventTimeline>> => {
    try {
      console.log('📅 Getting event timeline for:', profileId);

      const eventsResult = await eventService.getUserEvents(profileId);
      if (!eventsResult.success || !eventsResult.data) {
        return {
          success: false,
          error: eventsResult.error || 'Failed to get user events'
        };
      }

      const events = eventsResult.data;
      
      // Calculate date range
      const dates = events.map(e => new Date(e.createdAt));
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

      // Build stages info
      const stages = eventService.buildJourneyStages(events);

      const timeline: EventTimeline = {
        events,
        totalEvents: events.length,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        stages
      };

      console.log(`✅ Event timeline built with ${events.length} events`);
      return {
        success: true,
        data: timeline
      };

    } catch (error) {
      console.error('💥 Error in getEventTimeline:', error);
      return {
        success: false,
        error: `Failed to get event timeline: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Helper: Determine current journey stage from events
   */
  getCurrentJourneyStage: (events: Event[]): JourneyStage => {
    // Check in reverse order (most advanced stage first)
    if (events.some(e => e.type === 'USER_KYC_APPROVED')) return 'kyc_approved';
    if (events.some(e => e.type === 'USER_KYC_REJECTED')) return 'kyc_rejected';
    if (events.some(e => e.type === 'USER_KYC_UNDER_VERIFICATION')) return 'kyc_verification';
    if (events.some(e => e.type === 'USER_SUBMITTED_KYC')) return 'kyc_submitted';
    if (events.some(e => e.type === 'USER_SIGNED_UP')) return 'signup';
    
    return 'signup'; // Default fallback
  },

  /**
   * Helper: Build journey stages info from events
   */
  buildJourneyStages: (events: Event[]): JourneyStageInfo[] => {
    const stageOrder: JourneyStage[] = ['signup', 'kyc_submitted', 'kyc_verification', 'kyc_approved'];
    const stages: JourneyStageInfo[] = [];

    for (let i = 0; i < stageOrder.length; i++) {
      const stage = stageOrder[i];
      const nextStage = stageOrder[i + 1];
      
      // Find corresponding event types
      let eventType: string;
      switch (stage) {
        case 'signup': eventType = 'USER_SIGNED_UP'; break;
        case 'kyc_submitted': eventType = 'USER_SUBMITTED_KYC'; break;
        case 'kyc_verification': eventType = 'USER_KYC_UNDER_VERIFICATION'; break;
        case 'kyc_approved': eventType = 'USER_KYC_APPROVED'; break;
        default: continue;
      }

      const event = events.find(e => e.type === eventType);
      const nextEvent = nextStage ? events.find(e => {
        switch (nextStage) {
          case 'kyc_submitted': return e.type === 'USER_SUBMITTED_KYC';
          case 'kyc_verification': return e.type === 'USER_KYC_UNDER_VERIFICATION';
          case 'kyc_approved': return e.type === 'USER_KYC_APPROVED';
          default: return false;
        }
      }) : null;

      stages.push({
        stage,
        completed: !!event,
        completedAt: event?.createdAt,
        timeInStage: event && nextEvent 
          ? Math.round((new Date(nextEvent.createdAt).getTime() - new Date(event.createdAt).getTime()) / (1000 * 60))
          : undefined,
        nextStage
      });
    }

    // Check for rejection
    const rejectedEvent = events.find(e => e.type === 'USER_KYC_REJECTED');
    if (rejectedEvent) {
      stages.push({
        stage: 'kyc_rejected',
        completed: true,
        completedAt: rejectedEvent.createdAt,
        timeInStage: undefined,
        nextStage: undefined
      });
    }

    return stages;
  }
}; 