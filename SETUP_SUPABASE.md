# Configuración de Supabase para la autenticación

Este documento describe cómo configurar Supabase para la autenticación en la aplicación.

## Paso 1: Crear una cuenta en Supabase

1. Ve a [Supabase](https://supabase.com/) y crea una cuenta o inicia sesión.
2. Crea un nuevo proyecto.
3. Anota el URL y la clave anónima de tu proyecto que necesitarás más adelante.

## Paso 2: Configurar la autenticación

1. En la interfaz de Supabase, ve a "Authentication" > "Settings".
2. Asegúrate de que la opción de "Email Auth" esté habilitada.
3. Configura la URL de redirección si es necesario.

## Paso 3: Crear la tabla de perfiles

1. Ve a "SQL Editor" en Supabase.
2. Ejecuta el siguiente código SQL para crear la tabla de perfiles:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT email_unique UNIQUE (email)
);
```

3. Luego, en otro "snnipet" ejecuta el siguiente código SQL para crear las funciones y el trigger:

```sql
-- Crear una función que se ejecutará después de un registro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear un trigger para cuando se crea un nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Paso 4: Configurar las variables de entorno

1. Crea un archivo `.env` en la raíz del proyecto (o edita el existente).
2. Añade las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars

```

Reemplaza los valores con los de tu proyecto de Supabase.

## Paso 5: Reiniciar la aplicación

1. Detén la aplicación si está en ejecución.
2. Ejecuta `npx expo start --go` para reiniciar la aplicación con las nuevas variables de entorno.

## Paso 6: Configurar las políticas de almacenamiento

1. Ve a "Storage" en Supabase.
2. Crea un nuevo bucket con el nombre `avatars` y activa la opción `Public Bucket`.
3. Ve a "SQL Editor" en Supabase.
2. Ejecuta el siguiente código SQL para configurar las políticas de almacenamiento necesarias para subir imágenes al bucket `avatars`.

```sql
-- Setup SQL for storage policies for avatars bucket

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() = owner
);

-- Allow public access to view avatars
CREATE POLICY "Allow public viewing of avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() = owner
);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid() = owner
);
```

## Solución de problemas

- Si tienes problemas con la autenticación, verifica los logs en la consola de desarrollo.
- Asegúrate de que las variables de entorno estén configuradas correctamente.
- Verifica que la tabla de perfiles se haya creado correctamente en Supabase.
- Comprueba que la autenticación con email esté habilitada en Supabase.
