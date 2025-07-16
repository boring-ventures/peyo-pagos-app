module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      'expo-secure-store',
    ],
    extra: {
      ...config.extra,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
      EXPO_PUBLIC_BRIDGE_API_URL: process.env.EXPO_PUBLIC_BRIDGE_API_URL,
      EXPO_PUBLIC_BRIDGE_API_KEY: process.env.EXPO_PUBLIC_BRIDGE_API_KEY,
      EXPO_PUBLIC_BRIDGE_SANDBOX_MODE: process.env.EXPO_PUBLIC_BRIDGE_SANDBOX_MODE,
    },
  };
}; 