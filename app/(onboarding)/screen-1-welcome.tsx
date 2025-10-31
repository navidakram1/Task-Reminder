import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import {
    Animated,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

const { width, height } = Dimensions.get('window')

export default function Screen1Welcome() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

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

  const handleGetStarted = () => {
    router.push('/(onboarding)/screen-2-chaos')
  }

  const handleLogin = () => {
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.container}>
      {/* Clean White Background */}
      <View style={styles.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../Splitduty logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>SplitDuty</Text>
          </View>
        </Animated.View>

        {/* Main Content Card */}
        <Animated.View
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Illustration Placeholder */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustration} />
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.mainTitle}>
              Your Household,{'\n'}Perfectly Managed
            </Text>

            <Text style={styles.description}>
              Effortlessly manage tasks and split bills fairly. Start organizing your shared living today!
            </Text>

            {/* Feature Highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✨</Text>
                <Text style={styles.featureText}>Smart task distribution</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💰</Text>
                <Text style={styles.featureText}>Effortless bill splitting</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔔</Text>
                <Text style={styles.featureText}>Smart reminders</Text>
              </View>
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#1F51FF', '#1A3FCC']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F51FF',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  illustrationContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  illustration: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(31, 81, 255, 0.1)',
    borderRadius: 20,
  },
  contentSection: {
    padding: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1F51FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  loginLinkBold: {
    fontWeight: '600',
    color: '#1F51FF',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#1F51FF',
    width: 24,
  },
})

