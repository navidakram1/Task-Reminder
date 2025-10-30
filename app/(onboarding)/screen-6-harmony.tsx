import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const { width, height } = Dimensions.get('window')

export default function Screen6Harmony() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const leftSlideAnim = useRef(new Animated.Value(-50)).current
  const rightSlideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(leftSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(rightSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleCreate = () => {
    router.push('/(onboarding)/create-join-household')
  }

  const handleJoin = () => {
    router.push('/(onboarding)/create-join-household')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8F9FA', '#FFFFFF']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Ready to Bring Harmony Home?</Text>
            <Text style={styles.subtitle}>
              Join or create your household in under a minute.
            </Text>
          </View>

          {/* Split Screen Illustration */}
          <View style={styles.illustrationContainer}>
            <Animated.View
              style={[
                styles.illustrationHalf,
                styles.leftHalf,
                {
                  transform: [{ translateX: leftSlideAnim }],
                },
              ]}
            >
              <View style={styles.illustrationCard}>
                <Text style={styles.illustrationIcon}>🏠</Text>
                <Text style={styles.illustrationLabel}>Create</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.illustrationHalf,
                styles.rightHalf,
                {
                  transform: [{ translateX: rightSlideAnim }],
                },
              ]}
            >
              <View style={styles.illustrationCard}>
                <Text style={styles.illustrationIcon}>👥</Text>
                <Text style={styles.illustrationLabel}>Join</Text>
              </View>
            </Animated.View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreate}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>🏠</Text>
              <Text style={styles.primaryButtonText}>Create Household</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleJoin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>🔗</Text>
              <Text style={styles.secondaryButtonText}>Join with Invite Code</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={styles.progressDot} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 21,
  },
  illustrationContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    height: 200,
  },
  illustrationHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftHalf: {
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
  },
  rightHalf: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
  },
  illustrationCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  illustrationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    fontSize: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#FF6B6B',
  },
})

