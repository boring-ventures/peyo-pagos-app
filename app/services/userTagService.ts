import {
    USER_TAG_CONFIG,
    UserTagGenerationOptions,
    UserTagServiceResponse,
    UserTagValidation
} from '../types/UserTag';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * User Tag Service
 * Handles generation, validation, and assignment of unique user tags
 * Format: "PY" + 6 digits (e.g., "PY001234")
 */
export const userTagService = {
  /**
   * Generate a unique user tag with format "PY" + 6 digits
   */
  generateUniqueUserTag: async (options?: UserTagGenerationOptions): Promise<UserTagServiceResponse<string>> => {
    const maxAttempts = options?.maxAttempts || USER_TAG_CONFIG.MAX_ATTEMPTS;
    const prefix = options?.prefix || USER_TAG_CONFIG.PREFIX;
    const digitLength = options?.digitLength || USER_TAG_CONFIG.DIGIT_LENGTH;

    console.log('🏷️ Generating unique user tag...', { maxAttempts, prefix, digitLength });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🏷️ Generation attempt ${attempt}/${maxAttempts}`);

        // Generate random 6-digit number with leading zeros
        const randomDigits = Math.floor(Math.random() * Math.pow(10, digitLength))
          .toString()
          .padStart(digitLength, '0');
        
        const candidateTag = `${prefix}${randomDigits}`;
        
        console.log('🏷️ Generated candidate tag:', candidateTag);

        // Validate format
        if (!USER_TAG_CONFIG.PATTERN.test(candidateTag)) {
          console.error('❌ Invalid tag format:', candidateTag);
          continue;
        }

        // Check uniqueness against database
        const isUnique = await userTagService.validateTagUniqueness(candidateTag);
        
        if (isUnique) {
          console.log('✅ Unique user tag generated:', candidateTag);
          return {
            success: true,
            data: candidateTag
          };
        } else {
          console.log('⚠️ Tag collision detected, retrying:', candidateTag);
        }

      } catch (error) {
        console.error(`❌ Error in generation attempt ${attempt}:`, error);
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `Failed to generate unique tag after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    }

    return {
      success: false,
      error: `Failed to generate unique tag after ${maxAttempts} attempts - all generated tags were duplicates`
    };
  },

  /**
   * Validate tag uniqueness against Supabase profiles table
   */
  validateTagUniqueness: async (tag: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating tag uniqueness:', tag);

      // Check if tag already exists in profiles table
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_tag')
        .eq('user_tag', tag)
        .single();

      if (error) {
        // PGRST116 means no rows found, which is good (tag is unique)
        if (error.code === 'PGRST116') {
          console.log('✅ Tag is unique (no existing records):', tag);
          return true;
        }
        
        console.error('❌ Error validating tag uniqueness:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // If we get data, tag already exists
      if (data) {
        console.log('⚠️ Tag already exists:', tag);
        return false;
      }

      console.log('✅ Tag is unique:', tag);
      return true;

    } catch (error) {
      console.error('💥 Error in validateTagUniqueness:', error);
      throw error;
    }
  },

  /**
   * Assign user tag to a user in the profiles table
   */
  assignUserTag: async (userId: string, tag: string): Promise<UserTagServiceResponse<void>> => {
    try {
      console.log('🏷️ Assigning user tag:', { userId, tag });

      // Validate tag format
      const validation = userTagService.validateTagFormat(tag);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid tag format'
        };
      }

      // Double-check uniqueness before assignment
      const isUnique = await userTagService.validateTagUniqueness(tag);
      if (!isUnique) {
        return {
          success: false,
          error: 'Tag is not unique, cannot assign'
        };
      }

      // Update user's profile with the tag
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          user_tag: tag,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId);

      if (error) {
        console.error('❌ Error assigning user tag:', error);
        return {
          success: false,
          error: `Failed to assign tag: ${error.message}`
        };
      }

      console.log('✅ User tag assigned successfully:', { userId, tag });
      return { success: true };

    } catch (error) {
      console.error('💥 Error in assignUserTag:', error);
      return {
        success: false,
        error: `Assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Get user tag for a specific user
   */
  getUserTag: async (userId: string): Promise<UserTagServiceResponse<string | null>> => {
    try {
      console.log('🔍 Getting user tag for:', userId);

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_tag')
        .eq('userId', userId)
        .single();

      if (error) {
        console.error('❌ Error getting user tag:', error);
        return {
          success: false,
          error: `Failed to get user tag: ${error.message}`
        };
      }

      const userTag = data?.user_tag || null;
      console.log('✅ User tag retrieved:', userTag);

      return {
        success: true,
        data: userTag
      };

    } catch (error) {
      console.error('💥 Error in getUserTag:', error);
      return {
        success: false,
        error: `Failed to get user tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Generate user tag with retry mechanism (wrapper for convenience)
   */
  generateWithRetry: async (maxAttempts = USER_TAG_CONFIG.MAX_ATTEMPTS): Promise<UserTagServiceResponse<string>> => {
    return userTagService.generateUniqueUserTag({ maxAttempts });
  },

  /**
   * Validate tag format (client-side validation)
   */
  validateTagFormat: (tag: string): UserTagValidation => {
    if (!tag) {
      return {
        isValid: false,
        isUnique: false,
        error: 'Tag cannot be empty'
      };
    }

    if (!USER_TAG_CONFIG.PATTERN.test(tag)) {
      return {
        isValid: false,
        isUnique: false,
        error: `Tag must match format: ${USER_TAG_CONFIG.PREFIX} followed by ${USER_TAG_CONFIG.DIGIT_LENGTH} digits`
      };
    }

    return {
      isValid: true,
      isUnique: false // Will be checked separately
    };
  },

  /**
   * Generate and assign user tag in one operation
   */
  generateAndAssignUserTag: async (userId: string): Promise<UserTagServiceResponse<string>> => {
    try {
      console.log('🏷️ Generating and assigning user tag for:', userId);

      // Check if user already has a tag
      const existingTagResult = await userTagService.getUserTag(userId);
      if (existingTagResult.success && existingTagResult.data) {
        console.log('✅ User already has a tag:', existingTagResult.data);
        return {
          success: true,
          data: existingTagResult.data
        };
      }

      // Generate new unique tag
      const generationResult = await userTagService.generateUniqueUserTag();
      if (!generationResult.success || !generationResult.data) {
        return {
          success: false,
          error: generationResult.error || 'Failed to generate tag'
        };
      }

      // Assign the tag
      const assignmentResult = await userTagService.assignUserTag(userId, generationResult.data);
      if (!assignmentResult.success) {
        return {
          success: false,
          error: assignmentResult.error || 'Failed to assign tag'
        };
      }

      console.log('✅ User tag generated and assigned successfully:', generationResult.data);
      return {
        success: true,
        data: generationResult.data
      };

    } catch (error) {
      console.error('💥 Error in generateAndAssignUserTag:', error);
      return {
        success: false,
        error: `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}; 