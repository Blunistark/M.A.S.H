import { Platform, StyleSheet } from 'react-native';

export const LightColors = {
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
};

export const DarkColors = {
  background: '#0a121a',         // Deep slate blue/black
  surface: '#121f2d',            // Dark medical card surface
  surfaceElevated: '#1a2b3d',    // Slightly elevated dark slate
  primary: '#3b82f6',            // Electric medical blue
  primaryContainer: '#1e3a8a',   // Deep blue accent container
  secondary: '#14b8a6',          // Luminous medical teal
  secondaryContainer: '#0f766e',  // Muted dark teal container
  tertiary: '#f97316',           // Accent orange
  error: '#ef4444',             // Warning red
  errorContainer: '#7f1d1d',
  
  // Neutrals
  onSurface: '#e2e8f0',          // Soft high contrast white/gray
  onSurfaceVariant: '#94a3b8',   // Muted slate gray
  onBackground: '#e2e8f0',
  outline: '#334155',            // Slate borders
  outlineVariant: '#1e293b',     // Dark borders
  
  // Status colors
  success: '#14b8a6',
  warning: '#eab308',
  
  // Utilities
  white: '#121f2d',              // Replace pure white with dark card surface
  lightGray: '#1e293b',
  superLightGray: '#0f172a',
  shadowColor: '#000000',
};

// Global registry for theme sheets
const stylesheetRegistry: { update: (colors: typeof LightColors) => void }[] = [];

export const Theme = {
  colors: LightColors,
  
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
  },

  createStyleSheet<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
    factory: (colors: typeof LightColors) => T
  ): T {
    let activeStyles = StyleSheet.create(factory(Theme.colors));
    
    const wrapper = {} as any;
    const keys = Object.keys(activeStyles);
    for (const key of keys) {
      Object.defineProperty(wrapper, key, {
        get() {
          return (activeStyles as any)[key];
        },
        enumerable: true,
        configurable: true
      });
    }
    
    stylesheetRegistry.push({
      update(newColors) {
        activeStyles = StyleSheet.create(factory(newColors));
      }
    });
    
    return wrapper;
  },

  updateTheme(isDark: boolean) {
    const newColors = isDark ? DarkColors : LightColors;
    Theme.colors = newColors;
    for (const entry of stylesheetRegistry) {
      entry.update(newColors);
    }
  }
};
