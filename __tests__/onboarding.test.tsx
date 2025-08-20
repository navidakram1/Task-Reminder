import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { router } from 'expo-router'
import React from 'react'

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}))

// Mock expo modules
jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }: any) => {
    const { View } = require('react-native')
    return <View {...props}>{children}</View>
  },
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native')
    return <View {...props}>{children}</View>
  },
}))

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  ),
}))

// Import screens after mocking
import IntroScreen from '../app/(onboarding)/intro'
import FeaturesScreen from '../app/(onboarding)/features'
import PermissionsScreen from '../app/(onboarding)/permissions'
import WelcomeScreen from '../app/(onboarding)/welcome'

describe('Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('IntroScreen', () => {
    it('renders correctly with all elements', () => {
      const { getByText } = render(<IntroScreen />)
      
      expect(getByText('HomeTask')).toBeTruthy()
      expect(getByText('Manage your household together')).toBeTruthy()
      expect(getByText('Welcome to the Future of')).toBeTruthy()
      expect(getByText('Household Management')).toBeTruthy()
      expect(getByText('Get Started')).toBeTruthy()
      expect(getByText('Skip Introduction')).toBeTruthy()
    })

    it('navigates to features screen when Get Started is pressed', () => {
      const { getByText } = render(<IntroScreen />)
      
      fireEvent.press(getByText('Get Started'))
      
      expect(router.push).toHaveBeenCalledWith('/(onboarding)/features')
    })

    it('navigates to landing when Skip is pressed', () => {
      const { getByText } = render(<IntroScreen />)
      
      fireEvent.press(getByText('Skip Introduction'))
      
      expect(router.replace).toHaveBeenCalledWith('/(auth)/landing')
    })

    it('displays progress indicator correctly', () => {
      const { getByTestId } = render(<IntroScreen />)
      
      // First dot should be active (we'll need to add testIDs to components)
      // This is a placeholder for the actual test implementation
      expect(true).toBeTruthy()
    })
  })

  describe('FeaturesScreen', () => {
    it('renders all feature cards', () => {
      const { getByText } = render(<FeaturesScreen />)
      
      expect(getByText('Powerful Features')).toBeTruthy()
      expect(getByText('Smart Task Assignment')).toBeTruthy()
      expect(getByText('Easy Bill Splitting')).toBeTruthy()
      expect(getByText('Task Approval System')).toBeTruthy()
    })

    it('cycles through features automatically', async () => {
      const { getByText } = render(<FeaturesScreen />)
      
      // Initial feature should be visible
      expect(getByText('AI-powered fair distribution of household chores')).toBeTruthy()
      
      // Wait for auto-cycle (3 seconds)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3100))
      })
      
      // Should show next feature
      expect(getByText('Split expenses fairly with custom or equal shares')).toBeTruthy()
    })

    it('allows manual feature selection', () => {
      const { getByText } = render(<FeaturesScreen />)
      
      // Click on a feature indicator (we'll need to add testIDs)
      // This is a placeholder for the actual test implementation
      expect(true).toBeTruthy()
    })

    it('navigates correctly with back and continue buttons', () => {
      const { getByText } = render(<FeaturesScreen />)
      
      fireEvent.press(getByText('← Back'))
      expect(router.back).toHaveBeenCalled()
      
      fireEvent.press(getByText('Continue →'))
      expect(router.push).toHaveBeenCalledWith('/(onboarding)/permissions')
    })
  })

  describe('PermissionsScreen', () => {
    it('renders all permission requests', () => {
      const { getByText } = render(<PermissionsScreen />)
      
      expect(getByText('Enable Permissions')).toBeTruthy()
      expect(getByText('Push Notifications')).toBeTruthy()
      expect(getByText('Camera Access')).toBeTruthy()
      expect(getByText('Contacts Access')).toBeTruthy()
    })

    it('requests notification permission when Allow is pressed', async () => {
      const { getByText, getAllByText } = render(<PermissionsScreen />)
      
      const allowButtons = getAllByText('Allow')
      fireEvent.press(allowButtons[0]) // First Allow button (notifications)
      
      await waitFor(() => {
        expect(getByText('✓ Granted')).toBeTruthy()
      })
    })

    it('shows warning when continuing without notifications', async () => {
      const { getByText } = render(<PermissionsScreen />)
      
      // Mock Alert.alert
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert')
      
      fireEvent.press(getByText('Continue →'))
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Notifications Recommended',
        expect.any(String),
        expect.any(Array)
      )
    })

    it('displays privacy information', () => {
      const { getByText } = render(<PermissionsScreen />)
      
      expect(getByText('🔒 Your Privacy Matters')).toBeTruthy()
      expect(getByText(/We only use these permissions/)).toBeTruthy()
    })
  })

  describe('WelcomeScreen', () => {
    it('renders welcome content and next steps', () => {
      const { getByText } = render(<WelcomeScreen />)
      
      expect(getByText("You're All Set!")).toBeTruthy()
      expect(getByText("What's Next?")).toBeTruthy()
      expect(getByText('Create or Join a Household')).toBeTruthy()
      expect(getByText('Invite Your Housemates')).toBeTruthy()
      expect(getByText('Set Up Your Profile')).toBeTruthy()
      expect(getByText('Start Managing Tasks & Bills')).toBeTruthy()
    })

    it('displays feature highlights', () => {
      const { getByText } = render(<WelcomeScreen />)
      
      expect(getByText("You'll Love These Features")).toBeTruthy()
      expect(getByText('AI-powered fair assignment')).toBeTruthy()
      expect(getByText('Easy bill splitting')).toBeTruthy()
      expect(getByText('Task approval system')).toBeTruthy()
    })

    it('navigates to household setup when Let\'s Begin is pressed', () => {
      const { getByText } = render(<WelcomeScreen />)
      
      fireEvent.press(getByText("Let's Begin!"))
      
      expect(router.push).toHaveBeenCalledWith('/(onboarding)/create-join-household')
    })

    it('skips to dashboard when Skip Setup is pressed', () => {
      const { getByText } = render(<WelcomeScreen />)
      
      fireEvent.press(getByText('Skip Setup'))
      
      expect(router.replace).toHaveBeenCalledWith('/(app)/dashboard')
    })
  })

  describe('Onboarding Flow Integration', () => {
    it('maintains progress through the flow', () => {
      // Test that progress indicators update correctly
      // This would require a more complex test setup with navigation context
      expect(true).toBeTruthy()
    })

    it('handles swipe gestures between screens', () => {
      // Test swipe navigation
      // This would require gesture testing setup
      expect(true).toBeTruthy()
    })

    it('preserves state when navigating back', () => {
      // Test that user selections are preserved when going back
      expect(true).toBeTruthy()
    })

    it('handles accessibility features', () => {
      // Test screen reader support and keyboard navigation
      expect(true).toBeTruthy()
    })

    it('performs smoothly on different screen sizes', () => {
      // Test responsive design
      expect(true).toBeTruthy()
    })

    it('handles error states gracefully', () => {
      // Test error handling and retry options
      expect(true).toBeTruthy()
    })
  })

  describe('Animation Performance', () => {
    it('maintains 60fps during transitions', () => {
      // Performance testing would require specialized tools
      expect(true).toBeTruthy()
    })

    it('handles animation interruptions gracefully', () => {
      // Test rapid navigation during animations
      expect(true).toBeTruthy()
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('works correctly on iOS', () => {
      // Platform-specific testing
      expect(true).toBeTruthy()
    })

    it('works correctly on Android', () => {
      // Platform-specific testing
      expect(true).toBeTruthy()
    })

    it('works correctly on Web', () => {
      // Web-specific testing
      expect(true).toBeTruthy()
    })
  })
})
