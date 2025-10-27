// SplitDuty App Theme - Clean Modern Design
import { Platform } from 'react-native'

export const APP_THEME = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: '#FF6B6B', // Coral/Salmon red
    primaryLight: '#FF8787',
    primaryDark: '#E85555',
    
    // Secondary Colors
    secondary: '#4ECDC4', // Turquoise
    secondaryLight: '#6FD9D1',
    secondaryDark: '#3BB8AF',
    
    // Neutral Colors
    background: '#F8F9FA', // Light gray background
    surface: '#FFFFFF', // White cards/surfaces
    surfaceHover: '#F5F5F5',
    
    // Text Colors
    textPrimary: '#1A1A1A', // Almost black
    textSecondary: '#6B7280', // Gray
    textTertiary: '#9CA3AF', // Light gray
    textInverse: '#FFFFFF',
    
    // Border Colors
    border: '#E5E7EB', // Light gray border
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Status Colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Orange
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    
    // Accent Colors
    accent1: '#8B5CF6', // Purple
    accent2: '#EC4899', // Pink
    accent3: '#F59E0B', // Amber
    accent4: '#06B6D4', // Cyan
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Shadows
    shadowColor: '#000000',
  },
  
  // Typography
  typography: {
    // Font Families
    fontFamily: {
      regular: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
      medium: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
      semibold: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
      bold: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
    
    // Font Sizes
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    // Font Weights
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  
  // Component Specific
  components: {
    // Button
    button: {
      height: {
        sm: 36,
        base: 44,
        lg: 52,
      },
      paddingHorizontal: {
        sm: 16,
        base: 24,
        lg: 32,
      },
      borderRadius: 12,
    },
    
    // Input
    input: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    
    // Card
    card: {
      borderRadius: 16,
      padding: 16,
      backgroundColor: '#FFFFFF',
    },
    
    // List Item
    listItem: {
      height: 64,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    
    // Avatar
    avatar: {
      size: {
        sm: 32,
        base: 48,
        lg: 64,
        xl: 80,
      },
      borderRadius: 9999,
    },
    
    // Badge
    badge: {
      height: 24,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    
    // Toggle/Switch
    toggle: {
      trackColor: {
        false: '#E5E7EB',
        true: '#FF6B6B',
      },
      thumbColor: '#FFFFFF',
    },
  },
  
  // Layout
  layout: {
    containerPadding: 16,
    sectionSpacing: 24,
    itemSpacing: 12,
    maxWidth: 600,
  },
  
  // Animations
  animations: {
    duration: {
      fast: 150,
      base: 250,
      slow: 350,
    },
    easing: {
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
}

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Export type for TypeScript
export type AppTheme = typeof APP_THEME

