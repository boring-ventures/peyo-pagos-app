import { ThemedText } from '@/app/components/ThemedText';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface TermsTextProps {
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export const TermsText: React.FC<TermsTextProps> = ({
  onTermsPress,
  onPrivacyPress,
}) => {
  const linkColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>
        Al continuar, estás de acuerdo con los{' '}
        <TouchableOpacity onPress={onTermsPress} activeOpacity={0.7}>
          <ThemedText style={[styles.link, { color: linkColor }]}>
            Términos y Condiciones
          </ThemedText>
        </TouchableOpacity>{' '}
        de Peyo Pagos
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
}); 