import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';

import { useAuth } from '@/app/components/AuthContext';
import { FormField } from '@/app/components/FormField';
import { TermsText } from '@/app/components/TermsText';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';

// Placeholder para los logos hasta que el usuario los coloque
const logoLight = require('@/assets/images/icon-light.png');
const logoDark = require('@/assets/images/icon-dark.png');

// Esquema de validación con Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email(Strings.auth.validation.emailInvalid)
    .required(Strings.auth.validation.emailRequired),
  password: Yup.string()
    .min(6, Strings.auth.validation.passwordMin)
    .required(Strings.auth.validation.passwordRequired),
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const logo = useThemedAsset(logoLight, logoDark);
  const iconColor = useThemeColor({}, 'icon');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    
    try {
      const success = await login(values.email, values.password);
      
      if (!success) {
        Alert.alert(Strings.common.error, Strings.auth.errors.loginFailed);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(Strings.common.error, Strings.auth.errors.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Por ahora solo mostramos un mensaje (se implementará en el futuro)
    Alert.alert('Recuperar contraseña', 'Funcionalidad en desarrollo.');
  };

  const handleRegister = () => {
    router.push('/(public)/register' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          {Strings.auth.login.title}
        </ThemedText>
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {(formikProps) => (
            <View style={styles.formContainer}>
              <FormField
                label="Email"
                formikKey="email"
                formikProps={formikProps}
                placeholder={Strings.auth.login.emailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <FormField
                label="Contraseña"
                formikKey="password"
                formikProps={formikProps}
                placeholder={Strings.auth.login.passwordPlaceholder}
                secureTextEntry={true}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <TouchableOpacity 
                style={styles.forgotPasswordContainer} 
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <ThemedText type="link" style={isLoading ? { opacity: 0.7 } : undefined}>
                  {Strings.auth.login.forgotPassword}
                </ThemedText>
              </TouchableOpacity>
              
              <ThemedButton
                title={Strings.auth.login.loginButton}
                onPress={() => formikProps.handleSubmit()}
                loading={isLoading}
                disabled={isLoading || !formikProps.isValid || formikProps.isSubmitting}
                style={styles.loginButton}
                size="large"
              />
            </View>
          )}
        </Formik>
        
        <View style={styles.registerContainer}>
          <ThemedText>{Strings.auth.login.noAccount} </ThemedText>
          <TouchableOpacity onPress={handleRegister}>
            <ThemedText type="link">{Strings.auth.login.registerAction}</ThemedText>
          </TouchableOpacity>
        </View>
        
        <TermsText onTermsPress={() => Alert.alert('Términos', 'Aquí se mostrarían los términos y condiciones.')} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  loginButton: {
    marginTop: 10,
    width: '100%',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
}); 