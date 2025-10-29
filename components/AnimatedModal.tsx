import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Modal,
  ModalProps,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'

const { height } = Dimensions.get('window')

interface AnimatedModalProps extends Omit<ModalProps, 'animationType'> {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showBackdrop?: boolean
  animationType?: 'slide' | 'fade' | 'spring'
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible,
  onClose,
  children,
  title,
  showBackdrop = true,
  animationType = 'slide',
  ...props
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start()
      } else if (animationType === 'spring') {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start()
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }
    } else {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start()
      } else if (animationType === 'spring') {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start()
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }
    }
  }, [visible, animationType])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      {...props}
    >
      {/* Backdrop */}
      {showBackdrop && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <BlurView intensity={60} style={styles.blurContainer}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              onPress={onClose}
              activeOpacity={1}
            />
          </BlurView>
        </Animated.View>
      )}

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.container,
          animationType === 'slide' && {
            transform: [{ translateY: slideAnim }],
          },
          animationType === 'spring' && {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
          animationType === 'fade' && {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: height * 0.9,
  },
})

