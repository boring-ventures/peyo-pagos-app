import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NumericKeypad } from '../NumericKeypad';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
}

export function PinSetupModal({
  visible,
  onClose,
  onComplete,
}: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const errorColor = useThemeColor({}, 'error');

  const handlePinInput = (value: string) => {
    if (step === 'create') {
      if (pin.length < 4) {
        setPin(pin + value);
        if (pin.length === 3) {
          setStep('confirm');
          setTimeout(() => setConfirmPin(''), 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + value);
        if (confirmPin.length === 3) {
          validatePins(confirmPin + value);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const validatePins = (finalConfirmPin: string) => {
    if (pin === finalConfirmPin) {
      onComplete(pin);
    } else {
      setError('PINs do not match. Please try again.');
      setTimeout(() => {
        setStep('create');
        setPin('');
        setConfirmPin('');
        setError('');
      }, 2000);
    }
  };

  const renderPinDots = () => {
    const currentPin = step === 'create' ? pin : confirmPin;
    return (
      <View style={styles.dotsContainer}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index < currentPin.length ? tintColor : 'transparent',
                borderColor: tintColor,
              },
            ]}
          />
        ))}
      </View>
    );
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

          <ThemedText type="title" style={styles.title}>
            {step === 'create' ? 'Set up Your PIN' : 'Confirm Your PIN'}
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Every Transaction Verified for Security with Your Security Code
          </ThemedText>

          {renderPinDots()}

          {error ? (
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {error}
            </ThemedText>
          ) : null}

          <NumericKeypad
            onKeyPress={handlePinInput}
            onDelete={handleDelete}
          />
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 40,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 8,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  keypad: {
    marginBottom: 24,
  },
}); 