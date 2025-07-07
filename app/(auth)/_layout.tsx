import KycProgress from '@/app/components/kyc/KycProgress';
import Colors from '@/app/constants/Colors';
import { useKycStore } from '@/app/store';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { currentStep } = useKycStore();

  const showHeaderProgress = [
    'personal_info',
    'address',
    'economic_activity',
  ].includes(currentStep);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        headerTitle: (props) => showHeaderProgress ? <KycProgress /> : <></>,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="loading" options={{ headerShown: false }} />
      <Stack.Screen name="personal-info" options={{ title: 'Información Personal' }} />
      <Stack.Screen name="address-info" options={{ title: 'Dirección de Residencia' }} />
      <Stack.Screen name="economic-activity" options={{ title: 'Actividad Económica' }} />
      <Stack.Screen name="document-intro" options={{ title: 'Verificación de Identidad' }} />
      <Stack.Screen name="document-front" options={{ title: 'Documento (Frente)' }} />
      <Stack.Screen name="document-back" options={{ title: 'Documento (Dorso)' }} />
      <Stack.Screen name="selfie-capture" options={{ title: 'Captura de Selfie' }} />
      <Stack.Screen name="document-review" options={{ title: 'Revisar Documentos' }} />
      <Stack.Screen name="biometric-setup" options={{ title: 'Configuración Biométrica', headerTitle: '' }} />
      <Stack.Screen name="pin-setup" options={{ title: 'Crear PIN de Seguridad', headerTitle: '' }} />
      <Stack.Screen name="pin-confirm" options={{ title: 'Confirmar PIN', headerTitle: '' }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  );
} 