import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

import { useAuth } from "@/app/components/AuthContext";
import { FormField } from "@/app/components/FormField";
import { SocialAuthButton } from "@/app/components/SocialAuthButton";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { Strings } from "@/app/constants/Strings";
import { useThemeColor } from "@/app/hooks/useThemeColor";

// Phone number validation regex (international format)
const phoneRegex = /^[+]?[1-9]\d{1,14}$/;

// Validation schema with Yup
const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email(Strings.auth.validation.emailInvalid)
    .required(Strings.auth.validation.emailRequired),
  phone: Yup.string()
    .matches(phoneRegex, Strings.auth.validation.phoneInvalid)
    .required(Strings.auth.validation.phoneRequired),
  firstName: Yup.string().required(Strings.auth.validation.firstNameRequired),
  lastName: Yup.string().required(Strings.auth.validation.lastNameRequired),
  password: Yup.string()
    .min(6, Strings.auth.validation.passwordMin)
    .required(Strings.auth.validation.passwordRequired),
  confirmPassword: Yup.string()
    .required(Strings.auth.validation.confirmPasswordRequired)
    .oneOf([Yup.ref("password")], Strings.auth.validation.passwordsNoMatch),
  acceptTerms: Yup.boolean()
    .required(Strings.auth.validation.termsRequired)
    .oneOf([true], Strings.auth.validation.termsRequired),
});

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const iconColor = useThemeColor({}, "icon");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (values: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) => {
    setIsLoading(true);

    try {
      const success = await register(
        values.email,
        values.password,
        {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        null // No avatar for now
      );

      if (!success) {
        Alert.alert(Strings.common.error, Strings.auth.errors.registerFailed);
      }
    } catch (error) {
      console.error("Register error:", error);
      Alert.alert(Strings.common.error, Strings.auth.errors.registerFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    Alert.alert("Google Signup", "Google authentication coming soon.");
  };

  const handleLogin = () => {
    router.push("/(public)/login" as any);
  };

  const handleTermsPress = () => {
    Alert.alert(
      "Terms & Conditions",
      "Terms & Conditions content will be displayed here."
    );
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      "Privacy Policy",
      "Privacy Policy content will be displayed here."
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: "#1A2B42" }]}>
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
              {Strings.auth.register.title}
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: textSecondaryColor }]}
            >
              {Strings.auth.register.subtitle}
            </ThemedText>
          </View>

          <Formik
            initialValues={{
              email: "",
              phone: "",
              firstName: "",
              lastName: "",
              password: "",
              confirmPassword: "",
              acceptTerms: false,
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleRegister}
          >
            {(formikProps) => (
              <View style={styles.formContainer}>
                <FormField
                  label="Email"
                  formikKey="email"
                  formikProps={formikProps}
                  placeholder={Strings.auth.register.emailPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons name="mail-outline" size={20} color={iconColor} />
                  }
                  editable={!isLoading}
                />

                <FormField
                  label="Phone Number"
                  formikKey="phone"
                  formikProps={formikProps}
                  placeholder={Strings.auth.register.phonePlaceholder}
                  keyboardType="phone-pad"
                  leftIcon={
                    <Ionicons name="call-outline" size={20} color={iconColor} />
                  }
                  editable={!isLoading}
                />

                <FormField
                  label="Password"
                  formikKey="password"
                  formikProps={formikProps}
                  placeholder={Strings.auth.register.passwordPlaceholder}
                  secureTextEntry={true}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={iconColor}
                    />
                  }
                  editable={!isLoading}
                />

                {/* Terms & Conditions Checkbox */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      {
                        borderColor: formikProps.values.acceptTerms
                          ? tintColor
                          : borderColor,
                        backgroundColor: formikProps.values.acceptTerms
                          ? tintColor
                          : "transparent",
                      },
                    ]}
                    onPress={() =>
                      formikProps.setFieldValue(
                        "acceptTerms",
                        !formikProps.values.acceptTerms
                      )
                    }
                    disabled={isLoading}
                  >
                    {formikProps.values.acceptTerms && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.termsTextContainer}>
                    <Text
                      style={[styles.termsText, { color: textSecondaryColor }]}
                    >
                      {Strings.auth.register.termsText}{" "}
                    </Text>
                    <TouchableOpacity onPress={handleTermsPress}>
                      <Text style={[styles.termsLink, { color: tintColor }]}>
                        {Strings.auth.register.termsLink}
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[styles.termsText, { color: textSecondaryColor }]}
                    >
                      {" "}
                      &{" "}
                    </Text>
                    <TouchableOpacity onPress={handlePrivacyPress}>
                      <Text style={[styles.termsLink, { color: tintColor }]}>
                        {Strings.auth.register.privacyLink}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {formikProps.touched.acceptTerms &&
                  formikProps.errors.acceptTerms && (
                    <Text
                      style={[
                        styles.errorText,
                        { color: useThemeColor({}, "error") },
                      ]}
                    >
                      {formikProps.errors.acceptTerms.toString()}
                    </Text>
                  )}

                <ThemedButton
                  title={Strings.auth.register.registerButton}
                  onPress={() => formikProps.handleSubmit()}
                  loading={isLoading}
                  disabled={
                    isLoading ||
                    !formikProps.isValid ||
                    formikProps.isSubmitting
                  }
                  style={styles.registerButton}
                  size="large"
                />

                <SocialAuthButton
                  provider="google"
                  onPress={handleGoogleSignup}
                  disabled={isLoading}
                  style={styles.googleButton}
                />
              </View>
            )}
          </Formik>

          <View style={styles.loginContainer}>
            <ThemedText style={{ color: textSecondaryColor }}>
              {Strings.auth.register.hasAccount}
            </ThemedText>
            <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
              <ThemedText style={[styles.loginLink, { color: tintColor }]}>
                {Strings.auth.register.loginAction}
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 30,
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
    minHeight: 520,
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
  },
  formContainer: {
    width: "100%",
    marginBottom: 24,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  errorText: {
    fontSize: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  registerButton: {
    marginBottom: 16,
    width: "100%",
  },
  googleButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginLink: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
});
