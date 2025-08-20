import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface FeatureItem {
  id: string
  icon: string
  title: string
  description: string
  color: string
}

const features: FeatureItem[] = [
  {
    id: '1',
    icon: '🏠',
    title: 'Smart Household Management',
    description: 'Create and manage households with family or roommates effortlessly',
    color: '#667eea'
  },
  {
    id: '2',
    icon: '📋',
    title: 'Intelligent Task Assignment',
    description: 'Fair task distribution with AI-powered random assignment',
    color: '#764ba2'
  },
  {
    id: '3',
    icon: '💰',
    title: 'Effortless Bill Splitting',
    description: 'Split bills equally or custom amounts with receipt tracking',
    color: '#f093fb'
  },
  {
    id: '4',
    icon: '🔔',
    title: 'Smart Notifications',
    description: 'Never miss a task or bill with intelligent reminders',
    color: '#f5576c'
  },
  {
    id: '5',
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Track household productivity and spending patterns',
    color: '#4facfe'
  },
  {
    id: '6',
    icon: '✅',
    title: 'Task Approval System',
    description: 'Verify completed tasks with photo proof and approval workflow',
    color: '#43e97b'
  }
]

export default function LandingScreen() {
  const [currentFeature, setCurrentFeature] = useState(0)
  const scrollY = useRef(new Animated.Value(0)).current
  const featureScrollRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start()

    // Auto-scroll feature carousel
    const interval = setInterval(() => {
      setCurrentFeature(prev => {
        const next = (prev + 1) % features.length
        featureScrollRef.current?.scrollTo({
          x: next * (width - 40),
          animated: true
        })
        return next
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const heroScale = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  })

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <Text style={styles.headerLogo}>SplitDuty</Text>
            <TouchableOpacity
              style={styles.headerLoginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.headerLoginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <Animated.View style={[
          styles.heroSection,
          {
            transform: [{ scale: heroScale }],
            opacity: heroOpacity
          }
        ]}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}>
              {/* App Logo */}
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#ffffff', '#f8f9fa']}
                  style={styles.logoCircle}
                >
                  <Text style={styles.logoEmoji}>🏠</Text>
                </LinearGradient>
                <Text style={styles.appName}>SplitDuty</Text>
                <Text style={styles.tagline}>Where household harmony begins</Text>
              </View>

              {/* Hero Text */}
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>
                  Transform Your{'\n'}
                  <Text style={styles.heroTitleAccent}>Household Management</Text>
                </Text>
                <Text style={styles.heroSubtitle}>
                  Organize tasks, split bills, and keep everyone accountable with the ultimate household management app
                </Text>
              </View>

              {/* CTA Buttons */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/(auth)/signup')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Get Started Free</Text>
                    <Text style={styles.primaryButtonSubtext}>✨ No credit card required</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>

              {/* Trust Indicators */}
              <View style={styles.trustIndicators}>
                <View style={styles.trustItem}>
                  <Text style={styles.trustIcon}>🔒</Text>
                  <Text style={styles.trustText}>Secure & Private</Text>
                </View>
                <View style={styles.trustItem}>
                  <Text style={styles.trustIcon}>📱</Text>
                  <Text style={styles.trustText}>iOS & Android</Text>
                </View>
                <View style={styles.trustItem}>
                  <Text style={styles.trustIcon}>⚡</Text>
                  <Text style={styles.trustText}>Lightning Fast</Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Features Carousel */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Powerful Features</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to manage your household efficiently
          </Text>

          <ScrollView
            ref={featureScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.featureCarousel}
            contentContainerStyle={styles.featureCarouselContent}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40))
              setCurrentFeature(index)
            }}
          >
            {features.map((feature, index) => (
              <View key={feature.id} style={styles.featureCard}>
                <LinearGradient
                  colors={[feature.color, `${feature.color}80`]}
                  style={styles.featureGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.featureContent}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>

          {/* Feature Indicators */}
          <View style={styles.featureIndicators}>
            {features.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  index === currentFeature && styles.activeIndicator
                ]}
                onPress={() => {
                  setCurrentFeature(index)
                  featureScrollRef.current?.scrollTo({
                    x: index * (width - 40),
                    animated: true
                  })
                }}
              />
            ))}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Choose SplitDuty?</Text>

          <View style={styles.benefitsList}>
            {[
              { icon: '🎯', title: 'Fair & Transparent', desc: 'AI-powered task distribution ensures everyone contributes equally' },
              { icon: '💡', title: 'Smart Automation', desc: 'Recurring tasks and intelligent reminders save you time' },
              { icon: '📈', title: 'Insightful Analytics', desc: 'Track productivity and spending patterns with detailed insights' },
              { icon: '🤝', title: 'Better Relationships', desc: 'Reduce conflicts with clear accountability and communication' }
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Text style={styles.benefitEmoji}>{benefit.icon}</Text>
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Preview */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Simple, Affordable Pricing</Text>

          <View style={styles.pricingCards}>
            <View style={styles.pricingCard}>
              <Text style={styles.pricingPlan}>Free</Text>
              <Text style={styles.pricingPrice}>$0</Text>
              <Text style={styles.pricingFeatures}>• Basic task management{'\n'}• Simple bill splitting{'\n'}• Up to 5 household members</Text>
            </View>

            <View style={[styles.pricingCard, styles.popularCard]}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
              <Text style={styles.pricingPlan}>Lifetime</Text>
              <Text style={styles.pricingPrice}>$15</Text>
              <Text style={styles.pricingSubprice}>One-time payment</Text>
              <Text style={styles.pricingFeatures}>• Everything in Free{'\n'}• Unlimited households{'\n'}• Advanced analytics{'\n'}• Priority support</Text>
            </View>
          </View>
        </View>

        {/* Final CTA */}
        <View style={styles.finalCTA}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.finalCTAGradient}
          >
            <Text style={styles.finalCTATitle}>Ready to Get Started?</Text>
            <Text style={styles.finalCTASubtitle}>
              Join thousands of households already using SplitDuty
            </Text>

            <TouchableOpacity
              style={styles.finalCTAButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.finalCTAButtonText}>Start Your Free Account</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 SplitDuty. Made with ❤️ for better households.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  headerBlur: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerLoginButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerLoginText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heroGradient: {
    padding: 40,
    minHeight: height * 0.7,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  heroText: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroTitleAccent: {
    color: '#f093fb',
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  trustItem: {
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  trustText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featureCarousel: {
    marginBottom: 24,
  },
  featureCarouselContent: {
    paddingHorizontal: 10,
  },
  featureCard: {
    width: width - 40,
    marginHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  featureGradient: {
    padding: 32,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#667eea',
    width: 24,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  benefitsList: {
    gap: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitEmoji: {
    fontSize: 20,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingSection: {
    marginBottom: 40,
  },
  pricingCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  pricingCard: {
    width: '30%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  popularCard: {
    backgroundColor: '#667eea',
    transform: [{ scale: 1.05 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#ff6b6b',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
  },
  planDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modern pricing styles
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  pricingFeatures: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  pricingPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  pricingSubprice: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  finalCTA: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  finalCTAGradient: {
    padding: 40,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  finalCTASubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  finalCTAButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  finalCTAButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
})
