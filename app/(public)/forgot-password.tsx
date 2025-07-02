import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Yup from "yup";

import { FormField } from "@/app/components/FormField";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { Strings } from "@/app/constants/Strings";
import { useThemeColor } from "@/app/hooks/useThemeColor";

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email(Strings.auth.validation.emailInvalid)
    .required(Strings.auth.validation.emailRequired),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const backgroundColor = useThemeColor({}, "background");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");

  const handleSendResetEmail = async (values: { email: string }) => {
    setIsLoading(true);

    try {
      // const { error } = await authService.resetPassword(values.email);

      // if (error) {
      //   Alert.alert(Strings.common.error, error.message || Strings.auth.errors.resetFailed);
      // } else {
      Alert.alert(
        Strings.auth.forgotPassword.emailSent,
        Strings.auth.forgotPassword.emailSentDesc,
        [
          {
            text: "OK",
            onPress: () => router.push("/(public)/reset-password" as any),
          },
        ]
      );
      // }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert(Strings.common.error, Strings.auth.errors.resetFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleBackToLogin = () => {
    router.push("/(public)/login" as any);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: "#1A2B42" }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.cardContainer, { backgroundColor }]}>
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.forgotPassword.title}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: textSecondaryColor }]}
            >
              {Strings.auth.forgotPassword.subtitle}
            </ThemedText>
          </View>

          <Formik
            initialValues={{ email: "" }}
            validationSchema={ForgotPasswordSchema}
            onSubmit={handleSendResetEmail}
          >
            {(formikProps) => (
              <View style={styles.formContainer}>
                <FormField
                  label="Email"
                  formikKey="email"
                  formikProps={formikProps}
                  placeholder={Strings.auth.forgotPassword.emailPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons name="mail-outline" size={20} color={iconColor} />
                  }
                  editable={!isLoading}
                />

                <ThemedButton
                  title={Strings.auth.forgotPassword.sendButton}
                  onPress={() => formikProps.handleSubmit()}
                  loading={isLoading}
                  disabled={
                    isLoading ||
                    !formikProps.isValid ||
                    formikProps.isSubmitting
                  }
                  style={styles.sendButton}
                  size="large"
                />
              </View>
            )}
          </Formik>

          <View style={styles.bottomContainer}>
            <TouchableOpacity onPress={handleBackToLogin} disabled={isLoading}>
              <ThemedText
                style={[styles.backToLoginText, { color: tintColor }]}
              >
                {Strings.auth.forgotPassword.backToLogin}
              </ThemedText>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    minHeight: 400,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    width: "100%",
    marginBottom: 32,
  },
  sendButton: {
    marginTop: 24,
    width: "100%",
  },
  bottomContainer: {
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
