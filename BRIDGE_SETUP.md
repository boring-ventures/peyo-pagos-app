# Bridge.xyz Integration Setup

Guía completa para configurar y usar la integración Bridge.xyz con Peyo Pagos.

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Bridge.xyz Configuration
EXPO_PUBLIC_BRIDGE_API_URL=https://api.sandbox.bridge.xyz/v0
EXPO_PUBLIC_BRIDGE_API_KEY=your_bridge_api_key_here
EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=true

# App Configuration (requerido para ToS en producción)
EXPO_PUBLIC_APP_URL=https://your-app.com
```

**⚠️ IMPORTANTE**: 
- Para producción, cambia la URL a `https://api.bridge.xyz/v0` 
- Cambia `EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=false` para producción
- **`EXPO_PUBLIC_APP_URL`** es requerido para el redirect_uri del ToS en producción
- Obtén tu API key desde [Bridge.xyz Dashboard](https://bridge.xyz/dashboard)

### 2. Reiniciar la Aplicación

Después de agregar las variables de entorno:

```bash
npx expo start --clear
```

## 🌟 Características Implementadas

### ✅ ToS (Terms of Service) Compliance
- **Sandbox**: ToS automático con dummy agreement ID
- **Producción**: ToS real con WebView, siguiendo documentación oficial de Bridge
- **WebView integrado**: Modal nativo para aceptación de términos
- **Redirect URI**: Soporte completo para `redirect_uri` según Bridge docs
- **Captura automática**: Del `signed_agreement_id` después de aceptación

### ✅ Integración Automática
- **Trigger automático**: Se inicia cuando KYC se completa exitosamente
- **Flujo diferenciado**: Sandbox vs Producción
- **Customer creation**: Cliente Bridge creado usando datos KYC
- **Wallet creation**: Wallet USDC en Base network por defecto (solo producción)

### ✅ UI Components
- **BridgeToSWebView**: Nuevo componente para ToS en producción
- **BridgeIntegrationCard**: Muestra estado completo en perfil
- **BridgeProgressIndicator**: Progreso durante KYC success
- **Manejo de errores**: Retry mechanisms y error display

### ✅ Store Management
- **useBridgeStore**: Zustand store con persistencia actualizado
- **Estados ToS**: `tosUrl`, `isPendingTosAcceptance`, `tosAgreementId`
- **Estado completo**: Customer ID, verification status, wallets
- **Retry logic**: Exponential backoff para operaciones fallidas

## 🔄 Flujo de Integración

### 1. Sandbox Mode (Development)
```
Usuario completa KYC → 
KYC status = 'completed' → 
Auto-generar dummy ToS → 
Auto-aceptar ToS → 
Customer creation → 
(Wallet creation skipped)
```

### 2. Production Mode
```
Usuario completa KYC → 
KYC status = 'completed' → 
POST /customers/tos_links → 
Mostrar BridgeToSWebView → 
Usuario acepta términos → 
Capturar signed_agreement_id → 
Customer creation → 
Wallet creation
```

## 📋 **ToS Flow - Documentación Bridge**

Según la [documentación oficial de Bridge](https://apidocs.bridge.xyz/docs/terms-of-service#tos-acceptance-for-a-new-customer):

### Production ToS Process:
1. **Generate ToS Link**: `POST /customers/tos_links`
2. **Show to User**: WebView/iFrame with generated URL
3. **Support redirect_uri**: `?redirect_uri=your-app.com/callback`
4. **User accepts**: Bridge redirects back with `signed_agreement_id`
5. **Create customer**: Using the valid `signed_agreement_id`

### Implemented Features:
- ✅ **POST /customers/tos_links** con redirect_uri support
- ✅ **BridgeToSWebView** component con WebView nativo
- ✅ **Captura automática** de signed_agreement_id
- ✅ **PostMessage listener** para alternativas de captura
- ✅ **Error handling** para cancelación/errores
- ✅ **Navigation state tracking** para redirecciones

## 🔄 Estados de Bridge Customer
- `pending`: Inicial, documentos enviados
- `in_review`: Documentos bajo revisión 
- `active`: ✅ Verificado y activo
- `rejected`: ❌ Rechazado
- `suspended`: Suspendido temporalmente

## 🔄 Estados de ToS
- `null`: No iniciado
- `isPendingTosAcceptance: true`: Esperando aceptación del usuario
- `hasAcceptedTermsOfService: true`: ToS aceptado, con signed_agreement_id

## 📱 Uso en la Aplicación

### Flujo Automático en KYC Success
```tsx
// En kyc-success.tsx
const { 
  isPendingTosAcceptance, 
  tosUrl, 
  handleTosAcceptance 
} = useBridgeStore();

// WebView se muestra automáticamente en producción
{showToSWebView && tosUrl && (
  <BridgeToSWebView
    visible={showToSWebView}
    tosUrl={tosUrl}
    onAccept={handleTosAccept}
    onClose={handleTosCancel}
    onError={handleTosError}
  />
)}
```

### En Profile Screen
```tsx
import { BridgeIntegrationCard } from '@/app/components/bridge/BridgeIntegrationCard';

// Muestra estado completo de Bridge including ToS
<BridgeIntegrationCard onViewWallets={handleViewWallets} />
```

### Usando Bridge Store
```tsx
import { useBridgeStore } from '@/app/store';

const { 
  bridgeCustomerId,
  bridgeVerificationStatus,
  hasAcceptedTermsOfService,
  isPendingTosAcceptance,
  tosUrl,
  wallets,
  syncCustomerStatus,
  handleTosAcceptance,
  showToSForUser
} = useBridgeStore();
```

## 🛠️ APIs Bridge Implementadas

### Terms of Service
- `POST /customers/tos_links` - Generar ToS (con redirect_uri)
- Captura de `signed_agreement_id` via URL params
- PostMessage support como alternativa

### Customer Management
- `POST /customers` - Crear customer (con signed_agreement_id)
- `GET /customers/{id}` - Obtener customer

### Wallet Management  
- `POST /customers/{id}/wallets` - Crear wallet (solo producción)
- `GET /customers/{id}/wallets` - Listar wallets

## 🔧 Servicios Implementados

### bridgeService.ts
```typescript
// Métodos principales actualizados
bridgeService.generateTosLink(redirectUri?: string)
bridgeService.createCustomer(kycProfile, signedAgreementId)
bridgeService.getCustomer(customerId)
bridgeService.createWallet(customerId, request)
bridgeService.getCustomerWallets(customerId)
bridgeService.syncCustomerStatus(customerId)
```

### bridgeStore.ts - Nuevos métodos ToS
```typescript
// ToS Flow Methods
showToSForUser(): Promise<{success, url?, error?}>
handleTosAcceptance(signedAgreementId): Promise<{success, error?}>
cancelTosFlow(): void
acceptTermsOfService(signedAgreementId): void

// Estados ToS
tosUrl: string | null
isPendingTosAcceptance: boolean
hasAcceptedTermsOfService: boolean
signedAgreementId: string | null
```

## 🔄 Retry y Error Handling

### Retry Automático
- **Exponential backoff**: 1s, 2s, 4s delays
- **Max retries**: 3 intentos

### ToS Error Handling
- **User cancellation**: Continúa sin Bridge wallet
- **Network errors**: Retry automático
- **Invalid URLs**: Fallback graceful
- **Timeout handling**: 24h expiration de ToS links

## 🧪 Testing

### Sandbox Testing
```bash
# Set environment
EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=true

# ToS will auto-accept with dummy agreement ID
```

### Production Testing
```bash
# Set environment
EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=false
EXPO_PUBLIC_APP_URL=https://your-production-app.com

# Real ToS WebView will be shown
```

## 🚨 Troubleshooting

### Common Issues:

1. **ToS WebView no se muestra**:
   - Verificar `EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=false`
   - Verificar `EXPO_PUBLIC_APP_URL` configurado
   - Verificar `EXPO_PUBLIC_BRIDGE_API_KEY` válido

2. **signed_agreement_id no se captura**:
   - Verificar redirect_uri en configuración
   - Verificar navegación WebView
   - Verificar PostMessage listeners

3. **Bridge customer creation fails**:
   - Verificar signed_agreement_id válido
   - Verificar datos KYC completos
   - Verificar API key y permissions

## 🔐 Security Notes

- **signed_agreement_id** se persiste localmente
- **WebView** usa configuración segura (domStorageEnabled, javaScriptEnabled)
- **API keys** nunca se exponen en client-side logs
- **Redirect URIs** deben ser HTTPS en producción 