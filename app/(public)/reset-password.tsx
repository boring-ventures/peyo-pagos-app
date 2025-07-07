import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Yup from 'yup';

import { FormField } from '@/app/components/FormField';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemeColor } from '@/app/hooks/useThemeColor';
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

  const backgroundColor = useThemeColor({}, 'background');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const iconColor = useThemeColor({}, 'icon');

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
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={'#fff'} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            Nueva contraseña
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Crea tu contraseña
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
                  label="Nueva contraseña"
                  placeholder="Introduce tu contraseña"
                  secureTextEntry
                />

                <FormField
                  formikProps={formikProps}
                  formikKey="confirmPassword"
                  label="Confirmar contraseña"
                  placeholder="Introduce tu contraseña nuevamente"
                  secureTextEntry
                />

                <ThemedButton
                  title="Confirmar contraseña"
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
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 24,
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