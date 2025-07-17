import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionButtonsProps {
  onDeposit: () => void;
  onWithdraw: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDeposit,
  onWithdraw
}) => {
  const iconColor = useThemeColor({}, 'background');
  const buttonColor = useThemeColor({ light: '#4A90E2', dark: '#5A9DE8' }, 'tint');

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={onDeposit}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="add" size={24} color={iconColor} />
        </View>
        <Text style={styles.buttonText}>Depositar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={onWithdraw}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="remove" size={24} color={iconColor} />
        </View>
        <Text style={styles.buttonText}>Retirar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 