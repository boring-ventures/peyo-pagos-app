import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import React from 'react';

export default function HelpScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>Ayuda</ThemedText>
      <ThemedText>¿Necesitas ayuda? Aquí encontrarás información útil.</ThemedText>
    </ThemedView>
  );
} 