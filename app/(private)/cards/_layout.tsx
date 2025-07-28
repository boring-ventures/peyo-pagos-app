import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function CardsLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor,
        },
        headerTintColor: textColor,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Mis Tarjetas',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="card-type-selection"
        options={{
          title: 'Seleccionar Tipo',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Crear Tarjeta',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="[cardId]"
        options={{
          title: 'Detalles de Tarjeta',
        }}
      />
    </Stack>
  );
} 