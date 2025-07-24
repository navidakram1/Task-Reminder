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

const { width: screenWidth } = Dimensions.get('window')
const slideWidth = screenWidth - 40 // Account for padding

interface Feature {
  id: string
  icon: string
  title: string
  description: string
  action: string
  route: string
  color: string
  backgroundColor: string
}

const features: Feature[] = [
  {
    id: '1',
    icon: '📋',
    title: 'Smart Task Management',
    description: 'Create, assign, and track household chores with emoji support and due dates',
    action: 'Create Task',
    route: '/(app)/tasks/create',
    color: '#667eea',
    backgroundColor: '#f8faff',
  },
  {
    id: '2',
    icon: '💰',
    title: 'Easy Bill Splitting',
    description: 'Split expenses fairly among household members with custom amounts and receipts',
    action: 'Add Bill',
    route: '/(app)/bills/create',
    color: '#28a745',
    backgroundColor: '#f8fff9',
  },
  {
    id: '3',
    icon: '✅',
    title: 'Task Approval System',
    description: 'Mark tasks complete and get approval from other members with photo proof',
    action: 'View Approvals',
    route: '/(app)/approvals',
    color: '#ffc107',
    backgroundColor: '#fffef8',
  },
  {
    id: '4',
    icon: '🎲',
    title: 'Random Assignment',
    description: 'Fairly distribute chores automatically with our smart shuffling algorithm',
    action: 'Shuffle Tasks',
    route: '/(app)/tasks/random-assignment',
    color: '#17a2b8',
    backgroundColor: '#f8feff',
  },
  {
    id: '5',
    icon: '👥',
    title: 'Multi-Household Support',
    description: 'Manage multiple households with different roles: Admin, Captain, and Member',
    action: 'Manage Members',
    route: '/(app)/household/members',
    color: '#6f42c1',
    backgroundColor: '#faf8ff',
  },
  {
    id: '6',
    icon: '📊',
    title: 'Activity Tracking',
    description: 'Stay updated with real-time activity feed showing all household changes',
    action: 'View Activity',
    route: '/(app)/household/activity',
    color: '#fd7e14',
    backgroundColor: '#fff8f5',
  },
]

interface FeatureSliderProps {
  onFeaturePress?: (feature: Feature) => void
}

export default function FeatureSlider({ onFeaturePress }: FeatureSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % features.length
        scrollViewRef.current?.scrollTo({
          x: nextIndex * slideWidth,
          animated: true,
        })
        return nextIndex
      })
    }, 4000) // Auto-scroll every 4 seconds

    return () => clearInterval(timer)
  }, [])

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / slideWidth)
    setCurrentIndex(index)
  }

  const handleFeaturePress = (feature: Feature) => {
    if (onFeaturePress) {
      onFeaturePress(feature)
    } else {
      router.push(feature.route as any)
    }
  }

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * slideWidth,
      animated: true,
    })
    setCurrentIndex(index)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Discover Features</Text>
        <Text style={styles.subtitle}>Swipe to explore what HomeTask can do</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {features.map((feature, index) => (
          <View
            key={feature.id}
            style={[
              styles.slide,
              { backgroundColor: feature.backgroundColor }
            ]}
          >
            <View style={styles.slideContent}>
              <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                <Text style={styles.icon}>{feature.icon}</Text>
              </View>
              
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: feature.color }]}
                onPress={() => handleFeaturePress(feature)}
              >
                <Text style={styles.actionButtonText}>{feature.action}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {features.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
            onPress={() => goToSlide(index)}
          />
        ))}
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          // You can add logic to hide the slider permanently
          console.log('Skip feature slider')
        }}
      >
        <Text style={styles.skipButtonText}>Skip Tour</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  slide: {
    width: slideWidth,
    marginRight: 0,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 0,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 36,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#667eea',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#ddd',
  },
  skipButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
})
