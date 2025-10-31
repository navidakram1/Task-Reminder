import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

const { width, height } = Dimensions.get('window')

export default function FeaturesScreen() {
  const [activeFeature, setActiveFeature] = useState(0)
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const featureAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  const features = [
    {
      icon: '🎯',
      title: 'Smart Task Assignment',
      description: 'AI-powered fair distribution of household chores with intelligent scheduling',
      demo: 'Watch tasks automatically shuffle between family members',
      color: '#5B7C99',
      gradient: ['#5B7C99', '#6B8CAA'],
      benefits: ['Fair distribution', 'Reduces conflicts', 'Saves time']
    },
    {
      icon: '💰',
      title: 'Easy Bill Splitting',
      description: 'Split expenses fairly with custom or equal shares, track payments',
      demo: 'See how bills are divided and tracked automatically',
      color: '#6B8CAA',
      gradient: ['#6B8CAA', '#7B9CBB'],
      benefits: ['Custom splits', 'Payment tracking', 'Receipt storage']
    },
    {
      icon: '✅',
      title: 'Task Approval System',
      description: 'Verify completed tasks with photo proof and quality control',
      demo: 'Experience the satisfaction of checking off completed tasks',
      color: '#7B9CBB',
      gradient: ['#7B9CBB', '#8BACCC'],
      benefits: ['Photo verification', 'Quality control', 'Accountability']
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Get reminded at the right time with intelligent scheduling',
      demo: 'Never miss a task or bill payment again',
      color: '#8BACCC',
      gradient: ['#8BACCC', '#9BBCDD'],
      benefits: ['Smart timing', 'Multiple channels', 'Customizable']
    }
  ]

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Auto-cycle through features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Animate active feature
    featureAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === activeFeature ? 1 : 0,
        duration: 500,
        useNativeDriver: true,
      }).start()
    })
  }, [activeFeature])

  const handleNext = () => {
    router.push('/(onboarding)/welcome')
  }

  const handleBack = () => {
    router.back()
  }

  const handleSkip = () => {
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFB']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Key Features</Text>
          <Text style={styles.subtitle}>Discover what makes HomeTask special</Text>
        </View>

        {/* Feature Showcase - SIMPLIFIED */}
        <View style={styles.featuresContainer}>
          {/* Active Feature Display - CLEAN & SIMPLE */}
          <Animated.View
            style={[
              styles.activeFeatureCard,
              {
                opacity: featureAnimations[activeFeature],
              }
            ]}
          >
            <View style={styles.activeCardContent}>
              {/* Icon */}
              <View style={styles.activeFeatureIcon}>
                <Text style={styles.activeIconText}>{features[activeFeature].icon}</Text>
              </View>

              {/* Title */}
              <Text style={styles.activeFeatureTitle}>{features[activeFeature].title}</Text>

              {/* Description */}
              <Text style={styles.activeFeatureDescription}>{features[activeFeature].description}</Text>

              {/* Benefits List - SIMPLE */}
              <View style={styles.benefitsContainer}>
                {features[activeFeature].benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.benefitDot} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              {/* Demo Text - SIMPLE */}
              <View style={styles.demoBox}>
                <Text style={styles.demoText}>{features[activeFeature].demo}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Feature Selection Grid - CLEAN */}
          <View style={styles.featureGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.featureSelector,
                  index === activeFeature && styles.activeFeatureselector
                ]}
                onPress={() => setActiveFeature(index)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.selectorContent,
                  index === activeFeature && styles.activeSelectorContent
                ]}>
                  <Text style={styles.selectorIcon}>{feature.icon}</Text>
                  <Text style={[
                    styles.selectorTitle,
                    index === activeFeature && styles.activeSelectorTitle
                  ]}>
                    {feature.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feature Indicators */}
        <View style={styles.indicators}>
          {features.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === activeFeature && styles.activeIndicator
              ]}
              onPress={() => setActiveFeature(index)}
            />
          ))}
        </View>

        {/* Benefits List - CLEAN */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsContent}>
            <Text style={styles.benefitsTitle}>Why HomeTask?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>⚡</Text>
                <Text style={styles.benefitText}>Save 2+ hours per week</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>🤝</Text>
                <Text style={styles.benefitText}>Reduce household conflicts</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>📊</Text>
                <Text style={styles.benefitText}>Track everything automatically</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Buttons - CLEAN */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip Introduction</Text>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#5B7C99',
    textAlign: 'center',
    fontWeight: '400',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Active Feature Card Styles - SIMPLIFIED
  activeFeatureCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCardContent: {
    padding: 28,
    alignItems: 'center',
  },
  activeFeatureIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  activeIconText: {
    fontSize: 32,
  },
  activeFeatureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 12,
    textAlign: 'center',
  },
  activeFeatureDescription: {
    fontSize: 15,
    color: '#5B7C99',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '400',
  },
  // Benefits Container
  benefitsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  benefitDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#5B7C99',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#1A2332',
    fontWeight: '500',
  },
  // Feature Grid Styles
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  featureSelector: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  activeFeatureselector: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  selectorContent: {
    padding: 14,
    alignItems: 'center',
    minHeight: 76,
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  activeSelectorContent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#5B7C99',
    borderWidth: 2,
  },
  selectorIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  selectorTitle: {
    fontSize: 12,
    color: '#5B7C99',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  activeSelectorTitle: {
    color: '#1A2332',
    fontWeight: '600',
    fontSize: 12,
  },
  demoBox: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    marginTop: 16,
  },
  demoText: {
    fontSize: 13,
    color: '#5B7C99',
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4DFE8',
  },
  activeIndicator: {
    backgroundColor: '#5B7C99',
    width: 20,
  },
  benefitsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitsContent: {
    padding: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 14,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#1A2332',
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  backButtonText: {
    fontSize: 15,
    color: '#5B7C99',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5B7C99',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    color: '#5B7C99',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4DFE8',
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 24,
  },
})
