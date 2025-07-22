import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { analyticsService } from '../services/analyticsService';
import { eventQueueService } from '../services/eventQueueService';
import { eventService } from '../services/eventService';
import {
    ConversionMetrics,
    CreateEventRequest,
    EventTimeline,
    JourneyStats,
    ProcessQueueResult,
    QueuedEvent,
    UserJourneyAnalytics
} from '../types/Analytics';

// ==================== STORE INTERFACE ====================

interface AnalyticsState {
  // Event queue for offline support
  eventQueue: QueuedEvent[];
  
  // Analytics data cache
  userJourneyStats: JourneyStats | null;
  conversionMetrics: ConversionMetrics | null;
  userJourneyAnalytics: UserJourneyAnalytics | null;
  eventTimeline: EventTimeline | null;
  
  // State management
  isTrackingEnabled: boolean;
  isSyncing: boolean;
  isQueueProcessing: boolean;
  lastSyncAt: string | null;
  queueSize: number;
  
  // Error tracking
  lastError: string | null;
  syncErrors: string[];
  
  // Actions
  queueEvent: (event: CreateEventRequest) => Promise<void>;
  flushEventQueue: () => Promise<ProcessQueueResult>;
  syncEvents: () => Promise<void>;
  loadUserJourney: (profileId: string) => Promise<void>;
  loadUserStats: (profileId: string) => Promise<void>;
  loadEventTimeline: (profileId: string) => Promise<void>;
  
  // Settings
  enableTracking: () => void;
  disableTracking: () => void;
  clearCache: () => void;
  clearErrors: () => void;
  
  // Initialization
  initialize: () => Promise<void>;
  cleanup: () => void;
}

