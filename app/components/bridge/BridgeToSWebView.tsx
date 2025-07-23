import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useBridgeStore } from '@/app/store';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const webViewRef = useRef<WebView>(null);
  const { showToSForUser, acceptTermsOfService } = useBridgeStore();
  
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  // JavaScript to inject for intercepting API calls
  const injectedJavaScript = `
    (function() {
      console.log('🔍 Bridge ToS Interceptor: Starting...');
      
      // Store original fetch function
      const originalFetch = window.fetch;
      
      // Override fetch to intercept API calls
      window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};
        
        console.log('🔍 Intercepted fetch call:', url);
        
        // Check if this is the generate_signed_agreement_id call
        if (url.includes('generate_signed_agreement_id')) {
          console.log('🎯 Intercepting signed_agreement_id generation...');
          
          return originalFetch.apply(this, args).then(response => {
            // Clone the response so we can read it
            const clonedResponse = response.clone();
            
            // Read the response body
            return clonedResponse.json().then(data => {
              console.log('📦 API Response data:', data);
              
              // Check if we got a signed_agreement_id
              if (data && data.signed_agreement_id) {
                console.log('✅ Found signed_agreement_id:', data.signed_agreement_id);
                
                // Send the signed_agreement_id to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SIGNED_AGREEMENT_ID',
                  signedAgreementId: data.signed_agreement_id
                }));
                
                // Also trigger a custom event for backup
                window.dispatchEvent(new CustomEvent('bridge-tos-accepted', {
                  detail: { signedAgreementId: data.signed_agreement_id }
                }));
              }
              
              // Return the original response
              return response;
            }).catch(error => {
              console.error('❌ Error parsing API response:', error);
              return response;
            });
          });
        }
        
        // For all other requests, just pass through
        return originalFetch.apply(this, args);
      };
      
      // Also intercept XMLHttpRequest as backup
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._url = url;
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(...args) {
        if (this._url && this._url.includes('generate_signed_agreement_id')) {
          console.log('🎯 Intercepting XHR call to generate_signed_agreement_id');
          
          this.addEventListener('load', function() {
            try {
              const response = JSON.parse(this.responseText);
              console.log('📦 XHR Response:', response);
              
              if (response && response.signed_agreement_id) {
                console.log('✅ Found signed_agreement_id via XHR:', response.signed_agreement_id);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SIGNED_AGREEMENT_ID',
                  signedAgreementId: response.signed_agreement_id
                }));
              }
            } catch (error) {
              console.error('❌ Error parsing XHR response:', error);
            }
          });
        }
        
        return originalXHRSend.apply(this, args);
      };
      
      // Listen for the success message on the page
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text && text.includes('Success!') && text.includes('Terms of Service')) {
                  console.log('✅ Success message detected on page');
                  
                  // Try to find signed_agreement_id in the page content
                  const pageContent = document.body.innerText;
                  const match = pageContent.match(/signed_agreement_id["\s]*:["\s]*"([^"]+)"/);
                  
                  if (match && match[1]) {
                    console.log('✅ Found signed_agreement_id in page content:', match[1]);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'SIGNED_AGREEMENT_ID',
                      signedAgreementId: match[1]
                    }));
                  }
                }
              }
            });
          }
        });
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('🔍 Bridge ToS Interceptor: Ready!');
    })();
  `;

  // Auto-start ToS flow when WebView becomes visible
  useEffect(() => {
    if (visible && tosUrl) {
      console.log('🔐 WebView visible, starting ToS flow...');
      handleStartToSFlow();
    }
  }, [visible, tosUrl]);

  const handleStartToSFlow = async () => {
    try {
      console.log('🌐 Starting ToS flow from WebView component...');
      const result = await showToSForUser();
      
      if (result.success && result.url) {
        console.log('✅ ToS URL ready for WebView:', result.url);
        setCurrentUrl(result.url);
      } else {
        console.error('❌ ToS flow failed:', result.error);
        onError(result.error || 'Error en el flujo de términos de servicio');
      }
    } catch (error) {
      console.error('💥 Error in WebView ToS flow:', error);
      onError('Error inesperado en el flujo de términos');
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('🔗 WebView navigation:', url);
    setCurrentUrl(url);

    // Check if URL contains signed_agreement_id (successful ToS acceptance)
    if (url.includes('signed_agreement_id=')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const signedAgreementId = urlParams.get('signed_agreement_id');
        
        if (signedAgreementId) {
          console.log('✅ ToS accepted, agreement ID:', signedAgreementId);
          acceptTermsOfService(signedAgreementId);
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

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    console.log('🔍 WebView load request:', url);

    // Intercept redirects to your app scheme
    if (url.startsWith('peyopagos://')) {
      console.log('🎯 Intercepting redirect to app scheme:', url);
      
      try {
        const urlObj = new URL(url);
        const signedAgreementId = urlObj.searchParams.get('signed_agreement_id');
        
        if (signedAgreementId) {
          console.log('✅ Extracted signed_agreement_id from redirect:', signedAgreementId);
          acceptTermsOfService(signedAgreementId);
          onAccept(signedAgreementId);
          return false; // Don't load the URL in WebView
        }
      } catch (error) {
        console.error('❌ Error parsing redirect URL:', error);
      }
      
      return false; // Don't load app scheme URLs in WebView
    }

    // Allow all other URLs
    return true;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 WebView message received:', data);
      
      // Listen for signedAgreementId from injected JavaScript
      if (data.type === 'SIGNED_AGREEMENT_ID' && data.signedAgreementId) {
        console.log('✅ ToS accepted via injected JavaScript:', data.signedAgreementId);
        acceptTermsOfService(data.signedAgreementId);
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

        {/* WebView with enhanced redirect handling and API interception */}
        {currentUrl && (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={[styles.webview, { backgroundColor }]}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onMessage={handleMessage}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={true}
            userAgent="PeyoPagos-App/1.0"
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
            }}
          />
        )}

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