import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [showModal, setShowModal] = useState(false);
  const [tempValue, setTempValue] = useState<string | number>('');
  
  const backgroundColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const openModal = () => {
    if (enabled) {
      setTempValue(selectedValue);
      setShowModal(true);
    }
  };

  const confirmSelection = () => {
    onValueChange(tempValue);
    setShowModal(false);
  };

  const getSelectedLabel = () => {
    const selectedItem = items.find(item => item.value === selectedValue);
    return selectedItem ? selectedItem.label : `Selecciona ${label.toLowerCase()}`;
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <TouchableOpacity
          onPress={openModal}
          disabled={!enabled}
          style={[
            styles.iosInputContainer,
            { 
              borderColor: enabled ? borderColor : '#E5E5E5', 
              backgroundColor,
              opacity: enabled ? 1 : 0.6
            }
          ]}
        >
          <ThemedText style={[styles.iosInputText, { color: selectedValue ? textColor : '#999' }]}>
            {getSelectedLabel()}
          </ThemedText>
          <Ionicons name="chevron-down" size={20} color={iconColor} />
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <ThemedText style={styles.modalButton}>Cancelar</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.modalTitle}>{label}</ThemedText>
                <TouchableOpacity onPress={confirmSelection}>
                  <ThemedText style={styles.modalButton}>Confirmar</ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.optionItem,
                      tempValue === item.value && styles.selectedOption
                    ]}
                    onPress={() => setTempValue(item.value)}
                  >
                    <ThemedText style={[
                      styles.optionText,
                      { color: textColor },
                      tempValue === item.value && styles.selectedOptionText
                    ]}>
                      {item.label}
                    </ThemedText>
                    {tempValue === item.value && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Android version
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
  // iOS-specific styles
  iosInputContainer: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iosInputText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default DropdownSelector;
