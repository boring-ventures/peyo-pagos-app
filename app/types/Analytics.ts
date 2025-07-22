// Events & Analytics System Types

// ==================== ENUMS ====================

export type EventType = 
  | 'USER_SIGNED_UP'
  | 'USER_SUBMITTED_KYC'
  | 'USER_KYC_UNDER_VERIFICATION'
  | 'USER_KYC_APPROVED'
  | 'USER_KYC_REJECTED';

export type EventModule = 
  | 'AUTH'
  | 'KYC' 
  | 'PROFILE';

// ==================== CORE INTERFACES ====================

export interface Event {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Event Information
  type: EventType;
  module: EventModule;
  description?: string;
  
  // User Reference
  profileId: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface CreateEventRequest {
  profileId: string;
  type: EventType;
  module: EventModule;
  description?: string;
  metadata?: Record<string, any>;
  timestamp?: Date; // Para eventos históricos
}

export interface QueuedEvent extends CreateEventRequest {
  id: string;
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
}

// ==================== METADATA TYPES ====================

export interface SignUpMetadata {
  email: string;
  signUpMethod: 'email' | 'phone';
  platform: 'ios' | 'android' | 'web';
  userAgent?: string;
}

export interface KycSubmittedMetadata {
  documentsCount: number;
  kycStep: string;
  timeToComplete: number; // seconds
  documentTypes: string[];
  hasProfilePhoto: boolean;
}

export interface KycVerificationMetadata {
  bridgeCustomerId: string;
  bridgeStatus: string;
  submittedAt: string;
  expectedProcessingTime?: number; // minutes
}

export interface KycApprovedMetadata {
  bridgeCustomerId: string;
  userTag: string;
  approvedAt: string;
  timeToApproval: number; // seconds from submission
  autoApproved: boolean;
}

export interface KycRejectedMetadata {
  bridgeCustomerId: string;
  rejectionReason: string;
  rejectedAt: string;
  timeToRejection: number; // seconds from submission
  canRetry: boolean;
  requiredActions?: string[];
}

// ==================== ANALYTICS INTERFACES ====================

export interface UserJourneyAnalytics {
  userId: string;
  signUpDate: string;
  kycSubmittedDate?: string;
  kycApprovedDate?: string;
  kycRejectedDate?: string;
  
  // Timing metrics
  timeToKycSubmission?: number; // minutes from sign up
  timeToKycDecision?: number; // minutes from submission
  
  // Status
  currentStage: JourneyStage;
  isComplete: boolean;
  hasErrors: boolean;
}

export interface JourneyStats {
  totalEvents: number;
  completedStages: JourneyStage[];
  timeSpentInStage: Record<JourneyStage, number>; // minutes
  conversionRate: number;
  averageCompletionTime: number; // days
}

export interface ConversionMetrics {
  signUps: number;
  kycSubmissions: number;
  kycApprovals: number;
  kycRejections: number;
  
  // Conversion rates
  signUpToKycRate: number;
  kycToApprovalRate: number;
  overallConversionRate: number;
  
  // Timing
  averageKycSubmissionTime: number; // minutes
  averageApprovalTime: number; // minutes
}

export interface EventTimeline {
  events: Event[];
  totalEvents: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stages: JourneyStageInfo[];
}

export interface JourneyStageInfo {
  stage: JourneyStage;
  completed: boolean;
  completedAt?: string;
  timeInStage?: number; // minutes
  nextStage?: JourneyStage;
}

// ==================== JOURNEY STAGES ====================

export type JourneyStage = 
  | 'signup'
  | 'kyc_submitted'
  | 'kyc_verification'
  | 'kyc_approved'
  | 'kyc_rejected';

export const JOURNEY_STAGE_CONFIG = {
  signup: {
    title: 'Registro Completado',
    description: 'Usuario registrado en la plataforma',
    icon: 'person-add',
    color: '#4CAF50'
  },
  kyc_submitted: {
    title: 'KYC Enviado',
    description: 'Documentos enviados para verificación',
    icon: 'document-text',
    color: '#2196F3'
  },
  kyc_verification: {
    title: 'En Verificación',
    description: 'Documentos siendo revisados',
    icon: 'hourglass',
    color: '#FF9800'
  },
  kyc_approved: {
    title: 'Verificado',
    description: 'Cuenta verificada exitosamente',
    icon: 'checkmark-circle',
    color: '#4CAF50'
  },
  kyc_rejected: {
    title: 'Rechazado',
    description: 'Verificación rechazada',
    icon: 'close-circle',
    color: '#F44336'
  }
} as const;

// ==================== SERVICE INTERFACES ====================

export interface EventServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessQueueResult {
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface AnalyticsError {
  type: 'event_creation' | 'queue_processing' | 'network' | 'database' | 'unknown';
  message: string;
  userId?: string;
  eventType?: EventType;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ==================== EVENT HELPERS ====================

export const EVENT_DESCRIPTIONS = {
  USER_SIGNED_UP: 'Usuario registrado en la plataforma',
  USER_SUBMITTED_KYC: 'Usuario envió información para verificación KYC',
  USER_KYC_UNDER_VERIFICATION: 'KYC del usuario en proceso de verificación',
  USER_KYC_APPROVED: 'KYC del usuario aprobado exitosamente',
  USER_KYC_REJECTED: 'KYC del usuario rechazado'
} as const;

export const EVENT_MODULE_CONFIG = {
  AUTH: {
    name: 'Autenticación',
    color: '#2196F3',
    icon: 'lock-closed'
  },
  KYC: {
    name: 'Verificación',
    color: '#FF9800',
    icon: 'shield-checkmark'
  },
  PROFILE: {
    name: 'Perfil',
    color: '#4CAF50',
    icon: 'person'
  }
} as const;

// ==================== VALIDATION ====================

export const ANALYTICS_CONFIG = {
  MAX_QUEUE_SIZE: 100,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
  BATCH_SIZE: 10,
  SYNC_INTERVAL_MS: 30000, // 30 seconds
  MAX_TIMELINE_EVENTS: 50
} as const;

// Type guards
export function isValidEventType(type: string): type is EventType {
  return ['USER_SIGNED_UP', 'USER_SUBMITTED_KYC', 'USER_KYC_UNDER_VERIFICATION', 'USER_KYC_APPROVED', 'USER_KYC_REJECTED'].includes(type);
}

export function isValidEventModule(module: string): module is EventModule {
  return ['AUTH', 'KYC', 'PROFILE'].includes(module);
}

export function isValidJourneyStage(stage: string): stage is JourneyStage {
  return ['signup', 'kyc_submitted', 'kyc_verification', 'kyc_approved', 'kyc_rejected'].includes(stage);
} 