import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import LottieView from 'lottie-react-native'
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

export default function Screen3AIEngine() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleNext = () => {
    router.push('/(onboarding)/screen-4-action')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
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
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Animation Section */}
          <View style={styles.animationSection}>
            <LottieView
              source={require('../../assets/animations/ai-brain.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Meet Your AI Fairness Engine 🤖</Text>
            <Text style={styles.subtitle}>
              It learns your habits, schedules, and contributions to make chores, bills, and shared responsibilities 100% fair — automatically.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🧠</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Learns Your Patterns</Text>
                <Text style={styles.featureDescription}>
                  Understands your unique schedules and preferences
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🔄</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Adapts to Changes</Text>
                <Text style={styles.featureDescription}>
                  Adjusts automatically as your household evolves
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>⚖️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Ensures Fairness</Text>
                <Text style={styles.featureDescription}>
                  Guarantees everyone contributes equally
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Next: See It in Action</Text>
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
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
  animationSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  titleSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 21,
    opacity: 0.95,
  },
  featuresSection: {
    marginBottom: 30,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
})

