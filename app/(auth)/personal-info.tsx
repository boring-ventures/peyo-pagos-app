import { useRouter } from "expo-router";
import { Formik } from "formik";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import * as Yup from "yup";

import FormField from "@/app/components/FormField";
import DatePickerField from "@/app/components/shared/DatePickerField";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { kycService } from "@/app/services/kycService";
import { useKycStore } from "@/app/store";
import { Ionicons } from "@expo/vector-icons";

const PersonalInfoSchema = Yup.object().shape({
  firstName: Yup.string().required("El nombre es requerido"),
  lastName: Yup.string().required("El apellido es requerido"),
  dateOfBirth: Yup.date()
    .required("La fecha de nacimiento es requerida")
    .max(new Date(), "La fecha de nacimiento no puede ser en el futuro"),
});

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { personalInfo, updatePersonalInfo } = useKycStore();
  const colorScheme = useColorScheme();
  const cardBg = colorScheme === "dark" ? "#1A2B42" : "#FFFFFF";

  const handleContinue = (values: any) => {
    updatePersonalInfo(values);
    kycService.advanceToNextStep("personal_info");
    router.push("./address-info");
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardSheetWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.cardSheet, { backgroundColor: cardBg }]}>
            <ThemedText type="title" style={styles.title}>
              Información personal
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Llena tus datos personales para continuar.
            </ThemedText>
            <Formik
              initialValues={{
                firstName: personalInfo.firstName || "",
                lastName: personalInfo.lastName || "",
                dateOfBirth: personalInfo.dateOfBirth || "",
              }}
              validationSchema={PersonalInfoSchema}
              onSubmit={handleContinue}
            >
              {(formikProps) => (
                <View>
                  <FormField
                    formikKey="firstName"
                    formikProps={formikProps}
                    label="Nombre(s)"
                    placeholder="Ingresa tu nombre"
                  />
                  <FormField
                    formikKey="lastName"
                    formikProps={formikProps}
                    label="Primer Apellido"
                    placeholder="Ingresa tu primer apellido"
                  />
                  <DatePickerField
                    name="dateOfBirth"
                    label="Fecha de Nacimiento"
                  />
                  <ThemedButton
                    onPress={() => formikProps.handleSubmit()}
                    title="Continuar"
                    disabled={!formikProps.isValid}
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
    backgroundColor: "#0F172A",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cardSheetWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingTop: 150,
    paddingHorizontal: 10,
  },
  cardSheet: {
    alignSelf: 'stretch',
    padding: 24,
    borderRadius: 24,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,

    // borderWidth: 1,
    // borderColor: "red",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    marginTop: 24,
  },
});
