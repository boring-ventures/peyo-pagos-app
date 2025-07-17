# Configuración de Variables de Entorno

Copia este contenido a un archivo `.env` en la raíz del proyecto:

```env
# Supabase Configuration
# Obtén estos valores de tu proyecto Supabase: https://app.supabase.com/
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars

# Bridge API Configuration  
# Para desarrollo usa sandbox, para producción cambia a la URL de producción
EXPO_PUBLIC_BRIDGE_API_URL=https://api.sandbox.bridge.xyz/v0
EXPO_PUBLIC_BRIDGE_API_KEY=your-bridge-api-key-here
EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=true

# App Configuration
# Requerido para el redirect_uri del ToS de Bridge en producción
EXPO_PUBLIC_APP_URL=https://your-app.com

# Feature Flags
EXPO_PUBLIC_PHONE_VERIFICATION_ENABLED=false
```

## Configuración Paso a Paso

### 1. Crear archivo .env
Crea un archivo llamado `.env` en la raíz del proyecto con el contenido de arriba.

### 2. Configurar Supabase
1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a Settings > API
4. Copia los valores:
   - **URL**: Project URL
   - **ANON_KEY**: anon public key
   - **SERVICE_ROLE_KEY**: service_role secret key

### 3. Configurar Bridge (opcional para desarrollo)
1. Regístrate en [Bridge.xyz](https://bridge.xyz/)
2. Obtén tu API key
3. Para desarrollo, deja `EXPO_PUBLIC_BRIDGE_SANDBOX_MODE=true`

### 4. Problema de RLS Detectado

Los logs muestran un error de permisos: `"permission denied for schema public"`

Para solucionarlo:

1. Ve a tu dashboard de Supabase
2. Ve a Authentication > Policies
3. Asegúrate de que las políticas RLS permitan las operaciones necesarias
4. O temporalmente desactiva RLS para desarrollo:

```sql
-- TEMPORALMENTE para desarrollo
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE identifying_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
```

⚠️ **IMPORTANTE**: Solo desactiva RLS en desarrollo. En producción siempre debe estar activado.

### 5. Reiniciar la aplicación
Después de configurar el `.env`:
```bash
npx expo start --clear
``` 