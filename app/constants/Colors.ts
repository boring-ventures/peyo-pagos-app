/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Updated with Peyo's brand identity colors.
 */

// Peyo Brand Colors
const brandColors = {
  primary: '#61D372',        // Green
  primaryDark: '#0B1E3D',    // Navy
  primaryLight: '#6DDADB',   // Light Cyan
  primaryContrast: '#F0F0F0', // Light Gray/White
};

const tintColorLight = brandColors.primary;
const tintColorDark = brandColors.primaryLight;

export const Colors = {
  // Brand color constants for consistent usage
  brand: {
    primary: '#61D372',
    primaryDark: '#0B1E3D',
    primaryLight: '#6DDADB',
    primaryContrast: '#F0F0F0',
    // Additional brand color variants
    primaryHover: '#4DB05E',    // Slightly darker green for hover
    primaryDisabled: '#A8E6E2',  // Lighter cyan for disabled
  },
  light: {
    text: '#0B1E3D',              // Navy for main text
    textSecondary: '#4DB05E',     // Softer green
    background: '#F0F0F0',        // Light gray background
    backgroundSecondary: '#FFFFFF', // Pure white for cards
    backgroundTertiary: '#6DDADB',  // Cyan accent
    tint: tintColorLight,          // Brand green
    icon: '#4DB05E',              // Softer green icon
    tabIconDefault: '#6DDADB',     // Cyan for default tab
    tabIconSelected: tintColorLight, // Active tab uses brand green
    border: '#E1E8EA',            // Light border
    card: '#FFFFFF',              // Pure white cards
    notification: '#FF4757',       // Red for notifications
    success: '#61D372',           // Brand green for success
    error: '#FF4757',             // Error red
    warning: '#FFA726',           // Orange warning
    info: '#6DDADB',              // Cyan for info
  },
  dark: {
    text: '#F0F0F0',              // Light gray text
    textSecondary: '#6DDADB',      // Cyan text
    background: '#0B1E3D',        // Navy background
    backgroundSecondary: '#142A4D', // Slightly lighter navy
    backgroundTertiary: '#6DDADB', // Cyan accent
    tint: tintColorDark,           // Cyan for tint
    icon: '#6DDADB',               // Cyan icons
    tabIconDefault: '#6DDADB',     // Cyan for default tab
    tabIconSelected: tintColorDark, // Active tab uses cyan
    border: '#354A61',             // Dark border
    card: '#142A4D',               // Navy card background
    notification: '#FF6B7A',       // Red for notifications
    success: '#61D372',            // Brand green for success
    error: '#FF6B7A',              // Error red
    warning: '#FFBD4A',            // Orange warning
    info: '#6DDADB',               // Cyan for info
  },
};

export default Colors; 