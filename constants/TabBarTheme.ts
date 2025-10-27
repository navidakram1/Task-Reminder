// Tab Bar Theme Configuration
import { Platform } from 'react-native'

export const TAB_BAR_THEME = {
  // Colors
  colors: {
    primary: '#667eea',
    primaryLight: '#7c8ef0',
    primaryDark: '#5568d3',
    
    // Tab colors
    activeIcon: '#ffffff',
    inactiveIcon: '#8e8e93',
    activeLabel: '#667eea',
    inactiveLabel: '#8e8e93',
    
    // Background
    background: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.7)' 
      : 'rgba(255, 255, 255, 0.95)',
    
    // Quick actions
    taskColor: '#667eea',
    billColor: '#10b981',
    proposalColor: '#f59e0b',
    reviewColor: '#ec4899',
    
    // Shadows
    shadow: '#000',
    primaryShadow: '#667eea',
  },
  
  // Blur settings
  blur: {
    tabBar: {
      intensity: Platform.OS === 'ios' ? 100 : 20,
      tint: Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'light',
    },
    bubble: {
      intensity: Platform.OS === 'ios' ? 80 : 20,
      tint: Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'light',
    },
  },
  
  // Dimensions
  dimensions: {
    tabBarHeight: Platform.OS === 'ios' ? 95 : 75,
    tabIconSize: 48,
    tabIconActiveSize: 48,
    plusButtonSize: 68,
    plusButtonInnerSize: 58,
    bubbleIconSize: 52,
    
    // Icon sizes
    iconSize: 24,
    iconActiveSize: 26,
    plusIconSize: 32,
    bubbleActionIconSize: 24,
  },
  
  // Border radius
  radius: {
    tabBar: 30,
    tabIcon: 24,
    plusButton: 34,
    plusButtonInner: 29,
    bubble: 28,
    bubbleIcon: 26,
  },
  
  // Spacing
  spacing: {
    tabBarPadding: 16,
    tabBarPaddingTop: 12,
    tabBarPaddingBottom: Platform.OS === 'ios' ? 30 : 12,
    plusButtonMarginTop: -16,
    plusButtonMarginHorizontal: 16,
    tabIconMarginBottom: 4,
    tabLabelMarginTop: 4,
  },
  
  // Typography
  typography: {
    tabLabelSize: 11,
    tabLabelWeight: '600' as const,
    tabLabelActiveWeight: '700' as const,
    tabLabelLetterSpacing: 0.2,
    
    bubbleTitleSize: 17,
    bubbleTitleWeight: '600' as const,
    bubbleDescriptionSize: 14,
  },
  
  // Shadows
  shadows: {
    tabBar: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
      shadowRadius: 25,
      elevation: 30,
    },
    tabIconActive: {
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    plusButton: {
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 20,
    },
    bubble: {
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
      elevation: 24,
    },
  },
  
  // Animations
  animations: {
    tabPress: {
      scale: 0.85,
      duration: 100,
      springFriction: 3,
      springTension: 40,
    },
    bubble: {
      tension: 100,
      friction: 8,
      duration: 200,
    },
  },
}

// Icon mappings for better visual consistency
export const TAB_ICONS = {
  dashboard: {
    default: 'home-outline',
    active: 'home',
  },
  tasks: {
    default: 'checkmark-circle-outline',
    active: 'checkmark-circle',
  },
  bills: {
    default: 'wallet-outline',
    active: 'wallet',
  },
  review: {
    default: 'star-outline',
    active: 'star',
  },
  proposals: {
    default: 'document-text-outline',
    active: 'document-text',
  },
  settings: {
    default: 'settings-outline',
    active: 'settings',
  },
} as const

export const QUICK_ACTION_ICONS = {
  task: 'add-circle',
  bill: 'cash',
  proposal: 'clipboard',
  review: 'star-half',
} as const