// ==================== STORE IMPLEMENTATION ====================

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Initial state
      eventQueue: [],
      userJourneyStats: null,
      conversionMetrics: null,
      userJourneyAnalytics: null,
      eventTimeline: null,
      isTrackingEnabled: true,
      isSyncing: false,
      isQueueProcessing: false,
      lastSyncAt: null,
      queueSize: 0,
      lastError: null,
      syncErrors: [],

      // ==================== EVENT QUEUE ACTIONS ====================

      /**
       * Queue an event for offline support
       */
      queueEvent: async (event: CreateEventRequest) => {
        try {
          console.log('📊 Analytics Store: Queueing event', event.type);

          const { isTrackingEnabled } = get();
          
          if (!isTrackingEnabled) {
            console.log('⚠️ Analytics tracking disabled, skipping event');
            return;
          }

          // Add to queue service
          await eventQueueService.addToQueue(event);
          
          // Update store state
          const currentQueueSize = eventQueueService.getQueueSize();
          set({ 
            queueSize: currentQueueSize,
            lastError: null 
          });

          console.log(`✅ Event queued. Queue size: ${currentQueueSize}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error queueing event:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10) // Keep last 10 errors
          }));
        }
      },

      /**
       * Flush the event queue
       */
      flushEventQueue: async (): Promise<ProcessQueueResult> => {
        try {
          console.log('📊 Analytics Store: Flushing event queue');

          set({ isQueueProcessing: true, lastError: null });

          const result = await eventQueueService.processQueue();
          
          // Update store state
          const currentQueueSize = eventQueueService.getQueueSize();
          set({ 
            queueSize: currentQueueSize,
            isQueueProcessing: false,
            lastSyncAt: new Date().toISOString()
          });

          console.log('✅ Event queue flushed:', result);
          return result;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error flushing queue:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10),
            isQueueProcessing: false
          }));

          return { processed: 0, successful: 0, failed: 1, errors: [errorMessage] };
        }
      },

      /**
       * Sync events and analytics data
       */
      syncEvents: async () => {
        try {
          console.log('📊 Analytics Store: Syncing events');

          const { isSyncing } = get();
          if (isSyncing) {
            console.log('⚠️ Sync already in progress, skipping');
            return;
          }

          set({ isSyncing: true, lastError: null });

          // Process queue first
          await get().flushEventQueue();

          // Update sync timestamp
          set({ 
            isSyncing: false,
            lastSyncAt: new Date().toISOString()
          });

          console.log('✅ Events synced successfully');

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error syncing events:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10),
            isSyncing: false
          }));
        }
      },

      // ==================== ANALYTICS DATA ACTIONS ====================

      /**
       * Load user journey analytics
       */
      loadUserJourney: async (profileId: string) => {
        try {
          console.log('📊 Analytics Store: Loading user journey for', profileId);

          const result = await eventService.trackUserJourney(profileId);
          
          if (result.success && result.data) {
            set({ 
              userJourneyAnalytics: result.data,
              lastError: null 
            });
            console.log('✅ User journey loaded successfully');
          } else {
            throw new Error(result.error || 'Failed to load user journey');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error loading user journey:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10)
          }));
        }
      },

      /**
       * Load user journey stats
       */
      loadUserStats: async (profileId: string) => {
        try {
          console.log('📊 Analytics Store: Loading user stats for', profileId);

          const result = await analyticsService.getUserJourneyStats(profileId);
          
          if (result.success && result.data) {
            set({ 
              userJourneyStats: result.data,
              lastError: null 
            });
            console.log('✅ User stats loaded successfully');
          } else {
            throw new Error(result.error || 'Failed to load user stats');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error loading user stats:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10)
          }));
        }
      },

      /**
       * Load event timeline
       */
      loadEventTimeline: async (profileId: string) => {
        try {
          console.log('📊 Analytics Store: Loading event timeline for', profileId);

          const result = await eventService.getEventTimeline(profileId);
          
          if (result.success && result.data) {
            set({ 
              eventTimeline: result.data,
              lastError: null 
            });
            console.log('✅ Event timeline loaded successfully');
          } else {
            throw new Error(result.error || 'Failed to load event timeline');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error loading event timeline:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10)
          }));
        }
      },

      // ==================== SETTINGS ACTIONS ====================

      /**
       * Enable analytics tracking
       */
      enableTracking: () => {
        console.log('📊 Analytics tracking enabled');
        set({ isTrackingEnabled: true });
      },

      /**
       * Disable analytics tracking
       */
      disableTracking: () => {
        console.log('📊 Analytics tracking disabled');
        set({ isTrackingEnabled: false });
      },

      /**
       * Clear all cached analytics data
       */
      clearCache: () => {
        console.log('🧹 Clearing analytics cache');
        set({
          userJourneyStats: null,
          conversionMetrics: null,
          userJourneyAnalytics: null,
          eventTimeline: null,
          lastError: null,
          syncErrors: []
        });
      },

      /**
       * Clear error messages
       */
      clearErrors: () => {
        console.log('🧹 Clearing analytics errors');
        set({
          lastError: null,
          syncErrors: []
        });
      },

      // ==================== INITIALIZATION ====================

      /**
       * Initialize the analytics store
       */
      initialize: async () => {
        try {
          console.log('📊 Initializing Analytics Store...');

          // Initialize event queue service
          await eventQueueService.initialize();

          // Update queue size
          const currentQueueSize = eventQueueService.getQueueSize();
          set({ queueSize: currentQueueSize });

          // Start periodic sync if tracking enabled
          const { isTrackingEnabled } = get();
          if (isTrackingEnabled) {
            // Sync immediately
            setTimeout(() => get().syncEvents(), 1000);
          }

          console.log('✅ Analytics Store initialized successfully');

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Error initializing Analytics Store:', errorMessage);
          
          set(state => ({ 
            lastError: errorMessage,
            syncErrors: [...state.syncErrors, errorMessage].slice(-10)
          }));
        }
      },

      /**
       * Cleanup the analytics store
       */
      cleanup: () => {
        console.log('🧹 Cleaning up Analytics Store');
        
        // Stop queue processor
        eventQueueService.stopQueueProcessor();
        
        // Clear state
        set({
          isSyncing: false,
          isQueueProcessing: false,
          lastError: null
        });
      }
    }),
    
    // ==================== PERSISTENCE CONFIG ====================
    {
      name: 'analytics-store',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Only persist specific fields
      partialize: (state) => ({
        isTrackingEnabled: state.isTrackingEnabled,
        lastSyncAt: state.lastSyncAt,
        syncErrors: state.syncErrors.slice(-5) // Keep only last 5 errors
      }),
      
      // Version for migration handling
      version: 1,
      
      // Rehydration handling
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('📦 Analytics Store rehydrated from storage');
          
          // Initialize after rehydration
          setTimeout(() => state.initialize(), 100);
        }
      }
    }
  )
);

// ==================== CONVENIENCE HOOKS ====================

/**
 * Hook for tracking events with automatic queuing
 */
export const useAnalyticsTracking = () => {
  const queueEvent = useAnalyticsStore(state => state.queueEvent);
  const isTrackingEnabled = useAnalyticsStore(state => state.isTrackingEnabled);
  
  return {
    trackEvent: queueEvent,
    isTrackingEnabled,
    
    // Convenience methods for specific events
    trackSignUp: (profileId: string, metadata?: any) => 
      queueEvent({
        profileId,
        type: 'USER_SIGNED_UP',
        module: 'AUTH',
        metadata
      }),
      
    trackKycSubmitted: (profileId: string, metadata?: any) =>
      queueEvent({
        profileId,
        type: 'USER_SUBMITTED_KYC',
        module: 'KYC',
        metadata
      }),
      
    trackKycUnderVerification: (profileId: string, metadata?: any) =>
      queueEvent({
        profileId,
        type: 'USER_KYC_UNDER_VERIFICATION',
        module: 'KYC',
        metadata
      }),
      
    trackKycApproved: (profileId: string, metadata?: any) =>
      queueEvent({
        profileId,
        type: 'USER_KYC_APPROVED',
        module: 'KYC',
        metadata
      }),
      
    trackKycRejected: (profileId: string, metadata?: any) =>
      queueEvent({
        profileId,
        type: 'USER_KYC_REJECTED',
        module: 'KYC',
        metadata
      })
  };
};

/**
 * Hook for analytics data access
 */
export const useAnalyticsData = () => {
  const state = useAnalyticsStore();
  
  return {
    userJourneyStats: state.userJourneyStats,
    userJourneyAnalytics: state.userJourneyAnalytics,
    eventTimeline: state.eventTimeline,
    isLoading: state.isSyncing,
    error: state.lastError,
    
    // Actions
    loadUserJourney: state.loadUserJourney,
    loadUserStats: state.loadUserStats,
    loadEventTimeline: state.loadEventTimeline,
    clearCache: state.clearCache,
    clearErrors: state.clearErrors
  };
};

/**
 * Hook for queue management
 */
export const useAnalyticsQueue = () => {
  const state = useAnalyticsStore();
  
  return {
    queueSize: state.queueSize,
    isProcessing: state.isQueueProcessing,
    lastSyncAt: state.lastSyncAt,
    errors: state.syncErrors,
    
    // Actions
    flushQueue: state.flushEventQueue,
    syncEvents: state.syncEvents,
    clearErrors: state.clearErrors
  };
}; 