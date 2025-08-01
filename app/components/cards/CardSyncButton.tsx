import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useCardStore } from '@/app/store/cardStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';

interface CardSyncButtonProps {
  profileId: string;
  style?: any;
}

export function CardSyncButton({ profileId, style }: CardSyncButtonProps) {
  const { syncMoonCards } = useCardStore();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'textSecondary');

  const handleSync = async () => {
    if (!profileId) {
      Alert.alert('Error', 'No se pudo obtener el ID del perfil');
      return;
    }

    setIsSyncing(true);
    
    try {
      console.log('🔄 Starting card sync for profile:', profileId);
      
      const result = await syncMoonCards(profileId);
      
      if (result.success) {
        const message = `Sincronización completada exitosamente.\n\n` +
          `📊 Tarjetas procesadas: ${result.synced}\n` +
          `✅ Creadas: ${result.details.created}\n` +
          `🔄 Actualizadas: ${result.details.updated}\n` +
          `⏭️ Omitidas: ${result.details.skipped}`;
        
        Alert.alert('✅ Sincronización Exitosa', message);
      } else {
        const errorMessage = `Error en la sincronización:\n\n${result.errors.join('\n')}`;
        Alert.alert('❌ Error de Sincronización', errorMessage);
      }
    } catch (error) {
      console.error('💥 Sync error:', error);
      Alert.alert('Error', 'Error inesperado durante la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor }, style]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${tintColor}20` }]}>
          <Ionicons name="sync" size={32} color={tintColor} />
        </View>
        
        <ThemedText style={[styles.title, { color: textColor }]}>
          Sincronizar Tarjetas
        </ThemedText>
        
        <ThemedText style={[styles.description, { color: subtextColor }]}>
          Sincroniza las tarjetas existentes del usuario con Moon API. Obtiene las tarjetas que ya tienes en la base de datos y actualiza sus balances y estados desde Moon.
        </ThemedText>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Obtiene tarjetas existentes del usuario en Supabase
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Filtra solo las tarjetas que pertenecen al usuario
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Actualiza balances, estados y fechas de expiración
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={tintColor} />
            <ThemedText style={[styles.featureText, { color: textColor }]}>
              Solo actualiza si hay cambios reales en los datos
            </ThemedText>
          </View>
        </View>

        <ThemedButton
          title={isSyncing ? "Sincronizando..." : "Sincronizar Tarjetas"}
          type="secondary"
          loading={isSyncing}
          onPress={handleSync}
          style={styles.syncButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignSelf: 'center',
    marginVertical: 8,
    padding: 20,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  features: {
    alignSelf: 'stretch',
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
  },
  syncButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
}); 