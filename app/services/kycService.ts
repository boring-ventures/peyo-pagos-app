import useKycStore from '../store/kycStore';
import { KycStep } from '../types/KycTypes';

const submitKycData = async () => {
  const { personalInfo, addressInfo, economicActivity, documents, completeVerification } = useKycStore.getState();

  console.log('Submitting KYC Data:', {
    personalInfo,
    addressInfo,
    economicActivity,
    documents,
  });

  // Here you would typically make an API call to your backend
  // For now, we just call the store's mock completion function
  await completeVerification();

  const { verificationStatus } = useKycStore.getState();
  console.log('KYC submission finished. Status:', verificationStatus);

  return { success: verificationStatus === 'completed' };
};

const advanceToNextStep = async (currentStep: KycStep) => {
    const { validateStep, setCurrentStep } = useKycStore.getState();

    const isValid = await validateStep(currentStep);
    if (!isValid) {
        console.error(`Validation failed for step: ${currentStep}`);
        return;
    }

    const stepOrder: KycStep[] = ['personal_info', 'address', 'economic_activity', 'document_upload', 'selfie', 'completed'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        setCurrentStep(nextStep);
    } else {
        await submitKycData();
    }
};

export const kycService = {
  submitKycData,
  advanceToNextStep,
}; 