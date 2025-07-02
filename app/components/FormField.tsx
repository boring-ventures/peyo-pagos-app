import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { FormikProps } from 'formik';
import React, { useState } from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

export interface FormFieldProps extends TextInputProps {
  label: string;
  formikKey: string;
  formikProps: FormikProps<any>;
  leftIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  formikKey,
  formikProps,
  leftIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'tint');
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    formikProps.handleBlur(formikKey)(e);
  };
  
  const error = formikProps.touched[formikKey] && formikProps.errors[formikKey];
  const hasValue = formikProps.values[formikKey] && formikProps.values[formikKey].length > 0;
  
  const getBorderColor = () => {
    if (error) return errorColor;
    if (isFocused) return primaryColor;
    if (hasValue) return primaryColor;
    return borderColor;
  };
  
  const getBorderWidth = () => {
    if (error || isFocused || hasValue) return 1.5;
    return 1;
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      
      <View 
        style={[
          styles.inputContainer,
          { 
            backgroundColor,
            borderColor: getBorderColor(),
            borderWidth: getBorderWidth(),
          }
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input, 
            { 
              color: textColor,
              marginLeft: leftIcon ? 0 : 16,
            }
          ]}
          placeholder={props.placeholder}
          placeholderTextColor={placeholderColor}
          value={formikProps.values[formikKey]}
          onChangeText={formikProps.handleChange(formikKey)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.visibilityToggle} 
            onPress={togglePasswordVisibility}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={hasValue || isFocused ? primaryColor : placeholderColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: errorColor }]}>
          {formikProps.errors[formikKey]?.toString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
  },
  iconContainer: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 16,
    paddingRight: 16,
  },
  visibilityToggle: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '400',
  },
});

export default FormField; 