import React, { useRef } from 'react'
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native'

interface AnimatedCardProps {
  children: React.ReactNode
  onPress?: (event: GestureResponderEvent) => void
  style?: ViewStyle
  elevation?: number
  delay?: number
  variant?: 'default' | 'elevated' | 'outlined'
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  elevation = 2,
  delay = 0,
  variant = 'default',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const elevationAnim = useRef(new Animated.Value(elevation)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start()
  }, [delay])

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: elevation + 4,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start()
  }

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: elevation,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start()
  }

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: '#fff',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }
      case 'outlined':
        return {
          backgroundColor: '#fff',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e0e0e0',
        }
      default:
        return {
          backgroundColor: '#fff',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }
    }
  }

  const content = (
    <Animated.View
      style={[
        styles.container,
        getVariantStyle(),
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    overflow: 'hidden',
  },
})

