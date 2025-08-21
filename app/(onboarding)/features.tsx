import { BlurView } from 'expo-blur'
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
      color: '#667eea',
      gradient: ['#667eea', '#764ba2'],
      benefits: ['Fair distribution', 'Reduces conflicts', 'Saves time']
    },
    {
      icon: '💰',
      title: 'Easy Bill Splitting',
      description: 'Split expenses fairly with custom or equal shares, track payments',
      demo: 'See how bills are divided and tracked automatically',
      color: '#764ba2',
      gradient: ['#764ba2', '#f093fb'],
      benefits: ['Custom splits', 'Payment tracking', 'Receipt storage']
    },
    {
      icon: '✅',
      title: 'Task Approval System',
      description: 'Verify completed tasks with photo proof and quality control',
      demo: 'Experience the satisfaction of checking off completed tasks',
      color: '#f093fb',
      gradient: ['#f093fb', '#f5576c'],
      benefits: ['Photo verification', 'Quality control', 'Accountability']
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Get reminded at the right time with intelligent scheduling',
      demo: 'Never miss a task or bill payment again',
      color: '#4facfe',
      gradient: ['#4facfe', '#00f2fe'],
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
    router.push('/(onboarding)/permissions')
  }

  const handleBack = () => {
    router.back()
  }

  const handleSkip = () => {
    router.replace('/(auth)/landing')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
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
          <Text style={styles.title}>Powerful Features</Text>
          <Text style={styles.subtitle}>Everything you need to manage your household</Text>
        </View>

        {/* Feature Showcase */}
        <View style={styles.featuresContainer}>
          {/* Active Feature Display */}
          <Animated.View
            style={[
              styles.activeFeatureCard,
              {
                opacity: featureAnimations[activeFeature],
                transform: [
                  {
                    scale: featureAnimations[activeFeature].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={features[activeFeature].gradient}
              style={styles.activeCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <BlurView intensity={30} style={styles.activeCardBlur}>
                <View style={styles.activeCardContent}>
                  <View style={styles.activeFeatureIcon}>
                    <Text style={styles.activeIconText}>{features[activeFeature].icon}</Text>
                  </View>

                  <Text style={styles.activeFeatureTitle}>{features[activeFeature].title}</Text>
                  <Text style={styles.activeFeatureDescription}>{features[activeFeature].description}</Text>

                  {/* Benefits List */}
                  <View style={styles.benefitsContainer}>
                    {features[activeFeature].benefits.map((benefit, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.benefitItem,
                          {
                            opacity: featureAnimations[activeFeature],
                            transform: [
                              {
                                translateX: featureAnimations[activeFeature].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [20, 0],
                                })
                              }
                            ]
                          }
                        ]}
                      >
                        <View style={styles.benefitDot} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </Animated.View>
                    ))}
                  </View>

                  {/* Demo Animation */}
                  <Animated.View
                    style={[
                      styles.demoContainer,
                      {
                        opacity: featureAnimations[activeFeature],
                      }
                    ]}
                  >
                    <View style={styles.demoBox}>
                      <Text style={styles.demoText}>{features[activeFeature].demo}</Text>
                      <View style={styles.demoAnimation}>
                        <Animated.View
                          style={[
                            styles.demoElement,
                            {
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              transform: [
                                {
                                  translateX: featureAnimations[activeFeature].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 40],
                                  })
                                },
                                {
                                  rotate: featureAnimations[activeFeature].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '360deg'],
                                  })
                                }
                              ]
                            }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.demoElement,
                            {
                              backgroundColor: 'rgba(255, 255, 255, 0.6)',
                              transform: [
                                {
                                  scale: featureAnimations[activeFeature].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1.2],
                                  })
                                }
                              ]
                            }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.demoElement,
                            {
                              backgroundColor: 'rgba(255, 255, 255, 0.4)',
                              opacity: featureAnimations[activeFeature].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.2, 1],
                              })
                            }
                          ]}
                        />
                      </View>
                    </View>
                  </Animated.View>
                </View>
              </BlurView>
            </LinearGradient>
          </Animated.View>

          {/* Feature Selection Grid */}
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
                <LinearGradient
                  colors={index === activeFeature ? feature.gradient : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.selectorGradient}
                >
                  <Text style={[
                    styles.selectorIcon,
                    index === activeFeature && styles.activeSelectorIcon
                  ]}>
                    {feature.icon}
                  </Text>
                  <Text style={[
                    styles.selectorTitle,
                    index === activeFeature && styles.activeSelectorTitle
                  ]}>
                    {feature.title}
                  </Text>
                </LinearGradient>
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

        {/* Benefits List */}
        <BlurView intensity={15} style={styles.benefitsCard}>
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
        </BlurView>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Continue →</Text>
            </LinearGradient>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Active Feature Card Styles
  activeFeatureCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  activeCardGradient: {
    borderRadius: 24,
  },
  activeCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeCardContent: {
    padding: 28,
    alignItems: 'center',
  },
  activeFeatureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  activeIconText: {
    fontSize: 36,
  },
  activeFeatureTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  activeFeatureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  // Benefits Container
  benefitsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  // Feature Grid Styles
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureSelector: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  activeFeatureselector: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectorGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  selectorIcon: {
    fontSize: 24,
    marginBottom: 8,
    opacity: 0.7,
  },
  activeSelectorIcon: {
    opacity: 1,
    fontSize: 28,
  },
  selectorTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  activeSelectorTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  demoContainer: {
    marginTop: 16,
    width: '100%',
  },
  demoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  demoAnimation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 40,
  },
  demoElement: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  benefitsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  benefitsContent: {
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 24,
  },
})
