import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';

import { useAuth } from '@/app/components/AuthContext';
import { FormField } from '@/app/components/FormField';
import { SocialAuthButton } from '@/app/components/SocialAuthButton';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemeColor } from '@/app/hooks/useThemeColor';

// Validation schema with Yup
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
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
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
    router.push('/(public)/forgot-password' as any);
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    Alert.alert('Google Login', 'Google authentication coming soon.');
  };

  const handleRegister = () => {
    router.push('/(public)/register' as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#1A2B42' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.cardContainer, { backgroundColor }]}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.login.title}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
              {Strings.auth.login.subtitle}
            </ThemedText>
          </View>
          
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
                  label="Password"
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
                  <ThemedText style={[styles.forgotPasswordText, { color: tintColor }]}>
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

                <SocialAuthButton
                  provider="google"
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                  style={styles.googleButton}
                />
              </View>
            )}
          </Formik>
          
          <View style={styles.registerContainer}>
            <ThemedText style={{ color: textSecondaryColor }}>
              {Strings.auth.login.noAccount} 
            </ThemedText>
            <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
              <ThemedText style={[styles.registerLink, { color: tintColor }]}>
                {Strings.auth.login.registerAction}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  cardContainer: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    minHeight: 480,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
    width: '100%',
  },
  googleButton: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLink: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 