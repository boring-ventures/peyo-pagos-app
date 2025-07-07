import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Yup from 'yup';

import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import {
    getEconomicActivities,
    getIncomeRanges,
    getOccupationAreas,
} from '@/app/services/economicActivityService';
import { kycService } from '@/app/services/kycService';
import { useKycStore } from '@/app/store';
import DropdownSelector from '../components/shared/DropdownSelector';

const EconomicActivitySchema = Yup.object().shape({
  activity: Yup.string().required('La actividad económica es requerida'),
  occupation: Yup.string().required('El área de ocupación es requerida'),
  monthlyIncome: Yup.string().required('El rango de ingresos es requerido'),
});

interface DropdownItem {
  label: string;
  value: string;
}

export default function EconomicActivityScreen() {
  const router = useRouter();
  const { economicActivity, addressInfo, updateEconomicActivity } = useKycStore();
  const [activities, setActivities] = useState<DropdownItem[]>([]);
  const [occupations, setOccupations] = useState<DropdownItem[]>([]);
  const [incomeRanges, setIncomeRanges] = useState<DropdownItem[]>([]);

  useEffect(() => {
    async function loadData() {
      const [acts, occs, incomes] = await Promise.all([
        getEconomicActivities(),
        getOccupationAreas(),
        getIncomeRanges(addressInfo.country || 'BO'),
      ]);
      setActivities(acts);
      setOccupations(occs);
      setIncomeRanges(incomes);
    }
    loadData();
  }, [addressInfo.country]);

  const handleContinue = (values: any) => {
    updateEconomicActivity(values);
    kycService.advanceToNextStep('economic_activity');
    router.push('./document-intro');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>¿A qué te dedicas?</ThemedText>
        <ThemedText style={styles.subtitle}>
          Quisiéramos saber un poco más de ti, cuéntanos a qué te dedicas.
        </ThemedText>

        <Formik
          initialValues={{
            activity: economicActivity.activity || '',
            occupation: economicActivity.occupation || '',
            monthlyIncome: economicActivity.monthlyIncome || '',
          }}
          validationSchema={EconomicActivitySchema}
          onSubmit={handleContinue}
        >
          {(formikProps) => (
            <View>
              <DropdownSelector
                label="¿Cuál es tu actividad económica?"
                items={activities}
                selectedValue={formikProps.values.activity}
                onValueChange={(value: string | number) => formikProps.setFieldValue('activity', value)}
              />
              <DropdownSelector
                label="¿Cuál es tu área de ocupación?"
                items={occupations}
                selectedValue={formikProps.values.occupation}
                onValueChange={(value: string | number) => formikProps.setFieldValue('occupation', value)}
              />
              <DropdownSelector
                label="Ingresos Mensuales (Estimado)"
                items={incomeRanges}
                selectedValue={formikProps.values.monthlyIncome}
                onValueChange={(value: string | number) => formikProps.setFieldValue('monthlyIncome', value)}
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