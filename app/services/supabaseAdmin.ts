import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import "react-native-url-polyfill/auto";

// Obtener variables de entorno para el cliente administrativo
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase URL or service_role key is missing. Please check your .env file."
  );
}

// Cliente administrativo con service_role key
// ⚠️ USAR SOLO PARA OPERACIONES ADMINISTRATIVAS ESPECÍFICAS
export const supabaseAdmin = createClient(
  supabaseUrl || "", 
  supabaseServiceRoleKey || "", 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabaseAdmin; 