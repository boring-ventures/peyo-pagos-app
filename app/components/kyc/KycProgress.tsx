import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useKycStore } from '@/app/store';
import { KycStep } from '@/app/types/KycTypes';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const steps: KycStep[] = [
  'personal_info',
  'address',
  'economic_activity',
  'document_upload',
  'selfie',
];

const KycProgress: React.FC = () => {
  const { currentStep } = useKycStore();
  const primaryColor = useThemeColor({}, 'tint');
  const trackColor = useThemeColor({}, 'backgroundSecondary');

  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progress,
          {
            width: `${progressPercent}%`,
            backgroundColor: primaryColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '60%',
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progress: {
    height: '100%',
    borderRadius: 3,
  },
});

export default KycProgress;
