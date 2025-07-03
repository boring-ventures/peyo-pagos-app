import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface BiometricSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onActivate: () => void;
  type: 'faceid' | 'touchid';
}

export function BiometricSetupModal({
  visible,
  onClose,
  onActivate,
  type,
}: BiometricSetupModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const getTitle = () => {
    return type === 'faceid' 
      ? 'Enable Face ID for Quick Access'
      : 'Touch ID for Payments Authorization';
  };

  const getSubtitle = () => {
    return type === 'faceid'
      ? 'Protect Your Account with Face ID Recognition'
      : 'Activate TouchID for Quick Transactions';
  };

  const getIcon = () => {
    return type === 'faceid' ? 'eye-outline' : 'finger-print';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={iconColor} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name={getIcon()} size={80} color={tintColor} />
          </View>

          <ThemedText type="title" style={styles.title}>
            {getTitle()}
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            {getSubtitle()}
          </ThemedText>

          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Activate Now"
              onPress={onActivate}
              style={styles.activateButton}
              size="large"
            />

            <ThemedButton
              title="Maybe Later"
              onPress={onClose}
              type="secondary"
              style={styles.laterButton}
              size="large"
            />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
  },
  activateButton: {
    marginBottom: 12,
  },
  laterButton: {
    marginBottom: 24,
  },
}); 