import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
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
  const colorScheme = useColorScheme();
  const cardBg = colorScheme === 'dark' ? '#1A2B42' : '#FFFFFF';

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardSheetWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.cardSheet, { backgroundColor: cardBg }]}>
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
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSheetWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingTop: 150,
    paddingHorizontal: 10,
  },
  cardSheet: {
    alignSelf: 'stretch',
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingBottom: 24,
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