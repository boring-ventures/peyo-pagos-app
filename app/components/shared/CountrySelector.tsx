import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { useThemeColor } from '../../hooks/useThemeColor';

export interface Country {
  name: string;
  code: string;
  flag: string;
  dial_code: string;
}

export const countries: Country[] = [
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴', dial_code: '+591' },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹', dial_code: '+502' },
];

interface CountrySelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelectCountry,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const handleSelect = (country: Country) => {
    onSelectCountry(country);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorContainer, { borderColor }]}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText style={styles.flagText}>{selectedCountry.flag}</ThemedText>
        <ThemedText style={styles.codeText}>{selectedCountry.code}</ThemedText>
        <Ionicons name="chevron-down" size={16} color={textColor} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleSelect(item)}
                >
                  <ThemedText style={styles.flagText}>{item.flag}</ThemedText>
                  <ThemedText>{item.name}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 56,
  },
  flagText: {
    fontSize: 24,
    marginRight: 8,
  },
  codeText: {
    fontWeight: '500',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});

export default CountrySelector; 