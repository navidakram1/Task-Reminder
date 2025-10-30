import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Dimensions,
    Platform,
    ScrollView,
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

const testimonials = [
  {
    id: '1',
    name: 'Alex Johnson',
    role: 'College Student',
    text: 'Finally! No more arguments about who does the dishes. SplitDuty made our apartment peaceful.',
    rating: 5
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'Parent',
    text: 'My kids actually do their chores now. The gamification is genius!',
    rating: 5
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    role: 'Airbnb Host',
    text: 'Photo proof of cleaning is a game-changer. No more disputes with guests.',
    rating: 5
  }
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'Forever',
    features: ['Basic task management', 'Simple bill splitting', 'Up to 5 members'],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Premium',
    price: '$3',
    period: '/month',
    features: ['Unlimited tasks', 'Advanced splitting', 'Unlimited members', 'No ads'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Lifetime',
    price: '$15',
    period: 'One-time',
    features: ['Everything in Premium', 'Priority support', 'Early access'],
    cta: 'Buy Lifetime',
    popular: false
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
      <StatusBar style="light" backgroundColor="transparent" translucent />

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
                  Stop Arguing{'\n'}
                  <Text style={styles.heroTitleAccent}>About Chores & Bills</Text>
                </Text>
                <Text style={styles.heroSubtitle}>
                  AI-powered fairness ensures everyone contributes equally. No more lost receipts. No more "who owes what?"
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

        {/* Social Proof Section */}
        <View style={styles.socialProofSection}>
          <View style={styles.proofItem}>
            <Text style={styles.proofNumber}>50K+</Text>
            <Text style={styles.proofLabel}>Active Users</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofItem}>
            <Text style={styles.proofNumber}>4.8★</Text>
            <Text style={styles.proofLabel}>App Rating</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofItem}>
            <Text style={styles.proofNumber}>$2M+</Text>
            <Text style={styles.proofLabel}>Bills Split</Text>
          </View>
        </View>

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

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>Loved by Households</Text>
          <Text style={styles.sectionSubtitle}>
            Join thousands of happy users transforming their homes
          </Text>

          <View style={styles.testimonialsList}>
            {testimonials.map((testimonial) => (
              <View key={testimonial.id} style={styles.testimonialCard}>
                <View style={styles.testimonialRating}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Text key={i} style={styles.star}>⭐</Text>
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={styles.testimonialName}>{testimonial.name}</Text>
                  <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Preview */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Simple, Affordable Pricing</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the plan that works for you
          </Text>

          <View style={styles.pricingCards}>
            {pricingPlans.map((plan, index) => (
              <View
                key={index}
                style={[
                  styles.pricingCard,
                  plan.popular && styles.popularCard
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                <Text style={styles.pricingPlan}>{plan.name}</Text>
                <Text style={styles.pricingPrice}>{plan.price}</Text>
                <Text style={styles.pricingPeriod}>{plan.period}</Text>

                <View style={styles.pricingFeaturesList}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.pricingButton,
                    plan.popular && styles.pricingButtonPrimary
                  ]}
                  onPress={() => router.push('/(auth)/signup')}
                >
                  <Text style={[
                    styles.pricingButtonText,
                    plan.popular && styles.pricingButtonTextPrimary
                  ]}>
                    {plan.cta}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
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
  // Social Proof Section
  socialProofSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  proofItem: {
    alignItems: 'center',
    flex: 1,
  },
  proofNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  proofLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  proofDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },

  // Testimonials Section
  testimonialsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  testimonialsList: {
    gap: 16,
  },
  testimonialCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  testimonialRating: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    fontSize: 14,
    marginRight: 4,
  },
  testimonialText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  testimonialRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // Pricing Section (Updated)
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  pricingCards: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 16,
    justifyContent: 'center',
  },
  pricingCard: {
    width: width < 768 ? '100%' : width < 1024 ? '48%' : '31%',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  popularCard: {
    backgroundColor: '#667eea',
    elevation: 8,
    shadowOpacity: 0.15,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -40,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  pricingPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 8,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  pricingPeriod: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },
  pricingFeaturesList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  pricingButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  pricingButtonPrimary: {
    backgroundColor: '#ffffff',
  },
  pricingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  pricingButtonTextPrimary: {
    color: '#667eea',
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
