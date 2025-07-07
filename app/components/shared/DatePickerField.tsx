import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useField } from 'formik';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DatePickerFieldProps {
  name: string;
  label: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ name, label }) => {
  const [field, meta, helpers] = useField(name);
  const [show, setShow] = useState(false);
  const { setValue } = helpers;

  const iconColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(field.value);
    setShow(Platform.OS === 'ios');
    if (currentDate) {
      setValue(currentDate.toISOString().split('T')[0]);
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const dateValue = field.value ? new Date(field.value) : new Date();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TouchableOpacity
        onPress={showDatepicker}
        style={[styles.inputContainer, { borderColor: meta.error ? errorColor : borderColor, backgroundColor: cardColor }]}
      >
        <ThemedText style={{ color: textColor }}>
          {field.value ? dateValue.toLocaleDateString('es-ES') : `Selecciona ${label.toLowerCase()}`}
        </ThemedText>
        <Ionicons name="calendar-outline" size={24} color={iconColor} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dateValue}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}
      {meta.touched && meta.error && (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>{meta.error}</ThemedText>
      )}
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
  inputContainer: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default DatePickerField; 