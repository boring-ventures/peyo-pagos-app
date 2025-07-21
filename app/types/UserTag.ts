// User Tag System Types
export interface UserTag {
  tag: string;           // Format: "PY" + 6 digits (e.g., "PY001234")
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserTagGenerationOptions {
  maxAttempts?: number;
  prefix?: string;
  digitLength?: number;
}

export interface UserTagValidation {
  isValid: boolean;
  isUnique: boolean;
  error?: string;
}

export interface UserTagServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// User Tag formats and validation
export const USER_TAG_CONFIG = {
  PREFIX: 'PY',
  DIGIT_LENGTH: 6,
  MAX_ATTEMPTS: 3,
  PATTERN: /^PY\d{6}$/,
} as const;

export type UserTagFormat = `PY${string}`;
export type UserTagStatus = 'generating' | 'assigned' | 'error' | 'loading'; 