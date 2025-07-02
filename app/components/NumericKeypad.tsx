import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onDelete,
  disabled = false,
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKeyPress(key);
  };

  const handleDelete = () => {
    if (disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete();
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
    if (key === '') {
      return <View key={`${rowIndex}-${keyIndex}`} style={styles.keyButton} />;
    }

    if (key === 'delete') {
      return (
        <TouchableOpacity
          key={`${rowIndex}-${keyIndex}`}
          style={[
            styles.keyButton,
            { backgroundColor, borderColor },
            disabled && styles.disabled,
          ]}
          onPress={handleDelete}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="backspace-outline" size={24} color={iconColor} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={`${rowIndex}-${keyIndex}`}
        style={[
          styles.keyButton,
          { backgroundColor, borderColor },
          disabled && styles.disabled,
        ]}
        onPress={() => handleKeyPress(key)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.keyText, { color: textColor }]}>{key}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 24,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default NumericKeypad; 