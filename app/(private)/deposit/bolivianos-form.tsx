import { FormField } from "@/app/components/FormField";
import { ThemedButton } from "@/app/components/ThemedButton";
import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";

const EXCHANGE_RATE = 15.0; // 15.00 Bs = 1 USDT
const MAX_DEPOSIT = 13289; // Maximum deposit in Bolivianos

// Validation schema with Yup
const BolivianosFormSchema = Yup.object().shape({
  amount: Yup.string()
    .required("El monto es requerido")
    .test("is-valid-amount", "Ingresa un monto válido", (value) => {
      if (!value) return false;
      const numericAmount = parseFloat(value.replace(",", "."));
      return !isNaN(numericAmount) && numericAmount > 0;
    })
    .test("max-amount", `El monto máximo es ${MAX_DEPOSIT.toLocaleString()} Bs`, (value) => {
      if (!value) return true; // Let required validation handle empty values
      const numericAmount = parseFloat(value.replace(",", "."));
      return numericAmount <= MAX_DEPOSIT;
    }),
  description: Yup.string().optional(),
});

interface FormValues {
  amount: string;
  description: string;
}

export default function BolivianosFormScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");

  const handleBackPress = () => {
    router.back();
  };

  const handleSubmit = (values: FormValues) => {
    const numericAmount = parseFloat(values.amount.replace(",", "."));
    const usdAmount = (numericAmount / EXCHANGE_RATE).toFixed(2);
    
    // Navigate to QR display screen with payment data
    router.push({
      pathname: "/(private)/deposit/qr-display",
      params: {
        amount: values.amount,
        usdAmount,
        description: values.description,
      },
    });
  };

  const formatAmount = (value: string) => {
    // Remove all non-numeric characters except comma
    const cleaned = value.replace(/[^\d,]/g, "");
    // Ensure only one comma
    const parts = cleaned.split(",");
    if (parts.length > 2) {
      return parts[0] + "," + parts.slice(1).join("");
    }
    return cleaned;
  };

  const initialValues: FormValues = {
    amount: "15,60",
    description: "",
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <ThemedText style={styles.headerTitle}>
                  Depósito en Bolivianos
                </ThemedText>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Generar QR</ThemedText>
                <ThemedText
                  style={[styles.sectionDescription, { color: subtextColor }]}
                >
                  Selecciona el monto que quieres recibir en tu cuenta de
                  PeyoPagos
                </ThemedText>
              </View>

              <Formik
                initialValues={initialValues}
                validationSchema={BolivianosFormSchema}
                onSubmit={handleSubmit}
              >
                {(formikProps) => (
                  <>
                    {/* Form Fields */}
                    <View style={styles.formFields}>
                      <FormField
                        label="Monto (Bs)"
                        formikKey="amount"
                        formikProps={formikProps}
                        placeholder="0,00"
                        keyboardType="numeric"
                        autoFocus={false}
                        onChangeText={(text) => {
                          const formatted = formatAmount(text);
                          formikProps.setFieldValue("amount", formatted);
                        }}
                      />

                      <FormField
                        label="Detalle (Opcional)"
                        formikKey="description"
                        formikProps={formikProps}
                        placeholder="Escribe aquí..."
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Exchange Rate Info */}
                    <View style={[styles.exchangeInfo, { backgroundColor: cardColor, borderColor }]}>
                      <View style={styles.exchangeRow}>
                        <ThemedText style={styles.exchangeLabel}>
                          Tasa de cambio
                        </ThemedText>
                        <ThemedText style={styles.exchangeValue}>
                          {EXCHANGE_RATE.toFixed(2)} Bs = 1 USDT
                        </ThemedText>
                      </View>

                      <View style={styles.exchangeRow}>
                        <ThemedText style={styles.exchangeLabel}>
                          Monto a recibir (USD)
                        </ThemedText>
                        <ThemedText style={styles.exchangeValue}>
                          {(() => {
                            const numericAmount = parseFloat(formikProps.values.amount.replace(",", ".")) || 0;
                            return (numericAmount / EXCHANGE_RATE).toFixed(2);
                          })()} USDT
                        </ThemedText>
                      </View>

                      <View style={styles.exchangeRow}>
                        <ThemedText style={styles.exchangeLabel}>
                          Máximo a depositar
                        </ThemedText>
                        <ThemedText style={styles.exchangeValue}>
                          {MAX_DEPOSIT.toLocaleString()} Bs
                        </ThemedText>
                      </View>
                    </View>

                    {/* Generate Button */}
                    <View style={styles.buttonContainer}>
                      <ThemedButton
                        title="Generar QR"
                        type="primary"
                        size="large"
                        onPress={() => formikProps.handleSubmit()}
                        style={styles.generateButton}
                        disabled={!formikProps.isValid || formikProps.isSubmitting}
                      />
                    </View>
                  </>
                )}
              </Formik>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  formFields: {
    gap: 20,
    marginBottom: 24,
  },
  exchangeInfo: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
  },
  exchangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  exchangeLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  exchangeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 8,
  },
  generateButton: {
    width: "100%",
  },
}); 