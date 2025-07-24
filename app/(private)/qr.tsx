import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import React from 'react';

export default function QRScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>QR</ThemedText>
      <ThemedText>Escanea o muestra tu código QR aquí.</ThemedText>
    </ThemedView>
  );
} 