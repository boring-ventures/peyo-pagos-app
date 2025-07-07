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
  const mutedColor = useThemeColor({}, 'backgroundSecondary');

  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;

        return (
          <View
            key={step}
            style={[
              styles.step,
              {
                backgroundColor: isCompleted || isActive ? primaryColor : mutedColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 4,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  step: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
    marginHorizontal: 2,
  },
});

export default KycProgress;
