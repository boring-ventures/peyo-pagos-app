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
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
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
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      
      <View 
        style={[
          styles.inputContainer,
          { 
            backgroundColor,
            borderColor: error ? errorColor : (isFocused ? primaryColor : borderColor),
            borderWidth: error || isFocused ? 1 : 0.5,
          }
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input, 
            { 
              color: textColor,
              marginLeft: leftIcon ? 0 : 12,
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
              size={22} 
              color={placeholderColor}
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
    marginBottom: 16,
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
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
  },
  iconContainer: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 16,
  },
  visibilityToggle: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '400',
  },
});

export default FormField; 