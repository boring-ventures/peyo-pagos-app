/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Updated with Peyo's brand identity colors.
 */

// Peyo Brand Colors
const brandColors = {
  primary: '#4ECDC4',        // Primary Turquoise from logo
  primaryDark: '#1A2B42',    // Dark navy from logo text
  primaryLight: '#7FDBDA',   // Lighter variant of turquoise
  primaryContrast: '#FFFFFF', // White for contrast
};

const tintColorLight = brandColors.primary;
const tintColorDark = brandColors.primaryLight;

export const Colors = {
  // Brand color constants for consistent usage
  brand: {
    primary: '#4ECDC4',
    primaryDark: '#1A2B42',
    primaryLight: '#7FDBDA',
    primaryContrast: '#FFFFFF',
    // Additional brand color variants
    primaryHover: '#3DB5B0',    // Darker turquoise for hover states
    primaryDisabled: '#A8E6E2',  // Lighter turquoise for disabled states
  },
  light: {
    text: '#1A2B42',              // Use brand dark for main text
    textSecondary: '#5A6B7F',     // Softer variant of brand dark
    background: '#FFFFFF',         // Pure white background
    backgroundSecondary: '#F8FAFA', // Very light gray with hint of turquoise
    backgroundTertiary: '#F0F6F6',  // Slightly more turquoise tint
    tint: tintColorLight,          // Brand primary turquoise
    icon: '#5A6B7F',              // Softer icon color
    tabIconDefault: '#8A9BA8',     // Muted tab icons
    tabIconSelected: tintColorLight, // Active tab uses brand color
    border: '#E1E8EA',            // Light border with subtle turquoise hint
    card: '#FFFFFF',              // Pure white cards
    notification: '#FF4757',       // Bright red for notifications
    success: '#2ED573',           // Green that complements turquoise
    error: '#FF4757',             // Consistent error red
    warning: '#FFA726',           // Orange warning
    info: '#4ECDC4',              // Use brand primary for info
  },
  dark: {
    text: '#FFFFFF',              // Pure white text
    textSecondary: '#B8C5D1',     // Light gray text
    background: '#1A2B42',        // Use brand dark as main background
    backgroundSecondary: '#243447', // Slightly lighter navy
    backgroundTertiary: '#2E3F54', // Even lighter navy variant
    tint: tintColorDark,          // Lighter turquoise for dark mode
    icon: '#B8C5D1',             // Light gray icons
    tabIconDefault: '#8A9BA8',    // Muted tab icons
    tabIconSelected: tintColorDark, // Active tab uses light turquoise
    border: '#354A61',           // Dark border
    card: '#243447',             // Dark card background
    notification: '#FF6B7A',      // Softer red for dark mode
    success: '#4CD471',          // Brighter green for dark mode
    error: '#FF6B7A',            // Softer error red for dark mode
    warning: '#FFBD4A',          // Brighter orange for dark mode
    info: '#7FDBDA',             // Light turquoise for info in dark mode
  },
};

export default Colors; 