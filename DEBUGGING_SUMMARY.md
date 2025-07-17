# Resumen de Debugging: Problemas de Extracción de Datos

## 🔍 Problemas Identificados

### 1. **Error de RLS (Row Level Security)** ❌
**Problema:** `"permission denied for schema public"`
- Las consultas a la base de datos están siendo bloqueadas por políticas RLS
- Esto impide la lectura/escritura de datos de perfil y KYC

**Impacto:** 
- Los datos no se pueden leer de la base de datos
- Las operaciones de guardado pueden fallar

### 2. **Archivo .env Faltante** ❌  
**Problema:** No existe archivo `.env` con configuraciones
- Variables de Supabase no configuradas
- Variables de Bridge API faltantes

**Impacto:**
- La aplicación no puede conectarse a Supabase
- Bridge integration no funciona

### 3. **Bridge Integration Skipping Customer Creation** ❌
**Problema:** El log muestra `"Bridge already initialized for user"` sin crear customer
- La verificación de estado está fallando
- No se está ejecutando la creación real del customer

**Impacto:**
- No se crea el customer en Bridge
- No se guardan datos de Bridge en la DB

## 🔧 Soluciones Implementadas

### 1. **Logs Detallados Agregados** ✅
```typescript
// En bridgeStore.ts - initializeBridgeIntegration
console.log('🔍 Bridge integration state check:', {
  isInitialized: state.isInitialized,
  bridgeCustomerId: state.bridgeCustomerId,
  hasAcceptedTermsOfService: state.hasAcceptedTermsOfService,
  userId: kycProfile.userId,
  email: kycProfile.email
});
```

### 2. **Bridge Customer Creation Enhanced** ✅
```typescript
// En bridgeStore.ts - createBridgeCustomer
console.log('🌉 STARTING createBridgeCustomer:', {
  userId: kycProfile.userId,
  email: kycProfile.email,
  signedAgreementId,
  hasProfile: !!kycProfile
});
```

### 3. **Bridge Service Logging** ✅
```typescript
// En bridgeService.ts - createCustomer
console.log("🌉 BRIDGE SERVICE: Starting createCustomer");
console.log("🔍 Bridge API response:", {
  hasError: !!response.error,
  hasData: !!response.data,
  customerId: response.data?.id,
  endorsements: response.data?.endorsements?.length || 0
});
```

### 4. **Database Save Logging** ✅
```typescript
// En profileService.ts - updateBridgeIntegrationData
console.log('🔍 Step 1: Finding profile for user...', { userId });
console.log('🔍 Step 2: Updating KYC profile...', {
  profileId: profile.id,
  bridgeCustomerId,
  signedAgreementId
});
```

### 5. **Guardado de Datos Completo** ✅
Agregado guardado de:
- `bridge_customer_id` ✅
- `bridge_raw_response` ✅  
- `endorsements` ✅
- `signed_agreement_id` ✅

## 📋 Acciones Requeridas

### 1. **Configurar Variables de Entorno** 🔥 CRÍTICO
```bash
# Crear archivo .env usando ENV_SETUP.md como guía
cp ENV_SETUP.md .env
# Editar .env con valores reales de Supabase y Bridge
```

### 2. **Solucionar RLS** 🔥 CRÍTICO
**Opción A - Desarrollo (Temporal):**
```sql
-- En Supabase SQL Editor
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE identifying_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements DISABLE ROW LEVEL SECURITY;
```

**Opción B - Configurar Políticas RLS (Recomendado):**
```sql
-- Crear políticas RLS apropiadas para cada tabla
-- Ver SETUP_SUPABASE.md para ejemplos
```

### 3. **Reiniciar y Probar** 
```bash
npx expo start --clear
```

## 🧪 Próximas Pruebas

Con los logs agregados, ahora podrás ver exactamente:

1. **Si Bridge integration se ejecuta:**
   - Buscar: `"🔍 Bridge integration state check"`
   - Verificar: `isInitialized` y `bridgeCustomerId`

2. **Si se crea el customer:**
   - Buscar: `"🌉 STARTING createBridgeCustomer"`
   - Verificar: `"✅ Bridge customer created successfully"`

3. **Si se guardan los datos:**
   - Buscar: `"🔍 Step 1: Finding profile for user"`
   - Verificar: `"✅ Bridge integration data saved to database successfully"`
   - Verificar: `"✅ Bridge raw response saved to database successfully"`
   - Verificar: `"✅ Bridge endorsements saved to database successfully"`

## 🎯 Verificación en Base de Datos

Después de una ejecución exitosa, verificar en Supabase:

```sql
-- Verificar datos de Bridge guardados
SELECT 
  p.email,
  kp.bridge_customer_id,
  kp.signed_agreement_id,
  kp.bridge_raw_response,
  kp.tos_accepted_at
FROM profiles p
JOIN kyc_profiles kp ON kp.profile_id = p.id
WHERE p.userId = 'tu-user-id';

-- Verificar endorsements
SELECT * FROM endorsements WHERE kyc_profile_id IN (
  SELECT id FROM kyc_profiles WHERE profile_id IN (
    SELECT id FROM profiles WHERE userId = 'tu-user-id'
  )
);
``` 