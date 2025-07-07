import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Yup from 'yup';
// Comment to force linter refresh
import FormField from '@/app/components/FormField';
import DropdownSelector from '@/app/components/shared/DropdownSelector';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { getCountries, getStatesByCountry } from '@/app/services/countryService';
import { kycService } from '@/app/services/kycService';
import { useKycStore } from '@/app/store';
import { Country, State } from '@/app/types/LocationTypes';

const AddressInfoSchema = Yup.object().shape({
  country: Yup.string().required('El país es requerido'),
  state: Yup.string().required('El departamento es requerido'),
  city: Yup.string().required('La ciudad es requerida'),
  address: Yup.string().required('La dirección es requerida'),
  postalCode: Yup.string(),
});

interface DropdownItem {
  label: string;
  value: string;
}

export default function AddressInfoScreen() {
  const router = useRouter();
  const { addressInfo, updateAddressInfo } = useKycStore();
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [states, setStates] = useState<DropdownItem[]>([]);

  useEffect(() => {
    async function loadCountries() {
      const countryList: Country[] = await getCountries();
      setCountries(countryList.map(c => ({ label: c.name, value: c.code })));
    }
    loadCountries();
  }, []);

  const handleCountryChange = async (countryCode: string, setFieldValue: Function) => {
    setFieldValue('country', countryCode);
    setFieldValue('state', ''); // Reset state on country change
    if (countryCode) {
      const stateList: State[] = await getStatesByCountry(countryCode);
      setStates(stateList.map(s => ({ label: s.name, value: s.code })));
    } else {
      setStates([]);
    }
  };

  const handleContinue = (values: any) => {
    updateAddressInfo(values);
    kycService.advanceToNextStep('address');
    router.push('./economic-activity');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>Tu dirección de residencia</ThemedText>
        <ThemedText style={styles.subtitle}>La dirección donde resides actualmente.</ThemedText>

        <Formik
          initialValues={{
            country: addressInfo.country || '',
            state: addressInfo.state || '',
            city: addressInfo.city || '',
            address: addressInfo.address || '',
            postalCode: addressInfo.postalCode || '',
          }}
          validationSchema={AddressInfoSchema}
          onSubmit={handleContinue}
        >
          {(formikProps) => (
            <View>
              <DropdownSelector
                label="País"
                items={countries}
                selectedValue={formikProps.values.country}
                onValueChange={(value: string | number) => handleCountryChange(value as string, formikProps.setFieldValue)}
              />
              <DropdownSelector
                label="Provincia / Estado"
                items={states}
                selectedValue={formikProps.values.state}
                onValueChange={(value: string | number) => formikProps.setFieldValue('state', value)}
                enabled={!!formikProps.values.country && states.length > 0}
              />
              <FormField
                formikKey="city"
                formikProps={formikProps}
                label="Ciudad"
                placeholder="Ej. Santa Cruz de la Sierra"
              />
              <FormField
                formikKey="address"
                formikProps={formikProps}
                label="Dirección"
                placeholder="Ej. Av. Principal #123"
              />
              <FormField
                formikKey="postalCode"
                formikProps={formikProps}
                label="Código Postal (Opcional)"
                placeholder="Ej. 0000"
                keyboardType="numeric"
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