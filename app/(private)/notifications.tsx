import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import React from 'react';

export default function NotificationsScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>Notificaciones</ThemedText>
      <ThemedText>Aquí verás tus notificaciones.</ThemedText>
    </ThemedView>
  );
} 