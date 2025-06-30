# Supabase Setup for Authentication

This document describes how to set up Supabase for authentication in the app.

## Step 1: Create a Supabase Account

1. Go to [Supabase](https://supabase.com/) and create an account or log in.
2. Create a new project.
3. Note your project's URL and anon key, which you'll need later.

## Step 2: Configure Authentication

1. In the Supabase dashboard, go to "Authentication" > "Settings".
2. Make sure "Email Auth" is enabled.
3. Set the redirect URL if needed.

## Step 3: Create the Profiles Table

1. Go to "SQL Editor" in Supabase.
2. Run the following SQL to create the profiles table:

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

3. Then, run the following SQL to create the trigger and function:

```sql
-- Create a function to run after a user registers
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

-- Create a trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root (or edit the existing one).
2. Add the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars
```

Replace the values with those from your Supabase project.

## Step 5: Restart the App

1. Stop the app if it's running.
2. Run `npx expo start --go` to restart the app with the new environment variables.

## Step 6: Configure Storage Policies

1. In Supabase, go to "Storage".
2. Create a new bucket named `avatars` and enable the `Public Bucket` option.
3. Go to "SQL Editor" in Supabase.
4. Run the following SQL to set up storage policies for uploading images to the `avatars` bucket:

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

## Troubleshooting

- If you have issues with authentication, check the logs in the development console.
- Make sure your environment variables are set correctly.
- Verify that the profiles table was created successfully in Supabase.
- Ensure that email authentication is enabled in Supabase.
