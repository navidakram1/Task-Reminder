import React, { useEffect, useRef } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface AccessibleOnboardingProps {
  children: React.ReactNode
  title: string
  description: string
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  nextLabel?: string
  previousLabel?: string
  skipLabel?: string
  isLoading?: boolean
}

export default function AccessibleOnboarding({
  children,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  nextLabel = 'Continue',
  previousLabel = 'Back',
  skipLabel = 'Skip',
  isLoading = false,
}: AccessibleOnboardingProps) {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Check accessibility settings
    const checkAccessibilitySettings = async () => {
      try {
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled()
        setIsScreenReaderEnabled(screenReaderEnabled)

        if (Platform.OS === 'ios') {
          const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled()
          setReducedMotion(reduceMotionEnabled)
        }
      } catch (error) {
        console.warn('Error checking accessibility settings:', error)
      }
    }

    checkAccessibilitySettings()

    // Listen for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    )

    let reduceMotionListener: any
    if (Platform.OS === 'ios') {
      reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setReducedMotion
      )
    }

    return () => {
      screenReaderListener?.remove()
      reduceMotionListener?.remove()
    }
  }, [])

  useEffect(() => {
    // Announce screen changes for screen readers
    if (isScreenReaderEnabled) {
      const announcement = `${title}. Step ${currentStep + 1} of ${totalSteps}. ${description}`
      AccessibilityInfo.announceForAccessibility(announcement)
    }

    // Animate content appearance (respect reduced motion)
    const animationDuration = reducedMotion ? 0 : 500
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start()
  }, [currentStep, title, description, isScreenReaderEnabled, reducedMotion])

  const handleNext = () => {
    if (isLoading) return
    onNext?.()
  }

  const handlePrevious = () => {
    if (isLoading) return
    onPrevious?.()
  }

  const handleSkip = () => {
    if (isLoading) return
    onSkip?.()
  }

  return (
    <View style={styles.container}>
      {/* Screen reader only content */}
      <View style={styles.srOnly}>
        <Text
          accessibilityRole="header"
          accessibilityLevel={1}
          accessible={true}
        >
          {title}
        </Text>
        <Text accessible={true}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <Text accessible={true}>
          {description}
        </Text>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </Animated.View>

      {/* Navigation controls */}
      <View style={styles.navigationContainer}>
        {/* Progress indicator for screen readers */}
        <View style={styles.srOnly}>
          <Text accessible={true}>
            Progress: {Math.round(((currentStep + 1) / totalSteps) * 100)}% complete
          </Text>
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePrevious}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${previousLabel}. Go to previous step.`}
              accessibilityHint="Double tap to go back to the previous onboarding step"
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {previousLabel}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonSpacer} />

          {onNext && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleNext}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${nextLabel}. Continue to next step.`}
              accessibilityHint="Double tap to continue to the next onboarding step"
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {isLoading ? 'Loading...' : nextLabel}
              </Text>
            </TouchableOpacity>
          )}

          {onSkip && (
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${skipLabel}. Skip onboarding.`}
              accessibilityHint="Double tap to skip the onboarding process"
            >
              <Text style={[styles.buttonText, styles.skipButtonText]}>
                {skipLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
          >
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}
    </View>
  )
}

// Accessible form field component
interface AccessibleFieldProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoComplete?: string
}

export function AccessibleField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoComplete,
}: AccessibleFieldProps) {
  const fieldId = React.useId()
  const errorId = `${fieldId}-error`

  return (
    <View style={styles.fieldContainer}>
      <Text
        style={styles.fieldLabel}
        accessible={true}
        accessibilityRole="text"
      >
        {label}
        {required && (
          <Text style={styles.required} accessible={true}>
            {' '}(required)
          </Text>
        )}
      </Text>
      
      <TextInput
        style={[styles.fieldInput, error && styles.fieldInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={placeholder}
        accessibilityRequired={required}
        accessibilityInvalid={!!error}
        accessibilityDescribedBy={error ? errorId : undefined}
      />
      
      {error && (
        <Text
          style={styles.fieldError}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          nativeID={errorId}
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  srOnly: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  navigationContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonSpacer: {
    flex: 1,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#667eea',
  },
  skipButtonText: {
    color: '#666666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  fieldInputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
})
