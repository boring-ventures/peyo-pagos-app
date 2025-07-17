import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface BridgeToSWebViewProps {
  visible: boolean;
  tosUrl: string;
  onClose: () => void;
  onAccept: (signedAgreementId: string) => void;
  onError: (error: string) => void;
}

export const BridgeToSWebView: React.FC<BridgeToSWebViewProps> = ({
  visible,
  tosUrl,
  onClose,
  onAccept,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('🔗 WebView navigation:', url);

    // Check if URL contains signed_agreement_id (successful ToS acceptance)
    if (url.includes('signed_agreement_id=')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const signedAgreementId = urlParams.get('signed_agreement_id');
        
        if (signedAgreementId) {
          console.log('✅ ToS accepted, agreement ID:', signedAgreementId);
          onAccept(signedAgreementId);
          return;
        }
      } catch (error) {
        console.error('❌ Error parsing agreement ID from URL:', error);
        onError('Error procesando la aceptación de términos');
      }
    }

    // Check for error states
    if (url.includes('error=') || url.includes('cancelled=')) {
      console.log('❌ ToS acceptance cancelled or error');
      onError('Términos de servicio no aceptados');
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Listen for signedAgreementId from postMessage
      if (data.signedAgreementId) {
        console.log('✅ ToS accepted via postMessage:', data.signedAgreementId);
        onAccept(data.signedAgreementId);
      }
    } catch (error) {
      console.log('📨 Received non-JSON message:', event.nativeEvent.data);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Cerrar Términos',
      'Es necesario aceptar los términos de servicio para continuar. ¿Deseas cerrar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar', style: 'destructive', onPress: onClose }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <ThemedText style={styles.headerTitle}>
            Términos de Servicio Bridge
          </ThemedText>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>
              Cargando términos de servicio...
            </ThemedText>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: tosUrl }}
          style={[styles.webview, { backgroundColor }]}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />

        {/* Footer info */}
        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <ThemedText style={styles.footerText}>
            Es necesario aceptar los términos de Bridge para continuar con la verificación.
          </ThemedText>
        </View>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  webview: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 