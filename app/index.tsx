import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigir al loading de auth que manejará el flujo correcto
  return <Redirect href={'/(auth)' as any} />;
}
