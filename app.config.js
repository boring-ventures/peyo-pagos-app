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
      EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
      // Moon API Configuration
      EXPO_PUBLIC_MOON_API_BASE_URL: process.env.EXPO_PUBLIC_MOON_API_BASE_URL,
      EXPO_PUBLIC_MOON_API_KEY: process.env.EXPO_PUBLIC_MOON_API_KEY,
      EXPO_PUBLIC_MOON_CARD_PRODUCT_ID: process.env.EXPO_PUBLIC_MOON_CARD_PRODUCT_ID,
    },
  };
}; 