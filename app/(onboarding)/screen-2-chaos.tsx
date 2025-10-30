import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
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

interface MetricSlider {
  label: string
  before: number
  after: number
  icon: string
}

export default function Screen2Chaos() {
  const [metrics] = useState<MetricSlider[]>([
    { label: 'Chore Fairness', before: 20, after: 100, icon: '🧹' },
    { label: 'Bill Clarity', before: 30, after: 100, icon: '💳' },
    { label: 'Household Peace', before: 40, after: 100, icon: '☮️' },
  ])

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const sliderAnimations = useRef(
    metrics.map(() => new Animated.Value(0))
  ).current

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
    ]).start()

    // Animate sliders sequentially
    setTimeout(() => {
      sliderAnimations.forEach((anim, index) => {
        setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }).start()
        }, index * 200)
      })
    }, 500)
  }, [])

  const handleNext = () => {
    router.push('/(onboarding)/screen-3-ai-engine')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8787', '#FFA07A', '#FFB6A3']}
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
          {/* Animation Section */}
          <View style={styles.animationSection}>
            <LottieView
              source={require('../../assets/animations/household.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Say Goodbye to Chaos</Text>
            <Text style={styles.subtitle}>
              No more messy chore charts, forgotten bills, or unfair workloads. SplitDuty turns household chaos into calm collaboration.
            </Text>
          </View>

          {/* Metrics Section */}
          <View style={styles.metricsSection}>
            {metrics.map((metric, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.metricCard,
                  {
                    opacity: sliderAnimations[index],
                    transform: [
                      {
                        translateY: sliderAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>

                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <Animated.View
                      style={[
                        styles.sliderFill,
                        {
                          width: sliderAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [`${metric.before}%`, `${metric.after}%`],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricValues}>
                  <Text style={styles.metricBefore}>{metric.before}%</Text>
                  <Text style={styles.metricArrow}>→</Text>
                  <Text style={styles.metricAfter}>{metric.after}%</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Show Me How</Text>
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={styles.progressDot} />
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
  metricsSection: {
    marginBottom: 30,
    gap: 16,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  metricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBefore: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metricArrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricAfter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
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

