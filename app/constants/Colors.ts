/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Updated with Peyo's brand identity colors.
 *
 * The brand identity is theme-dependent:
 * - Light Theme: Main colors are Navy (#0B1E3D) and Cyan (#6DDADB).
 * - Dark Theme: Main colors are Green (#61D372) and Light Gray (#F0F0F0).
 */

const brandColors = {
  navy: '#0B1E3D',
  cyan: '#6DDADB',
  green: '#61D372',
  lightGray: '#F0F0F0',
  white: '#FFFFFF',
};

// Tint color is the main interactive color for the theme.
const tintColorLight = brandColors.cyan;
const tintColorDark = brandColors.green;

export const Colors = {
  // This block is for general reference; true colors are defined in light/dark themes.
  brand: {
    primary: brandColors.cyan,
    primaryDark: brandColors.navy,
    primaryLight: brandColors.green,
    primaryContrast: brandColors.lightGray,
  },
  light: {
    text: brandColors.navy,
    textSecondary: '#5A6978', // Softer navy/gray for less emphasis
    background: brandColors.white,
    backgroundSecondary: brandColors.lightGray,
    backgroundTertiary: brandColors.cyan,
    tint: tintColorLight,
    icon: brandColors.navy,
    tabIconDefault: brandColors.navy, // Use navy for inactive for better accessibility
    tabIconSelected: tintColorLight,
    border: '#E1E8EA',
    card: brandColors.white,
    notification: '#FF4757',
    success: brandColors.green,
    error: '#FF4757',
    warning: '#FFA726',
    info: brandColors.cyan,
  },
  dark: {
    text: brandColors.lightGray,
    textSecondary: brandColors.cyan,
    background: brandColors.navy,
    backgroundSecondary: '#142A4D', // Slightly lighter navy
    backgroundTertiary: brandColors.cyan,
    tint: tintColorDark,
    icon: brandColors.cyan,
    tabIconDefault: brandColors.cyan,
    tabIconSelected: tintColorDark,
    border: '#354A61',
    card: '#142A4D',
    notification: '#FF6B7A',
    success: brandColors.green,
    error: '#FF6B7A',
    warning: '#FFBD4A',
    info: brandColors.cyan,
  },
};

export default Colors; 