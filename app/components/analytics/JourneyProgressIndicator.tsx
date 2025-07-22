import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import {
    JOURNEY_STAGE_CONFIG,
    JourneyStage,
    JourneyStageInfo
} from '@/app/types/Analytics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// ==================== COMPONENT PROPS ====================

export interface JourneyProgressIndicatorProps {
  currentStage: JourneyStage;
  stages?: JourneyStageInfo[];
  showEstimatedTime?: boolean;
  showStageNames?: boolean;
  showProgressBar?: boolean;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  onStagePress?: (stage: JourneyStage) => void;
}

// ==================== STAGE CONFIGURATION ====================

const STAGE_ORDER: JourneyStage[] = [
  'signup',
  'kyc_submitted', 
  'kyc_verification',
  'kyc_approved'
];

const ESTIMATED_TIMES = {
  signup: 2, // minutes
  kyc_submitted: 5, // minutes  
  kyc_verification: 10, // minutes
  kyc_approved: 0, // completed
  kyc_rejected: 0 // rejected
};

// ==================== MAIN COMPONENT ====================

export const JourneyProgressIndicator: React.FC<JourneyProgressIndicatorProps> = ({
  currentStage,
  stages,
  showEstimatedTime = true,
  showStageNames = true,
  showProgressBar = true,
  variant = 'horizontal',
  size = 'medium',
  onStagePress
}) => {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  // ==================== HELPER FUNCTIONS ====================

  const getCurrentStageIndex = (): number => {
    return STAGE_ORDER.indexOf(currentStage);
  };

  const getStageStatus = (stage: JourneyStage): 'completed' | 'current' | 'pending' | 'rejected' => {
    const currentIndex = getCurrentStageIndex();
    const stageIndex = STAGE_ORDER.indexOf(stage);
    
    // Check if we have specific stage info
    const stageInfo = stages?.find(s => s.stage === stage);
    
    // Handle rejection case
    if (currentStage === 'kyc_rejected') {
      if (stage === 'kyc_approved') return 'rejected';
      if (stageIndex <= STAGE_ORDER.indexOf('kyc_verification')) return 'completed';
      return 'pending';
    }
    
    // Use stage info if available
    if (stageInfo) {
      if (stageInfo.completed) {
        return stage === currentStage ? 'current' : 'completed';
      }
      return stage === currentStage ? 'current' : 'pending';
    }
    
    // Fallback to index-based logic
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStageColor = (stage: JourneyStage): string => {
    const status = getStageStatus(stage);
    const stageConfig = JOURNEY_STAGE_CONFIG[stage];
    
    switch (status) {
      case 'completed': return stageConfig?.color || '#4CAF50';
      case 'current': return tintColor;
      case 'rejected': return '#F44336';
      case 'pending': return borderColor;
      default: return borderColor;
    }
  };

  const getStageIcon = (stage: JourneyStage): string => {
    const status = getStageStatus(stage);
    const stageConfig = JOURNEY_STAGE_CONFIG[stage];
    
    if (status === 'completed') return 'checkmark-circle';
    if (status === 'rejected') return 'close-circle';
    if (status === 'current') return stageConfig?.icon || 'ellipse';
    
    return stageConfig?.icon || 'ellipse-outline';
  };

  const getProgressPercentage = (): number => {
    if (currentStage === 'kyc_rejected') {
      return (STAGE_ORDER.indexOf('kyc_verification') + 1) / STAGE_ORDER.length * 100;
    }
    
    const currentIndex = getCurrentStageIndex();
    return (currentIndex + 1) / STAGE_ORDER.length * 100;
  };

  const formatEstimatedTime = (stage: JourneyStage): string => {
    const stageInfo = stages?.find(s => s.stage === stage);
    
    if (stageInfo?.timeInStage) {
      const minutes = stageInfo.timeInStage;
      if (minutes < 60) return `${minutes}min`;
      const hours = Math.round(minutes / 60);
      return `${hours}h`;
    }
    
    const estimatedMinutes = ESTIMATED_TIMES[stage];
    if (estimatedMinutes === 0) return 'Completado';
    if (estimatedMinutes < 60) return `~${estimatedMinutes}min`;
    const hours = Math.round(estimatedMinutes / 60);
    return `~${hours}h`;
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 20,
          containerSize: 32,
          fontSize: 12,
          spacing: 8,
        };
      case 'large':
        return {
          iconSize: 32,
          containerSize: 56,
          fontSize: 16,
          spacing: 24,
        };
      case 'medium':
      default:
        return {
          iconSize: 24,
          containerSize: 40,
          fontSize: 14,
          spacing: 16,
        };
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderProgressBar = () => {
    if (!showProgressBar) return null;
    
    const progressPercentage = getProgressPercentage();
    
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarTrack, { backgroundColor: borderColor }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: currentStage === 'kyc_rejected' ? '#F44336' : tintColor,
                width: `${progressPercentage}%`
              }
            ]} 
          />
        </View>
        <ThemedText style={styles.progressText}>
          {Math.round(progressPercentage)}% completado
        </ThemedText>
      </View>
    );
  };

  const renderStageItem = (stage: JourneyStage, index: number) => {
    const stageConfig = JOURNEY_STAGE_CONFIG[stage];
    const status = getStageStatus(stage);
    const color = getStageColor(stage);
    const icon = getStageIcon(stage);
    const sizeConfig = getSizeConfig();
    const isLast = index === STAGE_ORDER.length - 1;

    const handlePress = () => {
      if (onStagePress) {
        onStagePress(stage);
      }
    };

    return (
      <View key={stage} style={[
        styles.stageItem,
        variant === 'vertical' && styles.stageItemVertical
      ]}>
        {/* Connection line */}
        {!isLast && (
          <View style={[
            styles.connectionLine,
            variant === 'vertical' ? styles.connectionLineVertical : styles.connectionLineHorizontal,
            { backgroundColor: borderColor }
          ]} />
        )}
        
        {/* Stage icon */}
        <ThemedView 
          style={[
            styles.stageIconContainer,
            {
              width: sizeConfig.containerSize,
              height: sizeConfig.containerSize,
              borderRadius: sizeConfig.containerSize / 2,
              backgroundColor: color,
              borderColor: color,
            },
            status === 'pending' && styles.stageIconPending,
            status === 'current' && styles.stageIconCurrent,
          ]}
          onTouchEnd={handlePress}
        >
          <Ionicons 
            name={icon as any} 
            size={sizeConfig.iconSize} 
            color={status === 'pending' ? color : 'white'} 
          />
        </ThemedView>
        
        {/* Stage info */}
        {showStageNames && (
          <View style={[
            styles.stageInfo,
            variant === 'vertical' && styles.stageInfoVertical,
            { marginTop: sizeConfig.spacing / 2 }
          ]}>
            <ThemedText style={[
              styles.stageTitle,
              { fontSize: sizeConfig.fontSize, color: status === 'current' ? tintColor : textColor }
            ]}>
              {stageConfig?.title || stage}
            </ThemedText>
            
            {showEstimatedTime && (
              <ThemedText style={[
                styles.stageTime,
                { fontSize: sizeConfig.fontSize - 2 }
              ]}>
                {formatEstimatedTime(stage)}
              </ThemedText>
            )}
            
            <ThemedText style={[
              styles.stageDescription,
              { fontSize: sizeConfig.fontSize - 2 }
            ]}>
              {stageConfig?.description || ''}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  const renderRejectionMessage = () => {
    if (currentStage !== 'kyc_rejected') return null;
    
    return (
      <ThemedView style={[styles.rejectionContainer, { borderColor: '#F44336' }]}>
        <Ionicons 
          name="warning" 
          size={24} 
          color="#F44336" 
          style={styles.rejectionIcon}
        />
        <View style={styles.rejectionContent}>
          <ThemedText style={[styles.rejectionTitle, { color: '#F44336' }]}>
            Verificación Rechazada
          </ThemedText>
          <ThemedText style={styles.rejectionDescription}>
            Tu solicitud de verificación KYC ha sido rechazada. Por favor, revisa los documentos enviados y vuelve a intentar.
          </ThemedText>
        </View>
      </ThemedView>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Progress bar */}
      {renderProgressBar()}
      
      {/* Stages */}
      <View style={[
        styles.stagesContainer,
        variant === 'vertical' && styles.stagesContainerVertical
      ]}>
        {STAGE_ORDER.map((stage, index) => renderStageItem(stage, index))}
      </View>
      
      {/* Rejection message */}
      {renderRejectionMessage()}
    </ThemedView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  
  // Progress bar
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  
  // Stages container
  stagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stagesContainerVertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  
  // Stage item
  stageItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stageItemVertical: {
    flexDirection: 'row',
    flex: 0,
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
  },
  
  // Connection line
  connectionLine: {
    position: 'absolute',
    backgroundColor: '#E0E0E0',
  },
  connectionLineHorizontal: {
    top: 20,
    right: -50,
    left: 50,
    height: 2,
  },
  connectionLineVertical: {
    left: 20,
    top: 40,
    bottom: -24,
    width: 2,
  },
  
  // Stage icon
  stageIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  stageIconPending: {
    backgroundColor: 'transparent',
  },
  stageIconCurrent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Stage info
  stageInfo: {
    alignItems: 'center',
    maxWidth: 120,
  },
  stageInfoVertical: {
    alignItems: 'flex-start',
    marginLeft: 16,
    flex: 1,
    maxWidth: undefined,
  },
  stageTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  stageTime: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 2,
  },
  stageDescription: {
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Rejection
  rejectionContainer: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  rejectionIcon: {
    marginRight: 12,
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
}); 