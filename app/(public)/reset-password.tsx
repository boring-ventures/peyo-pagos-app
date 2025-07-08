import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Yup from 'yup';

import { FormField } from '@/app/components/FormField';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { supabase } from '@/app/services/supabaseClient';

const ResetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Password confirmation is required'),
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const cardBg = colorScheme === 'dark' ? '#1A2B42' : '#FFFFFF';

  const handleResetPassword = async (values: { 
    newPassword: string; 
    confirmPassword: string; 
  }) => {
    setIsLoading(true);

    try {
      // If we have a token from URL parameters, we're in password reset flow
      if (token) {
        // For password reset via email link
        const { error } = await supabase.auth.updateUser({
          password: values.newPassword,
        });

        if (error) {
          Alert.alert(
            Strings.common.error, 
            error.message || Strings.auth.resetPassword.invalidToken
          );
          return;
        }
      } else {
        // For authenticated users changing password
        const { error } = await supabase.auth.updateUser({
          password: values.newPassword,
        });

        if (error) {
          Alert.alert(Strings.common.error, error.message || Strings.auth.errors.passwordUpdateFailed);
          return;
        }
      }

      Alert.alert(
        Strings.common.success,
        Strings.auth.resetPassword.passwordUpdated,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to login screen after successful password reset
              router.replace('/(public)/login');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert(Strings.common.error, Strings.auth.errors.passwordUpdateFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]} style={styles.safeAreaHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
      <View style={styles.cardSheetWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.cardSheet, { backgroundColor: cardBg }]}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.resetPassword.title}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {Strings.auth.resetPassword.subtitle}
            </ThemedText>

            <Formik
              initialValues={{ newPassword: '', confirmPassword: '' }}
              validationSchema={ResetPasswordSchema}
              onSubmit={handleResetPassword}
            >
              {(formikProps) => (
                <View style={styles.formContainer}>
                  <FormField
                    formikProps={formikProps}
                    formikKey="newPassword"
                    label={Strings.auth.resetPassword.newPasswordPlaceholder}
                    placeholder={Strings.auth.resetPassword.newPasswordPlaceholder}
                    secureTextEntry
                  />

                  <FormField
                    formikProps={formikProps}
                    formikKey="confirmPassword"
                    label={Strings.auth.resetPassword.confirmPasswordPlaceholder}
                    placeholder={Strings.auth.resetPassword.confirmPasswordPlaceholder}
                    secureTextEntry
                  />

                  <ThemedButton
                    title={Strings.auth.resetPassword.confirmButton}
                    type="primary"
                    size="large"
                    onPress={() => formikProps.handleSubmit()}
                    loading={isLoading}
                    disabled={isLoading || !formikProps.isValid}
                    style={styles.button}
                  />
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  safeAreaHeader: {
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSheetWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 150,
    paddingHorizontal: 10,
  },
  cardSheet: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
}); 