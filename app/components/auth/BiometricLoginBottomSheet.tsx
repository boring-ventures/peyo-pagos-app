import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface BiometricLoginBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
}

export const BiometricLoginBottomSheet: React.FC<
  BiometricLoginBottomSheetProps
> = ({ isVisible, onClose, onAuthenticate }) => {
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: cardColor }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close-circle" size={28} color={textColor} />
              </TouchableOpacity>

              <View style={styles.content}>
                <Ionicons
                  name="finger-print-outline"
                  size={64}
                  color={textColor}
                  style={styles.icon}
                />
                <ThemedText type="title" style={styles.title}>
                  Ingresar con biometría
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Usa tu huella digital para ingresar de forma más rápida y segura.
                </ThemedText>

                <ThemedButton
                  title="Autenticar"
                  type="primary"
                  size="large"
                  onPress={onAuthenticate}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: '90%',
  },
  button: {
    width: '100%',
  },
});

export default BiometricLoginBottomSheet; 