import { DotLottie } from '@lottiefiles/dotlottie-react-native'
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

export default function Screen4Action() {
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
    router.push('/(onboarding)/screen-5-welcome-final')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#06B6D4', '#14B8A6', '#10B981']}
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
            <DotLottie
              source={{
                url: 'https://lottie.host/602f227f-fde0-4352-97c5-ff97095cce32/V64W4LS4Z3.lottie',
              }}
              loop
              autoplay
              style={styles.lottieAnimation}
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>See It in Action ⚡</Text>
            <Text style={styles.subtitle}>
              Watch how SplitDuty instantly divides cleaning, shopping, and bills fairly — no arguments, no confusion, just balance.
            </Text>
          </View>

          {/* Demo Section */}
          <View style={styles.demoSection}>
            <View style={styles.demoCard}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoTitle}>Fair Distribution</Text>
              </View>

              <View style={styles.demoContent}>
                <View style={styles.personRow}>
                  <Text style={styles.personName}>👤 Alex</Text>
                  <View style={styles.taskBar}>
                    <View style={[styles.taskSegment, { width: '33%' }]} />
                  </View>
                  <Text style={styles.taskCount}>3 tasks</Text>
                </View>

                <View style={styles.personRow}>
                  <Text style={styles.personName}>👤 Jordan</Text>
                  <View style={styles.taskBar}>
                    <View style={[styles.taskSegment, { width: '33%' }]} />
                  </View>
                  <Text style={styles.taskCount}>3 tasks</Text>
                </View>

                <View style={styles.personRow}>
                  <Text style={styles.personName}>👤 Casey</Text>
                  <View style={styles.taskBar}>
                    <View style={[styles.taskSegment, { width: '34%' }]} />
                  </View>
                  <Text style={styles.taskCount}>3 tasks</Text>
                </View>
              </View>
            </View>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Instant fair distribution</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>No manual assignments</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Everyone stays balanced</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Let's Get Started</Text>
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
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
  demoSection: {
    marginBottom: 30,
  },
  demoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoHeader: {
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  demoContent: {
    gap: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    width: 60,
  },
  taskBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  taskSegment: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  taskCount: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    width: 50,
    textAlign: 'right',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  benefitIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
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

