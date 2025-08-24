import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

const { width } = Dimensions.get('window')

interface CommunityTip {
  id: string
  title: string
  description: string
  category: string
  author: string
  likes: number
  created_at: string
  helpful_count: number
}

interface BestPractice {
  id: string
  title: string
  description: string
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_to_implement: string
  impact_score: number
}

export default function CommunityScreen() {
  const [tips, setTips] = useState<CommunityTip[]>([])
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { user } = useAuth()

  const categories = [
    { id: 'all', name: 'All Tips', icon: '💡' },
    { id: 'tasks', name: 'Task Management', icon: '✅' },
    { id: 'bills', name: 'Bill Splitting', icon: '💰' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'organization', name: 'Organization', icon: '📋' },
  ]

  const mockTips: CommunityTip[] = [
    {
      id: '1',
      title: 'Set up recurring tasks for weekly chores',
      description: 'Create recurring tasks for things like taking out trash, cleaning bathrooms, and grocery shopping. This saves time and ensures nothing gets forgotten!',
      category: 'tasks',
      author: 'Sarah M.',
      likes: 24,
      created_at: '2024-01-15',
      helpful_count: 18
    },
    {
      id: '2',
      title: 'Use photo proof for completed tasks',
      description: 'Enable photo verification for tasks like cleaning. It helps build trust and accountability among household members.',
      category: 'tasks',
      author: 'Mike R.',
      likes: 31,
      created_at: '2024-01-14',
      helpful_count: 25
    },
    {
      id: '3',
      title: 'Split bills by usage, not equally',
      description: 'For utilities like internet or streaming services, split based on who uses them most. It\'s fairer and reduces conflicts.',
      category: 'bills',
      author: 'Emma L.',
      likes: 19,
      created_at: '2024-01-13',
      helpful_count: 15
    },
    {
      id: '4',
      title: 'Create a household communication channel',
      description: 'Set up a dedicated group chat for household matters. Keep it separate from personal conversations for better organization.',
      category: 'communication',
      author: 'Alex K.',
      likes: 27,
      created_at: '2024-01-12',
      helpful_count: 22
    },
    {
      id: '5',
      title: 'Use the random assignment feature weekly',
      description: 'Shuffle tasks every week to keep things fair and prevent anyone from getting stuck with the same chores.',
      category: 'tasks',
      author: 'Jordan P.',
      likes: 35,
      created_at: '2024-01-11',
      helpful_count: 28
    }
  ]

  const mockBestPractices: BestPractice[] = [
    {
      id: '1',
      title: 'Weekly Household Meetings',
      description: 'Schedule 15-minute weekly check-ins to discuss upcoming tasks, bills, and any household issues.',
      icon: '🗣️',
      difficulty: 'easy',
      time_to_implement: '15 minutes',
      impact_score: 85
    },
    {
      id: '2',
      title: 'Shared Shopping Lists',
      description: 'Create collaborative shopping lists that everyone can add to throughout the week.',
      icon: '🛒',
      difficulty: 'easy',
      time_to_implement: '5 minutes',
      impact_score: 75
    },
    {
      id: '3',
      title: 'Emergency Fund Contributions',
      description: 'Set up a shared emergency fund for unexpected household expenses like repairs.',
      icon: '🏦',
      difficulty: 'medium',
      time_to_implement: '30 minutes',
      impact_score: 90
    },
    {
      id: '4',
      title: 'Task Rotation System',
      description: 'Implement a monthly rotation for major cleaning tasks to ensure fairness.',
      icon: '🔄',
      difficulty: 'medium',
      time_to_implement: '20 minutes',
      impact_score: 80
    }
  ]

  useEffect(() => {
    fetchCommunityData()
  }, [])

  const fetchCommunityData = async () => {
    setLoading(true)
    try {
      // In a real app, these would come from the database
      setTips(mockTips)
      setBestPractices(mockBestPractices)
    } catch (error) {
      console.error('Error fetching community data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTips = tips.filter(tip => 
    selectedCategory === 'all' || tip.category === selectedCategory
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#28a745'
      case 'medium': return '#ffc107'
      case 'hard': return '#dc3545'
      default: return '#6c757d'
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading community content...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Welcome Section */}
          <BlurView intensity={20} style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>💡 Community Tips & Best Practices</Text>
              <Text style={styles.welcomeDescription}>
                Learn from other HomeTask users and discover proven strategies for better household management.
              </Text>
            </View>
          </BlurView>

          {/* Best Practices Section */}
          <BlurView intensity={20} style={styles.bestPracticesCard}>
            <View style={styles.bestPracticesContent}>
              <Text style={styles.bestPracticesTitle}>🏆 Proven Best Practices</Text>
              <Text style={styles.bestPracticesSubtitle}>
                High-impact strategies used by successful households
              </Text>
              
              {mockBestPractices.map((practice, index) => (
                <View key={index} style={styles.practiceItem}>
                  <View style={styles.practiceHeader}>
                    <Text style={styles.practiceIcon}>{practice.icon}</Text>
                    <View style={styles.practiceInfo}>
                      <Text style={styles.practiceTitle}>{practice.title}</Text>
                      <Text style={styles.practiceDescription}>{practice.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.practiceMetrics}>
                    <View style={styles.practiceMetric}>
                      <Text style={styles.metricLabel}>Difficulty</Text>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(practice.difficulty) }
                      ]}>
                        <Text style={styles.difficultyText}>
                          {practice.difficulty.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.practiceMetric}>
                      <Text style={styles.metricLabel}>Time</Text>
                      <Text style={styles.metricValue}>{practice.time_to_implement}</Text>
                    </View>
                    
                    <View style={styles.practiceMetric}>
                      <Text style={styles.metricLabel}>Impact</Text>
                      <Text style={styles.metricValue}>{practice.impact_score}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>Community Tips</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tips Section */}
          <BlurView intensity={20} style={styles.tipsCard}>
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>
                💬 Tips from the Community
                {selectedCategory !== 'all' && ` (${filteredTips.length})`}
              </Text>
              
              {filteredTips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipHeader}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <View style={styles.tipMeta}>
                      <Text style={styles.tipAuthor}>by {tip.author}</Text>
                      <Text style={styles.tipDate}>
                        {new Date(tip.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                  
                  <View style={styles.tipFooter}>
                    <View style={styles.tipStats}>
                      <Text style={styles.tipStat}>👍 {tip.likes} likes</Text>
                      <Text style={styles.tipStat}>✅ {tip.helpful_count} found helpful</Text>
                    </View>
                    <TouchableOpacity style={styles.helpfulButton}>
                      <Text style={styles.helpfulButtonText}>Helpful?</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>

          {/* Share Your Tip Section */}
          <BlurView intensity={20} style={styles.shareCard}>
            <View style={styles.shareContent}>
              <Text style={styles.shareTitle}>💡 Share Your Tip</Text>
              <Text style={styles.shareDescription}>
                Have a great household management tip? Share it with the community!
              </Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  // In a real app, this would open a tip submission form
                  router.push('/(app)/support/feature-request')
                }}
              >
                <Text style={styles.shareButtonText}>Submit a Tip</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ScrollView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  welcomeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomeContent: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bestPracticesCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bestPracticesContent: {
    padding: 20,
  },
  bestPracticesTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bestPracticesSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 20,
  },
  practiceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  practiceIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  practiceInfo: {
    flex: 1,
  },
  practiceTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  practiceDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 18,
  },
  practiceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  practiceMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipsContent: {
    padding: 20,
  },
  tipsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipHeader: {
    marginBottom: 12,
  },
  tipTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipAuthor: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  tipDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  tipDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipStats: {
    flexDirection: 'row',
    gap: 16,
  },
  tipStat: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  helpfulButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  helpfulButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  shareCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareContent: {
    padding: 20,
    alignItems: 'center',
  },
  shareTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  shareDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
