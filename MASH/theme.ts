import { Platform } from 'react-native';

export const Theme = {
  colors: {
    // Clinical Intelligence Redesign: Light Medical System
    background: '#f7f9fb',        // Slate-tinted clinical background
    surface: '#ffffff',           // Pure white card surfaces
    surfaceElevated: '#f2f4f6',   // Slightly elevated gray surfaces
    primary: '#0058bc',           // Professional medical blue
    primaryContainer: '#d8e2ff',  // Soft primary accent tint
    secondary: '#006b5f',         // Calming medical teal
    secondaryContainer: '#62fae3', // Vibrant cyan/teal
    tertiary: '#9e3d00',          // Accent tertiary orange
    error: '#ba1a1a',             // Warning red
    errorContainer: '#ffdad6',
    
    // Neutrals
    onSurface: '#191c1e',         // High-contrast slate-charcoal text
    onSurfaceVariant: '#414755',  // Muted secondary text
    onBackground: '#191c1e',
    outline: '#717786',           // Fine border outline
    outlineVariant: '#c1c6d7',    // Super light line/border
    
    // Status colors
    success: '#006b5f',           // Safe teal
    warning: '#f1c40f',
    
    // Utilities
    white: '#ffffff',
    lightGray: '#e6e8ea',         // surface-container-high
    superLightGray: '#eceef0',    // surface-container
    shadowColor: '#0ea5e9',       // Soft blue shadow tint
  },
  
  roundness: {
    sm: 8,                        // Rounded sm (0.5rem)
    md: 16,                       // Rounded default (1rem)
    lg: 24,                       // Rounded md/lg (1.5rem)
    xl: 32,                       // Rounded xl (2rem)
    full: 9999,                   // Pill shapes
  },
  
  spacing: {
    unit: 8,                      // 8px base spacing
    containerPadding: 24,         // 24px container padding
    cardPadding: 24,              // 24px card padding
    stackGap: 16,                 // 16px stack gap
    touchTargetMin: 48,           // 48px touch target
    buttonHeight: 56,             // 56px button height
    inputHeight: 60,              // 60px input height
  },
  
  typography: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontFamilyMedium: 'PlusJakartaSans_500Medium',
    fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
    fontFamilyBold: 'PlusJakartaSans_700Bold',
    
    displayLg: {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.64, // -0.02em
    },
    headlineMd: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.24, // -0.01em
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
    level1: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    level2: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
      elevation: 6,
    }
  }
};

