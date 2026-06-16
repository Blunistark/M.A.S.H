import { Platform } from 'react-native';

export const Theme = {
  colors: {
    // Premium Light Baby Pink Theme (Option 1)
    background: '#fff0f2',        // Soft, pale baby pink base background
    surface: '#ffffff',           // Clean white card surface
    primary: '#ff8da1',           // Beautiful rose/pink primary accent
    primaryContainer: '#ffb7c5',  // Baby pink container
    secondary: '#d65a80',         // Deep pink/rose secondary accent
    secondaryContainer: 'rgba(214, 90, 128, 0.1)', // Translucent pink container background
    tertiary: '#ffc0cb',          // Pink accent
    error: '#e74c3c',
    errorContainer: '#fadbd8',
    
    // Neutrals (Adjusted for light mode contrast)
    onSurface: '#2f1e22',         // Very dark berry-grey readable text on white surface
    onSurfaceVariant: '#70595e',  // Soft dark pink-grey text
    onBackground: '#2f1e22',      // Readable text on background
    outline: '#ffd5dc',           // Soft light pink outlines
    outlineVariant: '#ffeaee',    // Thin card boundaries
    
    // Status colors
    success: '#2ecc71',
    warning: '#f1c40f',
    
    // Utilities
    white: '#ffffff',             // White for light mode surfaces
    lightGray: '#ffeaee',         // Muted pink borders
    superLightGray: '#fff6f7',    // Inside panel background (very soft pink)
    shadowColor: '#000000',
  },
  
  roundness: {
    sm: 8,
    md: 12,
    lg: 20,                       // 20px card radius (compact layout)
    xl: 28,
    full: 9999,                   // Pill shapes
  },
  
  spacing: {
    unit: 6,                      // Shrunk spacer unit (compact layout)
    containerPadding: 16,         // Tightened screen boundaries
    cardPadding: 16,              // Compact card paddings
    stackGap: 12,                 // Shrunk gaps
    touchTargetMin: 44,           // Compact interactive elements
    buttonHeight: 48,             // Shrunk button height
    inputHeight: 52,              // Shrunk input height
  },
  
  typography: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontFamilyMedium: 'PlusJakartaSans_500Medium',
    fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
    fontFamilyBold: 'PlusJakartaSans_700Bold',
    
    // Shrunk typography sizes for compact layout
    displayLg: {
      fontSize: 26,
      lineHeight: 34,
      letterSpacing: -0.52,
    },
    headlineMd: {
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    headlineSm: {
      fontSize: 16,
      lineHeight: 22,
    },
    bodyLg: {
      fontSize: 15,
      lineHeight: 22,
    },
    bodyMd: {
      fontSize: 14,
      lineHeight: 20,
    },
    labelMd: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    labelSm: {
      fontSize: 11,
      lineHeight: 15,
    }
  },
  
  shadows: {
    level1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
    },
    level2: {
      shadowColor: '#ff8da1',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    }
  }
};
