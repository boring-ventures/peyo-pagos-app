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
```

**⚠️ IMPORTANTE**: 
- Para producción, cambia la URL a `https://api.bridge.xyz/v0` 
- Cambia `EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=false` para producción
- Obtén tu API key desde [Bridge.xyz Dashboard](https://bridge.xyz/dashboard)

### 2. Reiniciar la Aplicación

Después de agregar las variables de entorno:

```bash
npx expo start --clear
```

## 🌟 Características Implementadas

### ✅ Integración Automática
- **Trigger automático**: Se inicia cuando KYC se completa exitosamente
- **ToS automático**: Términos de servicio aceptados automáticamente
- **Customer creation**: Cliente Bridge creado usando datos KYC
- **Wallet creation**: Wallet USDC en Base network por defecto

### ✅ UI Components
- **BridgeIntegrationCard**: Muestra estado completo en perfil
- **BridgeProgressIndicator**: Progreso durante KYC success
- **Manejo de errores**: Retry mechanisms y error display

### ✅ Store Management
- **useBridgeStore**: Zustand store con persistencia
- **Estado completo**: Customer ID, verification status, wallets
- **Retry logic**: Exponential backoff para operaciones fallidas

## 🔄 Flujo de Integración

### 1. Activación Automática
```
Usuario completa KYC → 
KYC status = 'completed' → 
Trigger automático Bridge → 
ToS acceptance → 
Customer creation → 
Wallet creation
```

### 2. Estados de Bridge Customer
- `pending`: Inicial, documentos enviados
- `in_review`: Documentos bajo revisión 
- `active`: ✅ Verificado y activo
- `rejected`: ❌ Rechazado
- `suspended`: Suspendido temporalmente

### 3. Capabilities
- `payin_crypto`: Capacidad de recibir crypto
- `payout_crypto`: Capacidad de enviar crypto
- `enabled`/`disabled`/`pending`/`restricted`

## 📱 Uso en la Aplicación

### En Profile Screen
```tsx
import { BridgeIntegrationCard } from '@/app/components/bridge/BridgeIntegrationCard';

// Muestra estado completo de Bridge
<BridgeIntegrationCard onViewWallets={handleViewWallets} />
```

### Durante KYC Success
```tsx
import { BridgeProgressIndicator } from '@/app/components/bridge/BridgeProgressIndicator';

// Muestra progreso de integración
<BridgeProgressIndicator showOnlyWhenActive={false} />
```

### Usando Bridge Store
```tsx
import { useBridgeStore } from '@/app/store';

const { 
  bridgeCustomerId,
  bridgeVerificationStatus,
  wallets,
  syncCustomerStatus,
  retryFailedOperation 
} = useBridgeStore();
```

## 🛠️ APIs Bridge Implementadas

### Customer Management
- `POST /customers/tos_links` - Generar ToS
- `POST /customers` - Crear customer
- `GET /customers/{id}` - Obtener customer

### Wallet Management  
- `POST /customers/{id}/wallets` - Crear wallet
- `GET /customers/{id}/wallets` - Listar wallets

## 🔧 Servicios Implementados

### bridgeService.ts
```typescript
// Métodos principales
bridgeService.generateTosLink()
bridgeService.createCustomer(kycProfile, agreementId)
bridgeService.getCustomer(customerId)
bridgeService.createWallet(customerId, request)
bridgeService.getCustomerWallets(customerId)
bridgeService.syncCustomerStatus(customerId)
```

### kycService.ts (Actualizado)
```typescript
// Nuevos métodos Bridge
kycService.initializeBridgeIntegration()
kycService.retryBridgeIntegration()
kycService.getBridgeIntegrationStatus()
```

## 🔄 Retry y Error Handling

### Retry Automático
- **Exponential backoff**: 1s, 2s, 4s delays
- **Max retries**: 3 intentos
- **Retry triggers**: Network errors, API failures

### Error Recovery
```typescript
const { retryFailedOperation } = useBridgeStore();

// Retry manual
await retryFailedOperation(async () => {
  return kycService.retryBridgeIntegration();
});
```

## 🧪 Testing

### Test Bridge Connection
```typescript
import { bridgeService } from '@/app/services/bridgeService';

// Test API connectivity
const result = await bridgeService.testConnection();
console.log('Bridge connected:', result.success);
```

### Mock KYC Data
```typescript
// Datos de prueba para Bolivia
const mockKycProfile = {
  userId: 'test-user',
  email: 'test@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: '1990-01-01',
  phone: '+59175469425',
  address: {
    streetLine1: 'Av. 6 de Agosto 123',
    city: 'La Paz',
    country: 'BO'
  },
  identifyingInfo: {
    type: 'national_id',
    issuingCountry: 'BO',
    imageFront: 'base64_image_data'
  }
};
```

## 🚨 Troubleshooting

### Error: "Bridge API key is missing"
- Verifica que `EXPO_PUBLIC_BRIDGE_API_KEY` esté configurada
- Reinicia la app con `--clear`

### Error: "Network error"
- Verifica conectividad a internet
- Confirma que Bridge API URL es correcta
- Revisa API key permissions en Bridge Dashboard

### Error: "Incomplete KYC data"
- Todos los campos KYC requeridos deben estar completos
- Verifica que documentos estén cargados
- Confirma formato de fechas (YYYY-MM-DD)

### Customer Status "pending" por mucho tiempo
- Sincroniza status: `syncCustomerStatus()`
- Revisa Bridge Dashboard para detalles
- Contacta soporte Bridge si es necesario

## 🔐 Seguridad

### Variables de Entorno
- **Nunca** hardcodees API keys en el código
- Usa diferentes keys para sandbox/production
- Rota keys regularmente

### Datos Sensibles
- KYC data solo se envía una vez a Bridge
- No almacenes documentos en storage local
- Bridge IDs se persisten de forma segura

## 📊 Monitoreo

### Logs Bridge
```typescript
// Los logs Bridge usan prefijos específicos
console.log('🌉 Bridge API...')  // API calls
console.log('✅ Bridge...')      // Success
console.log('💥 Bridge...')      // Errors
```

### Status Checks
```typescript
const bridgeStatus = kycService.getBridgeIntegrationStatus();
console.log('Bridge ready:', bridgeStatus.isReady);
console.log('Customer active:', bridgeStatus.isActive);
console.log('Has wallet:', bridgeStatus.hasWallet);
```

## 🚀 Próximos Pasos

1. **Configurar Bridge Dashboard** con tu cuenta
2. **Obtener API keys** (sandbox y production)
3. **Probar flujo completo** con datos de test
4. **Configurar webhooks** para updates automáticos
5. **Implementar wallet screen** dedicada
6. **Agregar más currencies** (BTC, ETH, etc.)

---

¡Tu integración Bridge.xyz está lista! 🎉 