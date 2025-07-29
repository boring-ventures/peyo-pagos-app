# TanStack Query Verification Guide & QR Code Fix

## 🎯 TanStack Query Verification

### How to Verify TanStack Query is Working

#### 1. **Visual Indicators in the App**
- **Home Screen**: Look for the "TanStack Query Status" section
- **Status Indicators**:
  - 🔄 **Loading**: Query is fetching data
  - ✅ **Success**: Data loaded successfully
  - ❌ **Error**: Query failed
  - ⏸️ **Disabled**: Query is not enabled (usually when `bridgeCustomerId` is missing)

#### 2. **Console Logs**
Check your development console for these messages:
```
🌐 TanStack Query: Balance query started
🌐 TanStack Query: Balance query success - $123.45
🌐 TanStack Query: Transactions query started
🌐 TanStack Query: Transactions query success - 5 transactions
```

#### 3. **Automatic Refresh Verification**
- **Every 60 seconds**: Data should automatically refresh
- **Background**: Continues refreshing even when app is in background
- **Network changes**: Refetches when connection is restored

#### 4. **React Query DevTools (Optional)**
If you want to install React Query DevTools for debugging:
```bash
npm install @tanstack/react-query-devtools
```

Then add to your `app/_layout.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Inside your QueryProvider
<QueryProvider>
  {children}
  {__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
</QueryProvider>
```

## 🔧 QR Code Fix Implementation

### What Was Fixed

#### **Problem**: Canvas Element Error
```
QR generation error: You need to specify a canvas element
```

#### **Root Cause**: 
The `qrcode` library's `toDataURL` method tries to use browser canvas APIs in React Native, which aren't available.

#### **Solution**: 
- **Modified `useQRCode` hook** to generate SVG strings instead of PNG data URLs
- **Updated `crypto-details.tsx`** to use `SvgXml` from `react-native-svg` for rendering
- **Leveraged existing `react-native-svg`** dependency (already installed)

### Technical Changes

#### 1. **useQRCode Hook** (`app/hooks/useQRCode.ts`)
```typescript
// Before: Generated PNG data URLs (caused canvas error)
const generateQR = async (data: string) => {
  return await QRCode.toDataURL(data, { type: 'image/png' });
};

// After: Generates SVG strings (works in React Native)
const generateQRSVG = async (data: string) => {
  return await QRCode.toString(data, { type: 'svg' });
};

const generateQR = async (data: string) => {
  return generateQRSVG(data); // Use SVG for React Native
};
```

#### 2. **QR Rendering** (`app/(private)/deposit/crypto-details.tsx`)
```typescript
// Before: Used Image component with data URL
<Image source={{ uri: qrDataURL }} style={styles.qrImage} />

// After: Uses SvgXml with SVG string
<SvgXml xml={qrSVG} width={200} height={200} />
```

### Benefits of SVG Approach
- ✅ **No canvas dependency**: Works natively in React Native
- ✅ **Scalable**: Vector graphics scale perfectly
- ✅ **Smaller size**: SVG strings are typically smaller than PNG data URLs
- ✅ **Better performance**: No image decoding required

## 🧪 Testing the Fixes

### 1. **Test QR Code Generation**
1. Navigate to `(private)/deposit/crypto-details.tsx`
2. Ensure you have liquidation data and addresses
3. QR code should generate automatically
4. Check for these console messages:
   ```
   🔄 Generating QR code...
   ✅ QR code generated successfully
   ```

### 2. **Test TanStack Query**
1. Navigate to `(private)/home.tsx`
2. Look for "TanStack Query Status" section
3. Verify status indicators show proper states
4. Wait 60 seconds to see automatic refresh

### 3. **Test Error Handling**
- **QR Errors**: Try with invalid data to see error states
- **Query Errors**: Disconnect network to see error handling
- **Retry Functionality**: Use retry buttons to test recovery

## 🔍 Debugging Tips

### TanStack Query Debugging
```typescript
// Add to any component to debug query state
const query = useBalanceQuery();
console.log('Query State:', {
  isLoading: query.isLoading,
  isError: query.isError,
  isSuccess: query.isSuccess,
  data: query.data,
  error: query.error,
  isFetching: query.isFetching,
  isStale: query.isStale
});
```

### QR Code Debugging
```typescript
// Add to crypto-details.tsx for QR debugging
useEffect(() => {
  console.log('QR Debug:', {
    hasLiquidationData: !!currentLiquidationData,
    hasAddress: !!currentAddress,
    qrSVG: qrSVG ? 'Generated' : 'Not generated',
    isGenerating: isGeneratingQR,
    error: qrError
  });
}, [currentLiquidationData, currentAddress, qrSVG, isGeneratingQR, qrError]);
```

## 📱 Expected Behavior

### TanStack Query
- **Initial Load**: Shows loading state, then success with data
- **Auto Refresh**: Every 60 seconds, shows fetching indicator
- **Background**: Continues working when app is minimized
- **Network Recovery**: Automatically refetches when connection returns

### QR Code
- **Auto Generation**: Generates when liquidation data and address are available
- **Loading State**: Shows "Generating código QR..." while processing
- **Success State**: Displays clean SVG QR code
- **Error State**: Shows error message with retry button
- **No Data State**: Shows "No hay datos para generar QR"

## 🚀 Performance Benefits

### TanStack Query
- **Intelligent Caching**: Reduces unnecessary API calls
- **Background Updates**: Keeps data fresh without user interaction
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Automatic retries with exponential backoff

### QR Code (SVG)
- **Faster Rendering**: No image decoding overhead
- **Memory Efficient**: Smaller memory footprint
- **Scalable**: Perfect quality at any size
- **Network Efficient**: Smaller data transfer

## ✅ Success Criteria

### TanStack Query Working When:
- [ ] Home screen shows "TanStack Query Status" section
- [ ] Status indicators show proper states (Loading/Success/Error)
- [ ] Data refreshes automatically every 60 seconds
- [ ] Console shows query lifecycle logs
- [ ] Background refresh works when app is minimized

### QR Code Working When:
- [ ] QR code generates without canvas errors
- [ ] SVG renders cleanly in the crypto details screen
- [ ] Loading, success, and error states display correctly
- [ ] Retry functionality works
- [ ] QR code is scannable and contains correct data

## 🔧 Troubleshooting

### If TanStack Query Not Working:
1. Check if `QueryProvider` is properly wrapped in `app/_layout.tsx`
2. Verify `bridgeCustomerId` exists in `useBridgeStore`
3. Check network connectivity
4. Review console for error messages

### If QR Code Still Failing:
1. Ensure `react-native-svg` is properly installed
2. Check that `qrcode` library is generating valid SVG
3. Verify liquidation data and address are available
4. Check console for specific error messages

### Common Issues:
- **"Query disabled"**: Usually means `bridgeCustomerId` is missing
- **"QR not generating"**: Check if liquidation data exists
- **"SVG not rendering"**: Verify `react-native-svg` installation
- **"Auto refresh not working"**: Check if app has background permissions