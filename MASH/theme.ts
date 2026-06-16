import { Platform } from 'react-native';

export const Theme = {
  colors: {
    // Brand & UI colors
    background: '#f7f9fb',
    surface: '#ffffff',
    primary: '#007aff',          // Luminous Health primary medical blue
    primaryContainer: '#0058bc', // Solid medical blue gradient start/finish
    secondary: '#006b5f',        // Teal
    secondaryContainer: '#62fae3', // Soft teal background
    tertiary: '#9e3d00',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    
    // Neutrals
    onSurface: '#191c1e',
    onSurfaceVariant: '#414755',
    onBackground: '#191c1e',
    outline: '#717786',
    outlineVariant: '#c1c6d7',
    
    // Status colors
    success: '#006b5f',
    warning: '#e28743',
    
    // Utilities
    white: '#ffffff',
    lightGray: '#eceef0',
    superLightGray: '#f2f4f6',
    shadowColor: '#717786',
  },
  
  roundness: {
    sm: 8,
    md: 12,
    lg: 24,    // Standard card radius
    xl: 32,
    full: 9999, // Pill shape
  },
  
  spacing: {
    unit: 8,
    containerPadding: 24, // Safe zone breathing room
    cardPadding: 24,
    stackGap: 16,
    touchTargetMin: 48,
    buttonHeight: 56,     // standard primary button height
    inputHeight: 60,      // standard form field height
  },
  
  typography: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontFamilyMedium: 'PlusJakartaSans_500Medium',
    fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
    fontFamilyBold: 'PlusJakartaSans_700Bold',
    
    // Pre-packaged text styles matching Design System spec
    displayLg: {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.64,
    },
    headlineMd: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.24,
    },
    headlineSm: {
      fontSize: 20,
      lineHeight: 28,
    },
    bodyLg: {
      fontSize: 18,
      lineHeight: 28,
    },
    bodyMd: {
      fontSize: 16,
      lineHeight: 24,
    },
    labelMd: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.14,
    },
    labelSm: {
      fontSize: 12,
      lineHeight: 16,
    }
  },
  
  shadows: {
    // Soft ambient level 1 shadow
    level1: {
      shadowColor: '#717786',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    // Deeper active glow shadow
    level2: {
      shadowColor: '#007aff',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 30,
      elevation: 8,
    }
  }
};
