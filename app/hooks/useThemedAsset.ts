import { useColorScheme } from '@/app/hooks/useColorScheme';
import { ImageSourcePropType } from 'react-native';

/**
 * Hook para cargar assets según el tema actual (claro u oscuro)
 * @param lightAsset - Asset para el tema claro
 * @param darkAsset - Asset para el tema oscuro
 * @returns ImageSourcePropType - El asset correspondiente al tema actual
 */
export function useThemedAsset(
  lightAsset: ImageSourcePropType,
  darkAsset: ImageSourcePropType
): ImageSourcePropType {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkAsset : lightAsset;
} 