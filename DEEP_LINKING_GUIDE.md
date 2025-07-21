# 🔗 Deep Linking Guide - Peyo Pagos

## 🎯 **¿Qué puedes hacer con Deep Linking?**

Navegar directamente a cualquier pantalla de tu app usando URLs especiales, ¡perfecto para testing y UX!

## 🧪 **Cómo probar (con la app corriendo):**

### **1. Instalar herramienta (una sola vez):**
```bash
npm install -g @expo/cli
```

### **2. Comandos para probar:**

#### **📱 Pantallas Públicas** (sin login):
```bash
# Ir directo al login
npx uri-scheme open peyopagos://login --ios

# Ir directo al registro
npx uri-scheme open peyopagos://register --ios

# Ir directo a recuperar contraseña
npx uri-scheme open peyopagos://forgot-password --ios

# Ir directo a verificación OTP
npx uri-scheme open peyopagos://otp-verification --ios
```

#### **🔐 Pantallas Privadas** (requiere login):
```bash
# Ir directo al home
npx uri-scheme open peyopagos://home --ios

# Ir directo al perfil
npx uri-scheme open peyopagos://profile --ios

# Ir directo a editar perfil
npx uri-scheme open peyopagos://edit-profile --ios

# Ir directo a configuración de seguridad
npx uri-scheme open peyopagos://security-settings --ios
```

#### **📋 Pantallas KYC**:
```bash
# Ir directo a bienvenida KYC
npx uri-scheme open peyopagos://kyc-welcome --ios

# Ir directo a información personal
npx uri-scheme open peyopagos://kyc-personal --ios

# Ir directo a éxito KYC
npx uri-scheme open peyopagos://kyc-success --ios
```

#### **🌉 Bridge Callback**:
```bash
# Probar callback de Bridge (con parámetros)
npx uri-scheme open "peyopagos://bridge-tos-callback?signed_agreement_id=test123" --ios
```

## 📱 **Para Android** (si tienes Android):
```bash
# Cambiar --ios por --android
npx uri-scheme open peyopagos://login --android
```

## 🎮 **Casos de uso prácticos:**

### **1. Testing rápido:**
En lugar de navegar manualmente:
- Login → Home → Profile → Security Settings
- Usa: `npx uri-scheme open peyopagos://security-settings --ios`

### **2. Debug específico:**
- Problema en la pantalla de KYC éxito
- Usa: `npx uri-scheme open peyopagos://kyc-success --ios`

### **3. Demo a clientes:**
- Mostrar funcionalidad específica
- Usar links directos para ir rápido

### **4. QA Testing:**
- Probar estados específicos
- Saltar pasos de navegación

## 🔧 **URLs con parámetros:**

### **Ejemplos avanzados:**
```bash
# OTP con teléfono pre-llenado
npx uri-scheme open "peyopagos://otp-verification?phone=+59112345678" --ios

# Bridge callback con datos reales
npx uri-scheme open "peyopagos://bridge-tos-callback?signed_agreement_id=real-id-123&status=accepted" --ios
```

## 📋 **Cheat Sheet de comandos:**

### **Quick Testing:**
```bash
# Testing básico de navegación
npx uri-scheme open peyopagos://login --ios
npx uri-scheme open peyopagos://home --ios
npx uri-scheme open peyopagos://profile --ios

# Testing KYC flow
npx uri-scheme open peyopagos://kyc-welcome --ios
npx uri-scheme open peyopagos://kyc-success --ios

# Testing Bridge
npx uri-scheme open peyopagos://bridge-tos-callback --ios
```

## 🎯 **¿Qué pantalla usa cada comando?**

| Comando | Pantalla | Archivo |
|---------|----------|---------|
| `peyopagos://login` | Login | `app/(public)/login.tsx` |
| `peyopagos://home` | Home | `app/(private)/home.tsx` |
| `peyopagos://profile` | Perfil | `app/(private)/profile.tsx` |
| `peyopagos://kyc-success` | KYC Éxito | `app/(auth)/kyc-success.tsx` |
| `peyopagos://bridge-tos-callback` | Bridge Callback | `app/(public)/bridge-tos-callback.tsx` |

## 💡 **Tips pro:**

### **1. Combinar con logs:**
```bash
# En terminal 1: ver logs
npx expo start

# En terminal 2: abrir deep link
npx uri-scheme open peyopagos://login --ios
```

### **2. Testing de estados:**
- Usa diferentes combinaciones para probar edge cases
- Simula flujos complejos sin navegación manual

### **3. Para demos:**
- Prepara una lista de links útiles
- Navega rápido entre pantallas importantes

## 🔄 **Restart necesario:**
Después de cambiar `app.json`, reinicia:
```bash
npx expo start --clear
``` 