import { Animated, Easing } from 'react-native'

/**
 * Animation presets for common animations
 */
export const AnimationPresets = {
  // Fade animations
  fadeIn: (duration = 300) => ({
    toValue: 1,
    duration,
    useNativeDriver: true,
  }),

  fadeOut: (duration = 300) => ({
    toValue: 0,
    duration,
    useNativeDriver: true,
  }),

  // Slide animations
  slideInUp: (duration = 400) => ({
    toValue: 0,
    duration,
    useNativeDriver: true,
  }),

  slideOutDown: (duration = 300) => ({
    toValue: 500,
    duration,
    useNativeDriver: true,
  }),

  slideInLeft: (duration = 400) => ({
    toValue: 0,
    duration,
    useNativeDriver: true,
  }),

  slideOutRight: (duration = 300) => ({
    toValue: 500,
    duration,
    useNativeDriver: true,
  }),

  // Scale animations
  scaleIn: (duration = 300) => ({
    toValue: 1,
    duration,
    useNativeDriver: true,
  }),

  scaleOut: (duration = 300) => ({
    toValue: 0.8,
    duration,
    useNativeDriver: true,
  }),

  // Spring animations
  springBounce: (tension = 50, friction = 8) => ({
    tension,
    friction,
    useNativeDriver: true,
  }),

  springSnappy: (tension = 100, friction = 10) => ({
    tension,
    friction,
    useNativeDriver: true,
  }),
}

/**
 * Create a sequence of animations
 */
export const createSequence = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations)
}

/**
 * Create parallel animations
 */
export const createParallel = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations)
}

/**
 * Create a staggered animation sequence
 */
export const createStaggered = (
  animationValues: Animated.Value[],
  config: {
    duration?: number
    delay?: number
    staggerDelay?: number
    useNativeDriver?: boolean
  } = {}
) => {
  const {
    duration = 300,
    delay = 0,
    staggerDelay = 50,
    useNativeDriver = true,
  } = config

  const animations = animationValues.map((value, index) =>
    Animated.timing(value, {
      toValue: 1,
      duration,
      delay: delay + index * staggerDelay,
      useNativeDriver,
    })
  )

  return Animated.parallel(animations)
}

/**
 * Create a loop animation
 */
export const createLoop = (animation: Animated.CompositeAnimation) => {
  return Animated.loop(animation)
}

/**
 * Interpolate animation values
 */
export const interpolate = (
  animationValue: Animated.Value,
  inputRange: number[],
  outputRange: (string | number)[]
) => {
  return animationValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  })
}

/**
 * Create a pulse animation
 */
export const createPulse = (
  animationValue: Animated.Value,
  duration = 1000,
  minOpacity = 0.5,
  maxOpacity = 1
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: maxOpacity,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: minOpacity,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ])
  )
}

/**
 * Create a shake animation
 */
export const createShake = (
  animationValue: Animated.Value,
  intensity = 10,
  duration = 500
) => {
  return Animated.sequence([
    Animated.timing(animationValue, {
      toValue: intensity,
      duration: duration / 4,
      useNativeDriver: true,
    }),
    Animated.timing(animationValue, {
      toValue: -intensity,
      duration: duration / 4,
      useNativeDriver: true,
    }),
    Animated.timing(animationValue, {
      toValue: intensity,
      duration: duration / 4,
      useNativeDriver: true,
    }),
    Animated.timing(animationValue, {
      toValue: 0,
      duration: duration / 4,
      useNativeDriver: true,
    }),
  ])
}

/**
 * Create a bounce animation
 */
export const createBounce = (
  animationValue: Animated.Value,
  bounceHeight = 20,
  duration = 600
) => {
  return Animated.sequence([
    Animated.timing(animationValue, {
      toValue: -bounceHeight,
      duration: duration / 2,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(animationValue, {
      toValue: 0,
      duration: duration / 2,
      easing: Easing.bounce,
      useNativeDriver: true,
    }),
  ])
}

/**
 * Create a rotation animation
 */
export const createRotation = (
  animationValue: Animated.Value,
  duration = 1000,
  loops = 1
) => {
  const animation = Animated.timing(animationValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  })

  return loops > 1 ? Animated.loop(animation, { iterations: loops }) : animation
}

