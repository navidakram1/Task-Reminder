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
  ]).current

  const features = [
    {
      icon: '🎯',
      title: 'Smart Task Assignment',
      description: 'AI-powered fair distribution of household chores',
      demo: 'Watch tasks automatically shuffle between family members',
      color: '#667eea'
    },
    {
      icon: '💰',
      title: 'Easy Bill Splitting',
      description: 'Split expenses fairly with custom or equal shares',
      demo: 'See how bills are divided and tracked automatically',
      color: '#764ba2'
    },
    {
      icon: '✅',
      title: 'Task Approval System',
      description: 'Verify completed tasks with photo proof',
      demo: 'Experience the satisfaction of checking off completed tasks',
      color: '#f093fb'
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
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureCard,
                {
                  opacity: featureAnimations[index],
                  transform: [
                    {
                      scale: featureAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    }
                  ]
                }
              ]}
            >
              <BlurView intensity={20} style={styles.cardBlur}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => setActiveFeature(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.featureIcon}>
                    <Text style={styles.iconText}>{feature.icon}</Text>
                  </View>
                  
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                  
                  {index === activeFeature && (
                    <Animated.View
                      style={[
                        styles.demoContainer,
                        {
                          opacity: featureAnimations[index],
                        }
                      ]}
                    >
                      <View style={styles.demoBox}>
                        <Text style={styles.demoText}>{feature.demo}</Text>
                        <View style={styles.demoAnimation}>
                          <Animated.View
                            style={[
                              styles.demoElement,
                              {
                                backgroundColor: feature.color,
                                transform: [
                                  {
                                    translateX: featureAnimations[index].interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, 50],
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
                                backgroundColor: feature.color,
                                opacity: featureAnimations[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.3, 1],
                                })
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          ))}
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
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
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
  featureCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  demoContainer: {
    marginTop: 16,
    width: '100%',
  },
  demoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  demoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoAnimation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  demoElement: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
