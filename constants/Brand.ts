// SplitDuty Brand Constants
export const BRAND = {
  // App Identity
  NAME: 'SplitDuty',
  TAGLINE: 'Share Life, Split Smart',
  VERSION: '1.0.0',
  
  // Alternative Taglines
  TAGLINES: {
    PRIMARY: 'Share Life, Split Smart',
    SECONDARY: 'Where Households Become Teams',
    EMOTIONAL: 'Turn Your Household Into a Dream Team',
    FUNCTIONAL: 'Smart Sharing, Happy Living',
    COMMUNITY: 'The Fair Way to Live Together'
  },

  // Brand Colors (Updated Palette)
  COLORS: {
    PRIMARY: '#4F46E5',      // Vibrant Indigo
    SECONDARY: '#06B6D4',    // Cyan Blue  
    ACCENT: '#F59E0B',       // Warm Amber
    SUCCESS: '#10B981',      // Emerald Green
    ERROR: '#EF4444',        // Coral Red
    WARNING: '#F59E0B',      // Warm Amber
    NEUTRAL: '#6B7280',      // Cool Gray
    
    // Gradients
    GRADIENT_PRIMARY: ['#4F46E5', '#06B6D4'],
    GRADIENT_SECONDARY: ['#06B6D4', '#10B981'],
    GRADIENT_ACCENT: ['#F59E0B', '#EF4444']
  },

  // Logo Variations
  LOGOS: {
    MAIN: '🏠⚡',           // House + Lightning (Smart/Fast)
    COLLABORATION: '🤝🏠',  // Handshake + House (Teamwork)
    FAIRNESS: '⚖️✨',       // Balance + Sparkle (Fair + Smart)
    SIMPLE: '🏠'            // Just House (Minimal)
  },

  // Emojis & Icons
  ICONS: {
    HOUSE: '🏠',
    AI: '🧠',
    FAIRNESS: '⚖️',
    BILLS: '💳',
    TASKS: '📋',
    TEAM: '🤝',
    SMART: '⚡',
    SPARKLE: '✨',
    TARGET: '🎯',
    CHART: '📊',
    PHOTO: '📸',
    NOTIFICATION: '🔔'
  },

  // Marketing Messages
  MESSAGES: {
    HERO: {
      PRIMARY: 'Turn Your Household Into a Dream Team',
      SECONDARY: 'The AI That Ends Chore Wars Forever',
      EMOTIONAL: 'Finally, a Home Where Everyone Feels Heard',
      CTA: 'Join 25,000+ Households Living Their Best Life - Start Free!'
    },
    
    FEATURES: {
      AI_ENGINE: 'The Fairness AI That Actually Works',
      BILL_SPLITTING: 'Bill Splitting That Feels Like Magic',
      HEALTH_SCORE: 'Your Household\'s Health Score',
      TRANSPARENCY: 'Trust Through Transparency',
      MULTI_SPACE: 'One App, Every Space'
    },

    SOCIAL: {
      INSTAGRAM: '✨ That moment when your household finally works like a team',
      TIKTOK: 'POV: You found the app that saves relationships 💕',
      LINKEDIN: 'Why is managing a household harder than running a startup? 🤔'
    }
  },

  // App Store & Marketing
  STORE: {
    TITLE: 'SplitDuty - Smart Household Management',
    SUBTITLE: 'Share Life, Split Smart',
    DESCRIPTION: 'Transform your household into a harmonious team with AI-powered task distribution and seamless bill splitting.',
    KEYWORDS: ['household', 'chores', 'bills', 'roommates', 'family', 'tasks', 'AI', 'fair', 'split']
  },

  // Voice & Personality
  VOICE: {
    TONE: 'Friendly but Smart',
    PERSONALITY: ['Empathetic', 'Confident', 'Inclusive', 'Innovative'],
    MESSAGING_PILLARS: [
      'Fairness First',
      'Technology for Good', 
      'Simplicity Wins',
      'Community Focused'
    ]
  },

  // Target Audiences
  AUDIENCES: {
    PRIMARY: {
      name: 'College Students',
      age: '18-24',
      message: 'Dorm life made easy'
    },
    SECONDARY: {
      name: 'Young Professionals', 
      age: '25-35',
      message: 'Adult life, simplified'
    },
    TERTIARY: {
      name: 'Families',
      age: '35-50', 
      message: 'Teaching kids responsibility'
    }
  },

  // Feature Names (Branded)
  FEATURES: {
    AI_ASSIGNMENT: 'SplitDuty AI',
    FAIRNESS_SCORE: 'Harmony Score',
    BILL_SPLITTING: 'Smart Split',
    TASK_VERIFICATION: 'Proof System',
    WORKLOAD_TRACKING: 'Balance Dashboard',
    NOTIFICATIONS: 'Smart Reminders'
  },

  // URLs & Links
  LINKS: {
    WEBSITE: 'https://splitduty.app',
    SUPPORT: 'https://help.splitduty.app',
    PRIVACY: 'https://splitduty.app/privacy',
    TERMS: 'https://splitduty.app/terms',
    SOCIAL: {
      INSTAGRAM: '@splitduty',
      TIKTOK: '@splitduty',
      TWITTER: '@splitduty_app'
    }
  }
}

// Helper functions for brand consistency
export const getBrandColor = (colorName: keyof typeof BRAND.COLORS) => {
  return BRAND.COLORS[colorName]
}

export const getBrandMessage = (category: string, key: string) => {
  return (BRAND.MESSAGES as any)[category]?.[key] || ''
}

export const getFeatureName = (feature: keyof typeof BRAND.FEATURES) => {
  return BRAND.FEATURES[feature]
}

// Export individual items for convenience
export const {
  NAME: BRAND_NAME,
  TAGLINE: BRAND_TAGLINE,
  VERSION: BRAND_VERSION,
  COLORS: BRAND_COLORS,
  ICONS: BRAND_ICONS
} = BRAND
