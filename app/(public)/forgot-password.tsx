import { FormField } from "@/app/components/FormField";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import Strings from "@/app/constants/Strings";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email(Strings.auth.validation.emailInvalid).required(Strings.auth.validation.emailRequired),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const cardColor = useThemeColor({}, 'card');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = (values: { email: string }) => {
    setIsLoading(true);
    // Mock sending code
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        Strings.auth.forgotPassword.emailSent,
        Strings.auth.forgotPassword.emailSentDesc,
        [
          {
            text: Strings.auth.forgotPassword.enterCode,
            onPress: () =>
              router.push({
                pathname: "/(public)/otp-verification",
                params: { email: values.email, purpose: 'passwordReset' },
              }),
          },
        ]
      );
    }, 1500);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: "#1A2B42" }]}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={"#fff"} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="title" style={styles.title}>
              {Strings.auth.forgotPassword.title}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {Strings.auth.forgotPassword.subtitle}
            </ThemedText>

            <Formik
              initialValues={{ email: "" }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSendCode}
            >
              {(formikProps) => (
                <View style={styles.formContainer}>
                  <FormField
                    formikProps={formikProps}
                    formikKey="email"
                    label={Strings.auth.forgotPassword.emailPlaceholder}
                    placeholder={Strings.auth.forgotPassword.emailPlaceholder}
                    keyboardType="email-address"
                  />

                  <ThemedButton
                    title={Strings.auth.forgotPassword.sendButton}
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
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    borderRadius: 24,
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
    maxWidth: "80%",
    alignSelf: "center",
  },
  formContainer: {
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
});
