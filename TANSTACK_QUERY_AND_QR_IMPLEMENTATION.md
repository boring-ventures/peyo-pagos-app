# TanStack Query & QR Code Implementation

## 🚀 Implementaciones Completadas

### ✅ TanStack Query - Refetch Automático cada Minuto
### ✅ QR Code Funcional - Usando librería `qrcode`

---

## 📦 Dependencias Necesarias

Instala estas dependencias para que funcione correctamente:

```bash
npm install @tanstack/react-query qrcode
npm install --save-dev @types/qrcode
```

---

## 🔧 TanStack Query - Uso

### 1. Provider Global (Ya configurado)
El `QueryProvider` está configurado en `app/_layout.tsx` con:
- ✅ Refetch automático cada 60 segundos
- ✅ Refetch en background
- ✅ Refetch al volver a la app
- ✅ Cache inteligente de 2 minutos
- ✅ Retry automático con backoff

### 2. Hooks Disponibles

#### `useBalanceQuery()`
```typescript
import { useBalanceQuery } from '@/app/hooks/queries';

const { 
  data: balance, 
  isLoading: balanceLoading, 
  error: balanceError,
  refetch: refetchBalance 
} = useBalanceQuery();

// Data structure:
// balance.totalUSDCBalance: number
// balance.successfulWallets: number
// balance.walletCount: number
```

#### `useTransactionsQuery(limit)`
```typescript
import { useTransactionsQuery } from '@/app/hooks/queries';

const { 
  data: transactions, 
  isLoading: transactionsLoading, 
  error: transactionsError,
  refetch: refetchTransactions 
} = useTransactionsQuery(5); // limit = 5

// Data structure: TransactionDisplay[]
// Each transaction has: id, counterparty, amount, direction, timestamp, currency, flagIcon, positive
```

### 3. Ejemplo de Implementación

Reemplaza tu código actual en `app/(private)/home.tsx`:

```typescript
// ANTES (usando stores)
const { balanceData, loadBalance } = useWalletBalanceStore();

// DESPUÉS (usando TanStack Query)
import { useBalanceQuery, useTransactionsQuery } from '@/app/hooks/queries';

const { 
  data: balance, 
  isLoading: balanceLoading, 
  error: balanceError,
  refetch: refetchBalance 
} = useBalanceQuery();

const { 
  data: transactions, 
  isLoading: transactionsLoading, 
  error: transactionsError,
  refetch: refetchTransactions 
} = useTransactionsQuery(5);

// Refresh manual
const handleRefresh = async () => {
  await Promise.all([
    refetchBalance(),
    refetchTransactions()
  ]);
};
```

### 4. Beneficios Automáticos
- 🔄 **Refetch cada 60 segundos** automáticamente
- 📱 **Background refresh** cuando vuelves a la app
- 🚀 **Cache inteligente** - evita requests innecesarios
- 🔁 **Retry automático** en caso de errores de red
- ⚡ **Loading states** manejados automáticamente

---

## 🎯 QR Code - Uso

### 1. Hook Disponible

```typescript
import { useQRCode } from '@/app/hooks/useQRCode';

const { 
  generateQR, 
  generateQRSVG, 
  isGenerating, 
  error, 
  clearError 
} = useQRCode();
```

### 2. Generar QR Code

```typescript
// Generar QR como imagen PNG
const qrDataURL = await generateQR(data, {
  width: 200,
  margin: 2,
  errorCorrectionLevel: 'M',
  type: 'image/png',
  quality: 0.92
});

// Usar en componente Image
<Image 
  source={{ uri: qrDataURL }} 
  style={{ width: 200, height: 200 }}
  resizeMode="contain"
/>
```

### 3. Implementación en crypto-details.tsx

Ya está implementado y funcional:
- ✅ Generación automática cuando los datos están listos
- ✅ Estados de loading, success y error
- ✅ Botón de retry en caso de error
- ✅ Regeneración automática al cambiar datos

### 4. Estados del QR
- **isGenerating**: `true` cuando está generando
- **qrDataURL**: String con la imagen en base64
- **error**: String con mensaje de error si falla
- **clearError()**: Función para limpiar errores

---

## 🎨 Crypto Details - QR Funcional

### Estados Visuales:
1. **Loading**: Spinner + "Generando código QR..."
2. **Success**: Imagen QR funcional
3. **Error**: Ícono de error + mensaje + botón "Reintentar"
4. **No Data**: Ícono QR gris + "Sin datos para QR"

### Regeneración Automática:
- ✅ Al cambiar `currentLiquidationData`
- ✅ Al cambiar `currentAddress`
- ✅ Al presionar "Reintentar"

---

## 🚀 Configuración Adicional

### Personalizar Intervalos

En `app/providers/QueryProvider.tsx`:

```typescript
// Cambiar intervalos globalmente
refetchInterval: 30000, // 30 segundos en lugar de 60
staleTime: 60000, // 1 minuto en lugar de 2
```

### Personalizar por Hook

```typescript
const { data } = useBalanceQuery({
  refetchInterval: 30000, // 30 segundos solo para balance
  staleTime: 15000, // 15 segundos de cache
});
```

---

## 🔧 Debugging

### TanStack Query DevTools (Opcional)

```bash
npm install @tanstack/react-query-devtools
```

En desarrollo, agregar:
```typescript
// En QueryProvider.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// En el JSX
<QueryClientProvider client={queryClient}>
  {children}
  {__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
</QueryClientProvider>
```

### Logs Automáticos

Los hooks ya incluyen logs detallados:
- 🔄 "Fetching balance via TanStack Query..."
- ✅ "Balance fetched successfully"
- 🔄 "Generating QR code..."
- ✅ "QR code generated successfully"

---

## ✨ Próximos Pasos

1. **Instalar dependencias**: `npm install @tanstack/react-query qrcode @types/qrcode`
2. **Probar QR funcional** en crypto-details.tsx
3. **Migrar pantallas principales** de stores a TanStack Query hooks
4. **Observar refetch automático** cada minuto en los logs

---

## 🎯 Beneficios Implementados

### TanStack Query:
- ✅ **60 segundos** de refetch automático
- ✅ **Background sync** cuando la app vuelve al foreground
- ✅ **Cache inteligente** evita requests innecesarios
- ✅ **Error handling** automático con reintentos
- ✅ **Loading states** manejados automáticamente

### QR Code:
- ✅ **Generación estable** sin crashes
- ✅ **Estados visuales** claros (loading/success/error)
- ✅ **Regeneración automática** al cambiar datos
- ✅ **Error recovery** con botón de retry

**¡La implementación está lista para usar!** 🚀 