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

      // Validate required data
      const missingFields: string[] = [];
      if (!personalInfo.firstName) missingFields.push('firstName');
      if (!personalInfo.lastName) missingFields.push('lastName');
      if (!personalInfo.dateOfBirth) missingFields.push('dateOfBirth');
      if (!personalInfo.nationality) missingFields.push('nationality');
      if (!addressInfo.country) missingFields.push('country');
      if (!addressInfo.city) missingFields.push('city');
      if (!addressInfo.address) missingFields.push('address');
      if (!documents.idFront) missingFields.push('idFront');
      if (!documents.selfie) missingFields.push('selfie');

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
        image_front: documents.idFront,
        image_back: documents.idBack,
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
        file_url: documents.selfie,
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

      if (profile) {
        console.log('✅ Profile found for Bridge integration');
        console.log('🔍 Profile structure:', {
          id: profile.id,
          userId: profile.userId,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          kycProfileExists: !!profile.kycProfile,
          addressExists: !!profile.kycProfile?.address,
          documentsCount: profile.kycProfile?.documents?.length || 0,
          identifyingInfoCount: profile.kycProfile?.identifyingInfo?.length || 0
        });
      }

      return profile;
    } catch (error) {
      console.error('💥 Error getting profile for Bridge:', error);
      return null;
    }
  },
}; 