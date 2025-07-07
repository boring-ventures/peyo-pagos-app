import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Yup from 'yup';

import FormField from '@/app/components/FormField';
import DatePickerField from '@/app/components/shared/DatePickerField';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { kycService } from '@/app/services/kycService';
import { useKycStore } from '@/app/store';

const PersonalInfoSchema = Yup.object().shape({
  firstName: Yup.string().required('El nombre es requerido'),
  lastName: Yup.string().required('El apellido es requerido'),
  dateOfBirth: Yup.date()
    .required('La fecha de nacimiento es requerida')
    .max(new Date(), 'La fecha de nacimiento no puede ser en el futuro'),
});

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { personalInfo, updatePersonalInfo } = useKycStore();

  const handleContinue = (values: any) => {
    updatePersonalInfo(values);
    kycService.advanceToNextStep('personal_info');
    router.push('./address-info');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>
          Información personal
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Llena tus datos personales para continuar.
        </ThemedText>

        <Formik
          initialValues={{
            firstName: personalInfo.firstName || '',
            lastName: personalInfo.lastName || '',
            dateOfBirth: personalInfo.dateOfBirth || '',
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
              <DatePickerField name="dateOfBirth" label="Fecha de Nacimiento" />

              <ThemedButton
                onPress={() => formikProps.handleSubmit()}
                title="Continuar"
                disabled={!formikProps.isValid}
                style={styles.button}
              />
            </View>
          )}
        </Formik>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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