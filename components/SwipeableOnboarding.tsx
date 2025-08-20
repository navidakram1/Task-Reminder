import { router } from 'expo-router'
import React, { useRef } from 'react'
import {
  Animated,
  Dimensions,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native'
import { PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler'

const { width } = Dimensions.get('window')

interface SwipeableOnboardingProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onPrevious?: () => void
  nextRoute?: string
  previousRoute?: string
  canSwipeNext?: boolean
  canSwipePrevious?: boolean
}

export default function SwipeableOnboarding({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  nextRoute,
  previousRoute,
  canSwipeNext = true,
  canSwipePrevious = true,
}: SwipeableOnboardingProps) {
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  )

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent
      const threshold = width * 0.3
      const velocity = Math.abs(velocityX)

      // Determine swipe direction and intent
      const isSwipeLeft = translationX < -threshold || (translationX < 0 && velocity > 500)
      const isSwipeRight = translationX > threshold || (translationX > 0 && velocity > 500)

      if (isSwipeLeft && canSwipeNext && currentStep < totalSteps - 1) {
        // Swipe left - go to next screen
        animateTransition(() => {
          if (onNext) {
            onNext()
          } else if (nextRoute) {
            router.push(nextRoute)
          }
        })
      } else if (isSwipeRight && canSwipePrevious && currentStep > 0) {
        // Swipe right - go to previous screen
        animateTransition(() => {
          if (onPrevious) {
            onPrevious()
          } else if (previousRoute) {
            router.back()
          }
        })
      } else {
        // Reset position if swipe wasn't strong enough
        resetPosition()
      }
    }
  }

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: translateX._value < 0 ? -width : width,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback()
      // Reset for next screen
      translateX.setValue(0)
      opacity.setValue(1)
    })
  }

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start()
  }

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-50, 50]}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
          opacity,
        }}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  )
}

// Progress indicator component
interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  style?: any
}

export function ProgressIndicator({ currentStep, totalSteps, style }: ProgressIndicatorProps) {
  return (
    <Animated.View style={[defaultProgressStyles.container, style]}>
      <Animated.View style={defaultProgressStyles.progressDots}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <Animated.View
            key={index}
            style={[
              defaultProgressStyles.dot,
              index === currentStep && defaultProgressStyles.activeDot,
            ]}
          />
        ))}
      </Animated.View>
    </Animated.View>
  )
}

const defaultProgressStyles = {
  container: {
    alignItems: 'center' as const,
    marginTop: 20,
  },
  progressDots: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 24,
  },
}

// Swipe hint component
interface SwipeHintProps {
  visible: boolean
  direction: 'left' | 'right'
  style?: any
}

export function SwipeHint({ visible, direction, style }: SwipeHintProps) {
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (visible) {
      // Show hint animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: direction === 'left' ? -20 : 20,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start()
    } else {
      // Hide hint
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, direction])

  if (!visible) return null

  return (
    <Animated.View
      style={[
        defaultHintStyles.container,
        {
          opacity,
          transform: [{ translateX }],
        },
        style,
      ]}
    >
      <Animated.Text style={defaultHintStyles.text}>
        {direction === 'left' ? '← Swipe to continue' : 'Swipe to go back →'}
      </Animated.Text>
    </Animated.View>
  )
}

const defaultHintStyles = {
  container: {
    position: 'absolute' as const,
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
    pointerEvents: 'none' as const,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
}

// Hook for managing onboarding state
export function useOnboardingState(initialStep = 0, totalSteps = 4) {
  const [currentStep, setCurrentStep] = React.useState(initialStep)
  const [showHint, setShowHint] = React.useState(false)

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step)
    }
  }

  // Show hint after a delay on first screen
  React.useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setShowHint(true)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowHint(false)
    }
  }, [currentStep])

  return {
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    goToStep,
    showHint,
    setShowHint,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    progress: (currentStep + 1) / totalSteps,
  }
}
