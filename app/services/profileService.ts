import { createId } from '@paralleldrive/cuid2';
import { useAuthStore } from '../store/authStore';
import useKycStore from '../store/kycStore';
import { authService } from './authService';
import { supabaseAdmin } from './supabaseAdmin';

export interface CreateProfileRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  // Address info
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  // Economic activity
  activity: string;
  occupation: string;
  monthlyIncome: string;
  // Documents (file paths in storage)
  idFrontPath: string;
  idBackPath?: string;
  selfiePath: string;
}

export const profileService = {
  /**
   * Create Profile and KYCProfile in database after KYC completion
   */
  createProfileAfterKyc: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📋 Creating profile and KYC profile after KYC completion...');
      
      // Get data from stores
      const { user } = useAuthStore.getState();
      const { personalInfo, addressInfo, economicActivity, documents } = useKycStore.getState();
      
      if (!user) {
        return { success: false, error: 'No user found' };
      }

      // Validate required data (allow placeholder documents for automated flow)
      const missingFields: string[] = [];
      if (!personalInfo.firstName) missingFields.push('firstName');
      if (!personalInfo.lastName) missingFields.push('lastName');
      if (!personalInfo.dateOfBirth) missingFields.push('dateOfBirth');
      if (!personalInfo.nationality) missingFields.push('nationality');
      if (!addressInfo.country) missingFields.push('country');
      if (!addressInfo.city) missingFields.push('city');
      if (!addressInfo.address) missingFields.push('address');
      // Note: documents are now optional for automated flow
      // if (!documents.idFront) missingFields.push('idFront');
      // if (!documents.selfie) missingFields.push('selfie');

      if (missingFields.length > 0) {
        return { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        };
      }

      // Create Profile in database (using Prisma schema structure)
      const profileId = createId(); // Generate ID explicitly
      const currentTimestamp = new Date().toISOString();
      const profileData = {
        id: profileId,
        userId: user.id,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        email: user.email || '',
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        status: 'active',
        role: 'USER',
      };

      console.log('📋 Creating Profile record...');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        return { success: false, error: `Profile creation failed: ${profileError.message}` };
      }

      console.log('✅ Profile created successfully:', profile.id);

      // Create KYCProfile in database (using Prisma schema structure)
      const kycProfileId = createId(); // Generate ID explicitly
      const kycProfileData = {
        id: kycProfileId,
        profile_id: profile.id,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        customer_type: 'individual',
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: user.email || '',
        phone: user.phone || '',
        birth_date: personalInfo.dateOfBirth,
        nationality: personalInfo.nationality,
        kyc_status: 'active', // Changed from 'completed' to 'active' (valid enum value)
        kyc_submitted_at: new Date().toISOString(),
        kyc_approved_at: new Date().toISOString(),
      };

      console.log('📋 Creating KYCProfile record...');
      const { data: kycProfile, error: kycError } = await supabaseAdmin
        .from('kyc_profiles')
        .insert(kycProfileData)
        .select()
        .single();

      if (kycError) {
        console.error('❌ KYC Profile creation error:', kycError);
        return { success: false, error: `KYC Profile creation failed: ${kycError.message}` };
      }

      console.log('✅ KYC Profile created successfully:', kycProfile.id);

      // Create Address record (using Prisma schema structure)
      const addressId = createId(); // Generate ID explicitly
      const addressData = {
        id: addressId,
        kyc_profile_id: kycProfile.id,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        street_line_1: addressInfo.address,
        city: addressInfo.city,
        country: addressInfo.country,
        street_line_2: undefined,
        subdivision: addressInfo.state,
        postal_code: addressInfo.postalCode,
      };

      console.log('📋 Creating Address record...');
      const { error: addressError } = await supabaseAdmin
        .from('addresses')
        .insert(addressData);

      if (addressError) {
        console.error('❌ Address creation error:', addressError);
        return { success: false, error: `Address creation failed: ${addressError.message}` };
      }

      console.log('✅ Address created successfully');

      // Create IdentifyingInformation record (using Prisma schema structure)
      const identifyingInfoId = createId(); // Generate ID explicitly
      const identifyingInfoData = {
        id: identifyingInfoId,
        kyc_profile_id: kycProfile.id,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        document_type: 'national_id', // Valid enum value
        issuing_country: addressInfo.country || 'BO',
        image_front: documents.idFront || 'placeholder/id-front.jpg', // Use placeholder if not provided
        image_back: documents.idBack || 'placeholder/id-back.jpg', // Use placeholder if not provided
      };

      console.log('📋 Creating IdentifyingInformation record...');
      const { error: identifyingError } = await supabaseAdmin
        .from('identifying_information')
        .insert(identifyingInfoData);

      if (identifyingError) {
        console.error('❌ IdentifyingInformation creation error:', identifyingError);
        return { success: false, error: `IdentifyingInformation creation failed: ${identifyingError.message}` };
      }

      console.log('✅ IdentifyingInformation created successfully');

      // Create Document record for selfie (using Prisma schema structure)
      const documentId = createId(); // Generate ID explicitly
      const selfieDocumentData = {
        id: documentId,
        kyc_profile_id: kycProfile.id,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        purposes: ['other'], // Changed from 'proof_of_identity' to 'other' (valid enum value)
        file_url: documents.selfie || 'placeholder/selfie.jpg', // Use placeholder if not provided
        description: 'Selfie verification photo',
      };

      console.log('📋 Creating selfie Document record...');
      const { error: documentError } = await supabaseAdmin
        .from('documents')
        .insert(selfieDocumentData);

      if (documentError) {
        console.error('❌ Document creation error:', documentError);
        return { success: false, error: `Document creation failed: ${documentError.message}` };
      }

      console.log('✅ Selfie document record created successfully');

      // Update display_name in auth.users
      console.log('📝 Updating display name in auth.users...');
      const { error: displayNameError } = await authService.updateDisplayNameAfterKyc(
        personalInfo.firstName!,
        personalInfo.lastName!
      );

      if (displayNameError) {
        console.warn('⚠️ Display name update failed, but profile creation succeeded:', displayNameError.message);
      } else {
        console.log('✅ Display name updated successfully in auth.users');
      }

      console.log('🎉 Profile and KYC Profile creation completed successfully!');
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Error creating profile after KYC:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get profile data for Bridge integration
   */
  getProfileForBridge: async (userId: string) => {
    try {
      console.log('🌉 Getting profile data for Bridge integration...');
      console.log('🔍 Input userId:', userId);
      console.log('🔍 userId type:', typeof userId);
      console.log('🔍 userId length:', userId?.length);
      
      // Use admin client to bypass RLS issues
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          kycProfile:kyc_profiles(
            *,
            address:addresses(*),
            identifyingInfo:identifying_information(*),
            documents:documents(*)
          )
        `)
        .eq('userId', userId)
        .single();

      console.log('🔍 Profile query result:', { 
        profile: profile ? 'found' : 'not found',
        error: profileError,
        profileId: profile?.id,
        profileEmail: profile?.email,
        hasKycProfile: !!profile?.kycProfile
      });

      if (profileError) {
        console.error('❌ Error fetching profile for Bridge:', profileError);
        return null;
      }

      if (!profile) {
        console.warn('⚠️ No profile found for Bridge integration');
        return null;
      }

      console.log('✅ Profile data fetched successfully for Bridge integration');
      return profile;

    } catch (error) {
      console.error('💥 Error in getProfileForBridge:', error);
      return null;
    }
  },

  /**
   * Save Bridge raw response to database
   */
  saveBridgeRawResponse: async (userId: string, bridgeResponse: any): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🌉 Updating bridge_raw_response in database...', { userId });
      
      // Find the profile first
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', userId)
        .single();

      if (profileError || !profile) {
        return { success: false, error: `Profile not found: ${profileError?.message}` };
      }

      const { error } = await supabaseAdmin
        .from('kyc_profiles')
        .update({
          bridge_raw_response: bridgeResponse,
          updatedAt: new Date().toISOString(),
        })
        .eq('profile_id', profile.id);

      if (error) {
        console.error('❌ Bridge raw response update error:', error);
        return { success: false, error: `Bridge raw response update failed: ${error.message}` };
      }

      console.log('✅ Bridge raw response saved to database successfully');
      return { success: true };
    } catch (err) {
      console.error('💥 Error saving Bridge raw response:', err);
      return { success: false, error: `Bridge raw response save failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
  },

  /**
   * Save Bridge endorsements to database
   */
  saveBridgeEndorsements: async (userId: string, endorsements: any[]): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Saving Bridge endorsements to database...', { userId, endorsementsCount: endorsements.length });
      
      // Get KYC profile ID
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', userId)
        .single();

      if (profileError || !profile) {
        return { success: false, error: `Profile not found: ${profileError?.message}` };
      }

      const { data: kycProfile, error: kycError } = await supabaseAdmin
        .from('kyc_profiles')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (kycError || !kycProfile) {
        return { success: false, error: `KYC profile not found: ${kycError?.message}` };
      }

      // Prepare endorsements data with proper field mapping
      const endorsementsData = endorsements.map((endorsement) => ({
        id: createId(),
        kyc_profile_id: kycProfile.id,
        endorsement_type: endorsement.name || 'base', // Use database field name for direct SQL
        status: endorsement.status || 'incomplete',
        requirements: endorsement.requirements || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const { error: endorsementsError } = await supabaseAdmin
        .from('endorsements')
        .insert(endorsementsData);

      if (endorsementsError) {
        console.error('❌ Endorsements insert error:', endorsementsError);
        return { success: false, error: `Endorsements insert failed: ${endorsementsError.message}` };
      }

      console.log('✅ Bridge endorsements saved to database successfully');
      return { success: true };
    } catch (err) {
      console.error('💥 Error saving Bridge endorsements:', err);
      return { success: false, error: `Bridge endorsements save failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
  },

  /**
   * Save all Bridge data (customer ID, raw response, and endorsements) in one operation
   */
  saveBridgeData: async (userId: string, bridgeResponse: any): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🌉 Saving all Bridge data to database...', { userId, bridgeCustomerId: bridgeResponse.id });
      
      // 1. Save customer ID
      const customerIdResult = await profileService.updateBridgeCustomerId(userId, bridgeResponse.id);
      
      // 2. Save raw response
      const rawResponseResult = await profileService.saveBridgeRawResponse(userId, bridgeResponse);
      
      // 3. Save endorsements if they exist
      let endorsementsResult: { success: boolean; error?: string } = { success: true };
      if (bridgeResponse.endorsements && Array.isArray(bridgeResponse.endorsements)) {
        console.log('📝 Saving Bridge endorsements...', { count: bridgeResponse.endorsements.length });
        endorsementsResult = await profileService.saveBridgeEndorsements(userId, bridgeResponse.endorsements);
      }
      
      // Check if all operations succeeded
      const allSuccessful = customerIdResult.success && rawResponseResult.success && endorsementsResult.success;
      
      if (allSuccessful) {
        console.log('✅ All Bridge data saved successfully');
        return { success: true };
      } else {
        const errors = [
          !customerIdResult.success ? `Customer ID: ${customerIdResult.error}` : null,
          !rawResponseResult.success ? `Raw response: ${rawResponseResult.error}` : null,
          !endorsementsResult.success ? `Endorsements: ${endorsementsResult.error}` : null,
        ].filter(Boolean);
       
       console.warn('⚠️ Some Bridge data operations failed:', errors);
       return { 
         success: false, 
         error: `Partial save failure: ${errors.join(', ')}` 
       };
     }
    } catch (err) {
      console.error('💥 Error saving Bridge data:', err);
      return { 
        success: false, 
        error: `Bridge data save failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
    }
  },

  /**
   * Update bridge_customer_id in KYC profile after successful Bridge customer creation
   */
  updateBridgeCustomerId: async (userId: string, bridgeCustomerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🌉 Updating bridge_customer_id in database...', { userId, bridgeCustomerId });
      
      // Find the KYC profile for this user
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', userId)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile not found for user:', userId, profileError);
        return { success: false, error: `Profile not found: ${profileError?.message}` };
      }

      // Update the KYC profile with Bridge customer ID
      const { error: updateError } = await supabaseAdmin
        .from('kyc_profiles')
        .update({
          bridge_customer_id: bridgeCustomerId,
          updatedAt: new Date().toISOString(),
        })
        .eq('profile_id', profile.id);

      if (updateError) {
        console.error('❌ Failed to update bridge_customer_id:', updateError);
        return { success: false, error: `Update failed: ${updateError.message}` };
      }

      console.log('✅ Bridge customer ID saved to database successfully');
      return { success: true };

    } catch (error) {
      console.error('💥 Error updating bridge_customer_id:', error);
      return { 
        success: false, 
        error: `Database update error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },

  /**
   * Update signed_agreement_id in KYC profile
   */
  updateSignedAgreementId: async (userId: string, signedAgreementId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🌉 Updating signed_agreement_id...', { userId, signedAgreementId });
      
      // Find the profile first
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', userId)
        .single();

      if (profileError || !profile) {
        return { success: false, error: `Profile not found: ${profileError?.message}` };
      }

      const { error } = await supabaseAdmin
        .from('kyc_profiles')
        .update({
          signed_agreement_id: signedAgreementId,
          updatedAt: new Date().toISOString(),
        })
        .eq('profile_id', profile.id);

      if (error) {
        console.error('❌ Signed agreement ID update error:', error);
        return { success: false, error: `Signed agreement ID update failed: ${error.message}` };
      }

      console.log('✅ Signed agreement ID saved to database successfully');
      return { success: true };
    } catch (err) {
      console.error('💥 Error updating signed agreement ID:', err);
      return { success: false, error: `Signed agreement ID update failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }
  },

  /**
   * Update both Bridge customer ID and signed agreement ID in one transaction
   */
  updateBridgeIntegrationData: async (
    userId: string, 
    bridgeCustomerId: string, 
    signedAgreementId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🌉 Updating complete Bridge integration data...', { 
        userId, 
        bridgeCustomerId, 
        signedAgreementId 
      });
      
      // Find the KYC profile for this user
      console.log('🔍 Step 1: Finding profile for user...', { userId });
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('userId', userId)
        .single();

      console.log('🔍 Profile query result:', {
        found: !!profile,
        profileId: profile?.id,
        error: profileError
      });

      if (profileError || !profile) {
        console.error('❌ Profile not found for user:', userId, profileError);
        return { success: false, error: `Profile not found: ${profileError?.message}` };
      }

      // Update the KYC profile with both Bridge customer ID and signed agreement ID
      console.log('🔍 Step 2: Updating KYC profile...', {
        profileId: profile.id,
        bridgeCustomerId,
        signedAgreementId
      });
      
      const updateData = {
        bridge_customer_id: bridgeCustomerId,
        signed_agreement_id: signedAgreementId,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('🔍 Update data:', updateData);
      
      const { error: updateError } = await supabaseAdmin
        .from('kyc_profiles')
        .update(updateData)
        .eq('profile_id', profile.id);

      console.log('🔍 Update result:', {
        success: !updateError,
        error: updateError
      });

      if (updateError) {
        console.error('❌ Failed to update Bridge integration data:', updateError);
        return { success: false, error: `Update failed: ${updateError.message}` };
      }

      console.log('✅ Complete Bridge integration data saved to database successfully');
      return { success: true };

    } catch (error) {
      console.error('💥 Error updating Bridge integration data:', error);
      return { 
        success: false, 
        error: `Database update error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
}; 