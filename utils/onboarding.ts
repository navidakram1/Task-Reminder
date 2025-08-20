import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete'
const ONBOARDING_STEP_KEY = 'onboarding_current_step'
const PERMISSIONS_GRANTED_KEY = 'permissions_granted'

export interface OnboardingState {
  isComplete: boolean
  currentStep: number
  permissions: {
    notifications: boolean
    camera: boolean
    contacts: boolean
  }
}

export const OnboardingUtils = {
  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
      return completed === 'true'
    } catch (error) {
      console.error('Error checking onboarding completion:', error)
      return false
    }
  },

  /**
   * Mark onboarding as complete
   */
  async markOnboardingComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
      await AsyncStorage.removeItem(ONBOARDING_STEP_KEY) // Clean up step tracking
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
    }
  },

  /**
   * Reset onboarding state (for testing or user preference)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ONBOARDING_COMPLETE_KEY,
        ONBOARDING_STEP_KEY,
        PERMISSIONS_GRANTED_KEY,
      ])
    } catch (error) {
      console.error('Error resetting onboarding:', error)
    }
  },

  /**
   * Save current onboarding step
   */
  async saveCurrentStep(step: number): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step.toString())
    } catch (error) {
      console.error('Error saving onboarding step:', error)
    }
  },

  /**
   * Get current onboarding step
   */
  async getCurrentStep(): Promise<number> {
    try {
      const step = await AsyncStorage.getItem(ONBOARDING_STEP_KEY)
      return step ? parseInt(step, 10) : 0
    } catch (error) {
      console.error('Error getting onboarding step:', error)
      return 0
    }
  },

  /**
   * Save granted permissions
   */
  async savePermissions(permissions: OnboardingState['permissions']): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSIONS_GRANTED_KEY, JSON.stringify(permissions))
    } catch (error) {
      console.error('Error saving permissions:', error)
    }
  },

  /**
   * Get granted permissions
   */
  async getPermissions(): Promise<OnboardingState['permissions']> {
    try {
      const permissions = await AsyncStorage.getItem(PERMISSIONS_GRANTED_KEY)
      return permissions ? JSON.parse(permissions) : {
        notifications: false,
        camera: false,
        contacts: false,
      }
    } catch (error) {
      console.error('Error getting permissions:', error)
      return {
        notifications: false,
        camera: false,
        contacts: false,
      }
    }
  },

  /**
   * Get complete onboarding state
   */
  async getOnboardingState(): Promise<OnboardingState> {
    try {
      const [isComplete, currentStep, permissions] = await Promise.all([
        this.hasCompletedOnboarding(),
        this.getCurrentStep(),
        this.getPermissions(),
      ])

      return {
        isComplete,
        currentStep,
        permissions,
      }
    } catch (error) {
      console.error('Error getting onboarding state:', error)
      return {
        isComplete: false,
        currentStep: 0,
        permissions: {
          notifications: false,
          camera: false,
          contacts: false,
        },
      }
    }
  },

  /**
   * Skip onboarding and mark as complete
   */
  async skipOnboarding(): Promise<void> {
    try {
      await this.markOnboardingComplete()
      // Save default permissions state
      await this.savePermissions({
        notifications: false,
        camera: false,
        contacts: false,
      })
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    }
  },
}

// Analytics tracking for onboarding
export const OnboardingAnalytics = {
  /**
   * Track onboarding step completion
   */
  trackStepCompleted(step: number, stepName: string) {
    // In a real app, you'd send this to your analytics service
    console.log(`Onboarding step completed: ${step} - ${stepName}`)
  },

  /**
   * Track onboarding completion
   */
  trackOnboardingCompleted(completionMethod: 'full' | 'skipped') {
    console.log(`Onboarding completed via: ${completionMethod}`)
  },

  /**
   * Track permission granted
   */
  trackPermissionGranted(permission: string, granted: boolean) {
    console.log(`Permission ${permission}: ${granted ? 'granted' : 'denied'}`)
  },

  /**
   * Track onboarding abandonment
   */
  trackOnboardingAbandoned(step: number, stepName: string) {
    console.log(`Onboarding abandoned at step: ${step} - ${stepName}`)
  },
}

// Onboarding step definitions
export const ONBOARDING_STEPS = [
  {
    id: 0,
    name: 'intro',
    title: 'Welcome to HomeTask',
    route: '/(onboarding)/intro',
    required: false,
  },
  {
    id: 1,
    name: 'features',
    title: 'Discover Features',
    route: '/(onboarding)/features',
    required: false,
  },
  {
    id: 2,
    name: 'permissions',
    title: 'Enable Permissions',
    route: '/(onboarding)/permissions',
    required: false,
  },
  {
    id: 3,
    name: 'welcome',
    title: 'Get Started',
    route: '/(onboarding)/welcome',
    required: false,
  },
] as const

export type OnboardingStepId = typeof ONBOARDING_STEPS[number]['id']
export type OnboardingStepName = typeof ONBOARDING_STEPS[number]['name']

// Helper functions
export function getStepByName(name: OnboardingStepName) {
  return ONBOARDING_STEPS.find(step => step.name === name)
}

export function getStepById(id: OnboardingStepId) {
  return ONBOARDING_STEPS.find(step => step.id === id)
}

export function getNextStep(currentId: OnboardingStepId) {
  const currentIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentId)
  return currentIndex < ONBOARDING_STEPS.length - 1 
    ? ONBOARDING_STEPS[currentIndex + 1] 
    : null
}

export function getPreviousStep(currentId: OnboardingStepId) {
  const currentIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentId)
  return currentIndex > 0 
    ? ONBOARDING_STEPS[currentIndex - 1] 
    : null
}

export function calculateProgress(currentId: OnboardingStepId): number {
  return ((currentId + 1) / ONBOARDING_STEPS.length) * 100
}
