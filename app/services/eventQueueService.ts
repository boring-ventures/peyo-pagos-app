import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
    ANALYTICS_CONFIG,
    CreateEventRequest,
    ProcessQueueResult,
    QueuedEvent
} from '../types/Analytics';
import { eventService } from './eventService';

/**
 * Event Queue Service
 * Handles offline event queuing and retry logic for analytics events
 * Ensures no events are lost even with poor connectivity
 */
export const eventQueueService = {
  // Storage keys
  QUEUE_STORAGE_KEY: 'analytics_event_queue',
  FAILED_EVENTS_KEY: 'analytics_failed_events',
  
  // In-memory queue for performance
  _inMemoryQueue: [] as QueuedEvent[],
  _isProcessing: false,
  _isOnline: true,
  _processInterval: null as ReturnType<typeof setInterval> | null,

  /**
   * Initialize the queue service
   */
  initialize: async (): Promise<void> => {
    try {
      console.log('📊 Initializing event queue service...');

      // Load persisted queue from storage
      await eventQueueService.loadPersistedQueue();

      // Setup network monitoring
      await eventQueueService.setupNetworkMonitoring();

      // Start automatic queue processing
      eventQueueService.startQueueProcessor();

      console.log('✅ Event queue service initialized successfully');

    } catch (error) {
      console.error('💥 Error initializing event queue service:', error);
    }
  },

  /**
   * Add event to queue
   */
  addToQueue: async (event: CreateEventRequest): Promise<void> => {
    try {
      const queuedEvent: QueuedEvent = {
        ...event,
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        attempts: 0,
        lastAttemptAt: undefined,
        error: undefined
      };

      console.log('📊 Adding event to queue:', queuedEvent.id);

      // Add to in-memory queue
      eventQueueService._inMemoryQueue.push(queuedEvent);

      // Persist to storage
      await eventQueueService.persistQueue();

      // Try to process immediately if online
      if (eventQueueService._isOnline && !eventQueueService._isProcessing) {
        eventQueueService.processQueue();
      }

      console.log(`✅ Event queued. Queue size: ${eventQueueService._inMemoryQueue.length}`);

    } catch (error) {
      console.error('💥 Error adding event to queue:', error);
    }
  },

  /**
   * Process the event queue
   */
  processQueue: async (): Promise<ProcessQueueResult> => {
    if (eventQueueService._isProcessing) {
      console.log('⚠️ Queue is already being processed');
      return { processed: 0, successful: 0, failed: 0, errors: [] };
    }

    eventQueueService._isProcessing = true;
    
    try {
      console.log(`📊 Processing event queue. Queue size: ${eventQueueService._inMemoryQueue.length}`);

      if (eventQueueService._inMemoryQueue.length === 0) {
        return { processed: 0, successful: 0, failed: 0, errors: [] };
      }

      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log('📡 No network connection, skipping queue processing');
        return { processed: 0, successful: 0, failed: 0, errors: ['No network connection'] };
      }

      let processed = 0;
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process events in batches
      const batchSize = Math.min(ANALYTICS_CONFIG.BATCH_SIZE, eventQueueService._inMemoryQueue.length);
      const batch = eventQueueService._inMemoryQueue.slice(0, batchSize);

      for (const queuedEvent of batch) {
        processed++;

        try {
          // Increment attempt counter
          queuedEvent.attempts++;
          queuedEvent.lastAttemptAt = new Date();

          console.log(`📊 Processing queued event ${queuedEvent.id} (attempt ${queuedEvent.attempts})`);

          // Try to create the event
          const result = await eventService.createEvent({
            profileId: queuedEvent.profileId,
            type: queuedEvent.type,
            module: queuedEvent.module,
            description: queuedEvent.description,
            metadata: queuedEvent.metadata,
            timestamp: queuedEvent.timestamp
          });

          if (result.success) {
            console.log(`✅ Successfully processed queued event ${queuedEvent.id}`);
            successful++;
            
            // Remove from queue
            eventQueueService._inMemoryQueue = eventQueueService._inMemoryQueue.filter(e => e.id !== queuedEvent.id);
          } else {
            console.error(`❌ Failed to process queued event ${queuedEvent.id}:`, result.error);
            failed++;
            queuedEvent.error = result.error;
            errors.push(`${queuedEvent.id}: ${result.error}`);

            // Remove if exceeded max attempts
            if (queuedEvent.attempts >= ANALYTICS_CONFIG.MAX_RETRY_ATTEMPTS) {
              console.log(`🗑️ Removing failed event ${queuedEvent.id} after ${queuedEvent.attempts} attempts`);
              eventQueueService._inMemoryQueue = eventQueueService._inMemoryQueue.filter(e => e.id !== queuedEvent.id);
              
              // Save to failed events for debugging
              await eventQueueService.saveFailedEvent(queuedEvent);
            }
          }

        } catch (error) {
          console.error(`💥 Error processing queued event ${queuedEvent.id}:`, error);
          failed++;
          queuedEvent.error = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${queuedEvent.id}: ${queuedEvent.error}`);

          // Remove if exceeded max attempts
          if (queuedEvent.attempts >= ANALYTICS_CONFIG.MAX_RETRY_ATTEMPTS) {
            eventQueueService._inMemoryQueue = eventQueueService._inMemoryQueue.filter(e => e.id !== queuedEvent.id);
            await eventQueueService.saveFailedEvent(queuedEvent);
          }
        }

        // Small delay between processing to avoid overwhelming the server
        if (processed < batch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Persist updated queue
      await eventQueueService.persistQueue();

      const result: ProcessQueueResult = { processed, successful, failed, errors };
      console.log('📊 Queue processing completed:', result);
      
      return result;

    } catch (error) {
      console.error('💥 Error processing queue:', error);
      return { 
        processed: 0, 
        successful: 0, 
        failed: 1, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    } finally {
      eventQueueService._isProcessing = false;
    }
  },

  /**
   * Clear the entire queue
   */
  clearQueue: async (): Promise<void> => {
    try {
      console.log('🧹 Clearing event queue');
      
      eventQueueService._inMemoryQueue = [];
      await AsyncStorage.removeItem(eventQueueService.QUEUE_STORAGE_KEY);
      
      console.log('✅ Event queue cleared');

    } catch (error) {
      console.error('💥 Error clearing queue:', error);
    }
  },

  /**
   * Get current queue size
   */
  getQueueSize: (): number => {
    return eventQueueService._inMemoryQueue.length;
  },

  /**
   * Retry failed events
   */
  retryFailedEvents: async (): Promise<ProcessQueueResult> => {
    try {
      console.log('🔄 Retrying failed events');

      // Reset attempts for events that haven't exceeded max attempts
      eventQueueService._inMemoryQueue.forEach(event => {
        if (event.error && event.attempts < ANALYTICS_CONFIG.MAX_RETRY_ATTEMPTS) {
          event.attempts = 0;
          event.error = undefined;
        }
      });

      return await eventQueueService.processQueue();

    } catch (error) {
      console.error('💥 Error retrying failed events:', error);
      return { processed: 0, successful: 0, failed: 1, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  },

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring: async (): Promise<void> => {
    try {
      // Check initial network state
      const networkState = await NetInfo.fetch();
      eventQueueService._isOnline = networkState.isConnected || false;

             // Listen for network changes
       NetInfo.addEventListener((state: NetInfoState) => {
         const wasOnline = eventQueueService._isOnline;
         eventQueueService._isOnline = state.isConnected || false;

        console.log(`📡 Network status changed: ${wasOnline ? 'online' : 'offline'} → ${eventQueueService._isOnline ? 'online' : 'offline'}`);

        // Process queue when coming back online
        if (!wasOnline && eventQueueService._isOnline && eventQueueService._inMemoryQueue.length > 0) {
          console.log('📡 Back online, processing queued events');
          setTimeout(() => eventQueueService.processQueue(), 1000);
        }
      });

      console.log(`📡 Network monitoring setup. Current status: ${eventQueueService._isOnline ? 'online' : 'offline'}`);

    } catch (error) {
      console.error('💥 Error setting up network monitoring:', error);
    }
  },

  /**
   * Start automatic queue processor
   */
  startQueueProcessor: (): void => {
    // Clear existing interval
    if (eventQueueService._processInterval) {
      clearInterval(eventQueueService._processInterval);
    }

    // Start new interval
    eventQueueService._processInterval = setInterval(() => {
      if (eventQueueService._isOnline && 
          eventQueueService._inMemoryQueue.length > 0 && 
          !eventQueueService._isProcessing) {
        eventQueueService.processQueue();
      }
    }, ANALYTICS_CONFIG.SYNC_INTERVAL_MS);

    console.log(`⏰ Queue processor started (interval: ${ANALYTICS_CONFIG.SYNC_INTERVAL_MS}ms)`);
  },

  /**
   * Stop automatic queue processor
   */
  stopQueueProcessor: (): void => {
    if (eventQueueService._processInterval) {
      clearInterval(eventQueueService._processInterval);
      eventQueueService._processInterval = null;
      console.log('⏰ Queue processor stopped');
    }
  },

  /**
   * Load persisted queue from storage
   */
  loadPersistedQueue: async (): Promise<void> => {
    try {
      const storedQueue = await AsyncStorage.getItem(eventQueueService.QUEUE_STORAGE_KEY);
      
      if (storedQueue) {
        eventQueueService._inMemoryQueue = JSON.parse(storedQueue);
        console.log(`📦 Loaded ${eventQueueService._inMemoryQueue.length} events from persisted queue`);
      } else {
        eventQueueService._inMemoryQueue = [];
        console.log('📦 No persisted queue found, starting with empty queue');
      }

    } catch (error) {
      console.error('💥 Error loading persisted queue:', error);
      eventQueueService._inMemoryQueue = [];
    }
  },

  /**
   * Persist queue to storage
   */
  persistQueue: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        eventQueueService.QUEUE_STORAGE_KEY, 
        JSON.stringify(eventQueueService._inMemoryQueue)
      );
    } catch (error) {
      console.error('💥 Error persisting queue:', error);
    }
  },

  /**
   * Save failed event for debugging
   */
  saveFailedEvent: async (event: QueuedEvent): Promise<void> => {
    try {
      const existingFailedEvents = await AsyncStorage.getItem(eventQueueService.FAILED_EVENTS_KEY);
      const failedEvents = existingFailedEvents ? JSON.parse(existingFailedEvents) : [];
      
      failedEvents.push({
        ...event,
        failedAt: new Date().toISOString()
      });

      // Keep only last 50 failed events to prevent storage bloat
      if (failedEvents.length > 50) {
        failedEvents.splice(0, failedEvents.length - 50);
      }

      await AsyncStorage.setItem(eventQueueService.FAILED_EVENTS_KEY, JSON.stringify(failedEvents));
      console.log(`💾 Saved failed event ${event.id} for debugging`);

    } catch (error) {
      console.error('💥 Error saving failed event:', error);
    }
  },

  /**
   * Get failed events for debugging
   */
  getFailedEvents: async (): Promise<QueuedEvent[]> => {
    try {
      const storedFailedEvents = await AsyncStorage.getItem(eventQueueService.FAILED_EVENTS_KEY);
      return storedFailedEvents ? JSON.parse(storedFailedEvents) : [];
    } catch (error) {
      console.error('💥 Error getting failed events:', error);
      return [];
    }
  },

  /**
   * Network status change handler
   */
  onNetworkStatusChange: (isConnected: boolean): void => {
    const wasOnline = eventQueueService._isOnline;
    eventQueueService._isOnline = isConnected;

    if (!wasOnline && isConnected && eventQueueService._inMemoryQueue.length > 0) {
      console.log('📡 Network reconnected, processing queue');
      setTimeout(() => eventQueueService.processQueue(), 1000);
    }
  }
}; 