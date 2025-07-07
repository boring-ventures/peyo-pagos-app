import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DropdownItem {
  label: string;
  value: string | number;
}

interface DropdownSelectorProps {
  items: DropdownItem[];
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  label: string;
  enabled?: boolean;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  items,
  selectedValue,
  onValueChange,
  label,
  enabled = true,
}) => {
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.pickerContainer, { borderColor, backgroundColor }]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          enabled={enabled}
          style={[styles.picker, { color: textColor }]}
          dropdownIconColor={textColor}
        >
          <Picker.Item label={`Selecciona ${label.toLowerCase()}`} value="" />
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
    width: '100%',
  },
});

export default DropdownSelector;
