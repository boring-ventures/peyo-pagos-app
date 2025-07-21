# 📝 Actualización .env Required

## ⚠️ AGREGAR ESTA LÍNEA A TU .env

Agrega esta línea después de `EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=true`:

```env
# App Configuration (requerido para ToS redirect en producción)
# Para desarrollo: usar deep link scheme
# Para producción: usar URL real de la app
EXPO_PUBLIC_APP_URL=peyopagos://
```

## 📋 Tu .env completo debería verse así:

```env
# Supabase Project Settings
EXPO_PUBLIC_SUPABASE_URL=https://hyxxamyqorfgzwbbiicx.supabase.co
# Cliente principal (anon key) - para operaciones normales del usuario
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eHhhbXlxb3JmZ3p3YmJpaWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODM2OTYsImV4cCI6MjA2ODE1OTY5Nn0.uHw1eVmxUBH4bkAOXT34m549Ei4h91DKwoZ5iTkdKm4

# Cliente administrativo (service_role) - para operaciones administrativas
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eHhhbXlxb3JmZ3p3YmJpaWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU4MzY5NiwiZXhwIjoyMDY4MTU5Njk2fQ.jhfrSNHalYdj_pFC1VwWOGtU5grVMme34gTWIoeIJGk
# Storage
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=documents

# Bridge.xyz Configuration
EXPO_PUBLIC_BRIDGE_API_URL=https://api.sandbox.bridge.xyz/v0
EXPO_PUBLIC_BRIDGE_API_KEY=sk-test-aaeb4f566c7f4b7eab24201d9e2af041
EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=true

# App Configuration (requerido para ToS redirect en producción)
# Para desarrollo: usar deep link scheme
# Para producción: usar URL real de la app
EXPO_PUBLIC_APP_URL=peyopagos://

# Phone Verification Control
EXPO_PUBLIC_PHONE_VERIFICATION_ENABLED=false
```

## 🔄 **Opciones para EXPO_PUBLIC_APP_URL**

### **Para Desarrollo (tu caso actual):**
```env
EXPO_PUBLIC_APP_URL=peyopagos://
```

### **Para Producción (cuando publiques):**
```env
EXPO_PUBLIC_APP_URL=https://app.peyopagos.com
```

## 🎯 **¿Por qué necesitas esto?**

1. **Bridge ToS Redirect**: Cuando el usuario acepta términos en Bridge, necesita regresar a tu app
2. **Deep Linking**: Permite que Bridge redirija de vuelta a tu aplicación
3. **Callback Handling**: La nueva pantalla `bridge-tos-callback.tsx` maneja el regreso

## ✅ **Después de agregar la variable:**

1. Reinicia la app: `npx expo start --clear`
2. La función `showToSForUser` usará: `peyopagos://bridge-tos-callback`
3. En producción usará: `https://app.peyopagos.com/bridge-tos-callback`

## 🔗 **Deep Link Schemes Configurados:**

- **Desarrollo**: `peyopagos://` (consistente con tu bundle ID)
- **Producción Web**: `https://peyopagos.com`
- **Producción App**: `https://app.peyopagos.com` 