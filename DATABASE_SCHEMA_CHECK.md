# Database Schema Check - bridge_raw_request Field

## ⚠️ ACCIÓN REQUERIDA

Necesitas agregar el campo `bridge_raw_request` a la tabla `kyc_profiles` en Supabase.

## 🔧 Script SQL para Supabase

Ve a tu Supabase Dashboard → SQL Editor y ejecuta:

```sql
-- Agregar campo bridge_raw_request a la tabla kyc_profiles
ALTER TABLE kyc_profiles 
ADD COLUMN IF NOT EXISTS bridge_raw_request JSONB;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN kyc_profiles.bridge_raw_request IS 'Datos exactos enviados a Bridge API para crear customer (para auditoría y debugging)';

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'kyc_profiles' 
AND column_name IN ('bridge_raw_request', 'bridge_raw_response');
```

## ✅ Verificación

Después de ejecutar el SQL, deberías ver:

```
column_name          | data_type | is_nullable
---------------------|-----------|------------
bridge_raw_request   | jsonb     | YES
bridge_raw_response  | jsonb     | YES
```

## 🔄 Estructura Completa de bridge_raw_request

El campo guardará exactamente la request que se envía a Bridge:

```json
{
  "type": "individual",
  "first_name": "Usuario",
  "last_name": "Demo", 
  "email": "usuario@demo.com",
  "birth_date": "1995-01-01",
  "signed_agreement_id": "tos-abc123",
  "residential_address": {
    "street_line_1": "Calle Principal 123",
    "city": "Cochabamba",
    "country": "BO"
  },
  "identifying_information": [
    {
      "type": "national_id",
      "issuing_country": "bo",
      "number": "1234567890",
      "image_front": "data:image/jpeg;base64,/9j/4AAQ...",
      "image_back": "data:image/jpeg;base64,/9j/4AAQ..."
    }
  ]
}
```

## 🎯 Beneficios

- **Auditoría completa**: Saber exactamente qué se envió a Bridge
- **Debugging**: Reproducir requests problemáticas
- **Compliance**: Registro de datos para regulaciones
- **Soporte**: Enviar datos exactos a Bridge support si hay issues 