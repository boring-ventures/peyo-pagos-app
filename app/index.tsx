import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigir a la pantalla de carga que verificará la autenticación
  return <Redirect href={'/(auth)/loading' as any} />;
}
