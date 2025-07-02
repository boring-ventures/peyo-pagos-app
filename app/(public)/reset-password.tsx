import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    .min(6, Strings.auth.validation.passwordMin)
    .required(Strings.auth.validation.passwordRequired),
  confirmPassword: Yup.string()
    .required(Strings.auth.validation.confirmPasswordRequired)
    .oneOf([Yup.ref('newPassword')], Strings.auth.validation.passwordsNoMatch),
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
    <ThemedView style={[styles.container, { backgroundColor: '#1A2B42' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.cardContainer, { backgroundColor }]}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.resetPassword.title}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
              {Strings.auth.resetPassword.subtitle}
            </ThemedText>
          </View>

          <Formik
            initialValues={{ newPassword: '', confirmPassword: '' }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleResetPassword}
          >
            {(formikProps) => (
              <View style={styles.formContainer}>
                <FormField
                  label="New Password"
                  formikKey="newPassword"
                  formikProps={formikProps}
                  placeholder={Strings.auth.resetPassword.newPasswordPlaceholder}
                  secureTextEntry={true}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
                  editable={!isLoading}
                />

                <FormField
                  label="Confirm Password"
                  formikKey="confirmPassword"
                  formikProps={formikProps}
                  placeholder={Strings.auth.resetPassword.confirmPasswordPlaceholder}
                  secureTextEntry={true}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
                  editable={!isLoading}
                />

                <ThemedButton
                  title={Strings.auth.resetPassword.confirmButton}
                  onPress={() => formikProps.handleSubmit()}
                  loading={isLoading}
                  disabled={isLoading || !formikProps.isValid || formikProps.isSubmitting}
                  style={styles.confirmButton}
                  size="large"
                />
              </View>
            )}
          </Formik>
        </View>
      </View>
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
  content: {
    flex: 1,
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
    minHeight: 450,
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
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  confirmButton: {
    marginTop: 32,
    width: '100%',
  },
}); 