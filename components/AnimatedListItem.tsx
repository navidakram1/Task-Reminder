import React, { useEffect, useRef } from 'react'
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native'

interface AnimatedListItemProps {
  children: React.ReactNode
  onPress?: (event: GestureResponderEvent) => void
  delay?: number
  style?: ViewStyle
  animationType?: 'slideIn' | 'fadeIn' | 'scaleIn'
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  onPress,
  delay = 0,
  style,
  animationType = 'slideIn',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    if (animationType === 'slideIn') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
      ]).start()
    } else if (animationType === 'scaleIn') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }).start()
    }
  }, [animationType, delay])

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      animationType === 'slideIn' ? { translateY: slideAnim } : { scale: scaleAnim },
    ],
  }

  if (onPress) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={styles.touchable}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
})

