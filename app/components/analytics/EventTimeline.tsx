import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useAnalyticsData } from '@/app/store/analyticsStore';
import {
    Event,
    EVENT_MODULE_CONFIG
} from '@/app/types/Analytics';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

// ==================== COMPONENT PROPS ====================

export interface EventTimelineProps {
  userId: string;
  maxEvents?: number;
  showMetadata?: boolean;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  onEventPress?: (event: Event) => void;
}

// ==================== MAIN COMPONENT ====================

export const EventTimeline: React.FC<EventTimelineProps> = ({
  userId,
  maxEvents = 50,
  showMetadata = false,
  autoRefresh = false,
  refreshIntervalMs = 30000,
  onEventPress
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  
  // Analytics data
  const { 
    eventTimeline, 
    isLoading, 
    error, 
    loadEventTimeline, 
    clearErrors 
  } = useAnalyticsData();

  // ==================== EFFECTS ====================

  // Load timeline on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadEventTimeline(userId);
      setLastRefresh(new Date());
    }
  }, [userId, loadEventTimeline]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      console.log('📊 Auto-refreshing event timeline...');
      loadEventTimeline(userId);
      setLastRefresh(new Date());
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefresh, userId, refreshIntervalMs, loadEventTimeline]);

  // ==================== HANDLERS ====================

  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearErrors();
    await loadEventTimeline(userId);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleEventPress = (event: Event) => {
    console.log('📊 Event pressed:', event.type);
    if (onEventPress) {
      onEventPress(event);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEventIcon = (event: Event): string => {
    const moduleConfig = EVENT_MODULE_CONFIG[event.module];
    if (moduleConfig?.icon) return moduleConfig.icon;

    // Fallback icons based on event type
    switch (event.type) {
      case 'USER_SIGNED_UP': return 'person-add';
      case 'USER_SUBMITTED_KYC': return 'document-text';
      case 'USER_KYC_UNDER_VERIFICATION': return 'hourglass';
      case 'USER_KYC_APPROVED': return 'checkmark-circle';
      case 'USER_KYC_REJECTED': return 'close-circle';
      default: return 'ellipse';
    }
  };

  const getEventColor = (event: Event): string => {
    const moduleConfig = EVENT_MODULE_CONFIG[event.module];
    if (moduleConfig?.color) return moduleConfig.color;

    // Fallback colors based on event type
    switch (event.type) {
      case 'USER_SIGNED_UP': return '#4CAF50';
      case 'USER_SUBMITTED_KYC': return '#2196F3';
      case 'USER_KYC_UNDER_VERIFICATION': return '#FF9800';
      case 'USER_KYC_APPROVED': return '#4CAF50';
      case 'USER_KYC_REJECTED': return '#F44336';
      default: return tintColor;
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <Ionicons 
        name="analytics-outline" 
        size={64} 
        color={tintColor} 
        style={styles.emptyIcon}
      />
      <ThemedText style={styles.emptyTitle}>
        No hay eventos aún
      </ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Los eventos del usuario aparecerán aquí conforme vaya completando acciones en la aplicación.
      </ThemedText>
    </ThemedView>
  );

  const renderErrorState = () => (
    <ThemedView style={styles.errorContainer}>
      <Ionicons 
        name="warning-outline" 
        size={48} 
        color="#F44336" 
        style={styles.errorIcon}
      />
      <ThemedText style={styles.errorTitle}>
        Error al cargar eventos
      </ThemedText>
      <ThemedText style={styles.errorDescription}>
        {error}
      </ThemedText>
      <ThemedView 
        style={[styles.retryButton, { borderColor: tintColor }]}
        onTouchEnd={handleRefresh}
      >
        <ThemedText style={[styles.retryButtonText, { color: tintColor }]}>
          Reintentar
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );

  const renderEventItem = (event: Event, index: number) => {
    const isLast = index === (eventTimeline?.events.length || 0) - 1;
    const eventColor = getEventColor(event);
    const iconName = getEventIcon(event);

    return (
      <ThemedView key={event.id} style={styles.eventItem}>
        {/* Timeline line */}
        {!isLast && (
          <View 
            style={[
              styles.timelineLine, 
              { backgroundColor: borderColor }
            ]} 
          />
        )}
        
        {/* Event icon */}
        <View style={[styles.eventIconContainer, { backgroundColor: eventColor }]}>
          <Ionicons 
            name={iconName as any} 
            size={20} 
            color="white" 
          />
        </View>
        
        {/* Event content */}
        <ThemedView 
          style={[styles.eventContent, { borderColor }]}
          onTouchEnd={() => handleEventPress(event)}
        >
          <View style={styles.eventHeader}>
            <ThemedText style={styles.eventTitle}>
              {event.description || event.type}
            </ThemedText>
            <ThemedText style={styles.eventTime}>
              {formatDate(event.createdAt)}
            </ThemedText>
          </View>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventModule}>
              <View 
                style={[
                  styles.moduleIndicator, 
                  { backgroundColor: eventColor }
                ]} 
              />
              <ThemedText style={styles.moduleText}>
                {EVENT_MODULE_CONFIG[event.module]?.name || event.module}
              </ThemedText>
            </View>
          </View>

          {/* Metadata display */}
          {showMetadata && event.metadata && (
            <View style={styles.metadataContainer}>
              <ThemedText style={styles.metadataTitle}>
                Detalles:
              </ThemedText>
              {Object.entries(event.metadata).map(([key, value]) => (
                <View key={key} style={styles.metadataItem}>
                  <ThemedText style={styles.metadataKey}>
                    {key}:
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <ThemedText style={styles.headerTitle}>
          Timeline de Eventos
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {eventTimeline?.totalEvents || 0} eventos registrados
        </ThemedText>
      </View>
      
      {lastRefresh && (
        <ThemedText style={styles.lastRefreshText}>
          Última actualización: {formatDate(lastRefresh.toISOString())}
        </ThemedText>
      )}
    </View>
  );

  // ==================== MAIN RENDER ====================

  if (isLoading && !eventTimeline) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons 
          name="hourglass-outline" 
          size={48} 
          color={tintColor} 
          style={styles.loadingIcon}
        />
        <ThemedText style={styles.loadingText}>
          Cargando eventos...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error && !eventTimeline) {
    return renderErrorState();
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
      >
        {renderHeader()}
        
        {!eventTimeline?.events || eventTimeline.events.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.timelineContainer}>
            {eventTimeline.events
              .slice(0, maxEvents)
              .map((event, index) => renderEventItem(event, index))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  
  // Header
  headerContainer: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastRefreshText: {
    fontSize: 12,
    opacity: 0.5,
  },
  
  // Timeline
  timelineContainer: {
    flex: 1,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: -16,
    width: 2,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  eventContent: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventModule: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  moduleText: {
    fontSize: 12,
    opacity: 0.8,
  },
  
  // Metadata
  metadataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metadataTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metadataKey: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 6,
    opacity: 0.7,
  },
  metadataValue: {
    fontSize: 11,
    flex: 1,
    opacity: 0.8,
  },
  
  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 