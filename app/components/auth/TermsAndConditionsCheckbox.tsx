import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { FormikProps } from 'formik';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TermsAndConditionsCheckboxProps {
  formikProps: FormikProps<any>;
  formikKey: string;
}

export const TermsAndConditionsCheckbox: React.FC<
  TermsAndConditionsCheckboxProps
> = ({ formikProps, formikKey }) => {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');

  const isChecked = formikProps.values[formikKey];
  const hasError =
    formikProps.touched[formikKey] && formikProps.errors[formikKey];

  return (
    <View>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: isChecked ? tintColor : borderColor,
              backgroundColor: isChecked ? tintColor : 'transparent',
            },
          ]}
          onPress={() =>
            formikProps.setFieldValue(formikKey, !isChecked)
          }
        >
          {isChecked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: textSecondaryColor }]}>
            Acepto los{' '}
          </Text>
          <TouchableOpacity onPress={() => console.log('Terms pressed')}>
            <Text style={[styles.link, { color: tintColor }]}>
              Términos & Condiciones
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {hasError && (
        <Text style={[styles.errorText, { color: errorColor }]}>
          {formikProps.errors[formikKey]?.toString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    marginLeft: 32, // Align with text
  },
});

export default TermsAndConditionsCheckbox; 