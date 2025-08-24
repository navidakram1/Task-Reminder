import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Animated,
    Dimensions,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

const { width } = Dimensions.get('window')

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  requirement: number
  current_progress: number
  unlocked: boolean
  unlocked_at?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  reward_type: string
  reward_value: number
}

interface Milestone {
  id: string
  title: string
  description: string
  icon: string
  achieved_at: string
  shareable: boolean
}

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [shareAnimation] = useState(new Animated.Value(1))
  const { user } = useAuth()

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'tasks', name: 'Tasks', icon: '✅' },
    { id: 'bills', name: 'Bills', icon: '💰' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'streak', name: 'Streaks', icon: '🔥' },
  ]

  const rarityColors = {
    common: '#6c757d',
    rare: '#007bff',
    epic: '#6f42c1',
    legendary: '#fd7e14'
  }

  useEffect(() => {
    fetchAchievements()
    fetchMilestones()
  }, [])

  const fetchAchievements = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            id,
            title,
            description,
            icon,
            category,
            requirement,
            rarity,
            reward_type,
            reward_value
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const formattedAchievements = data?.map(item => ({
        id: item.achievements.id,
        title: item.achievements.title,
        description: item.achievements.description,
        icon: item.achievements.icon,
        category: item.achievements.category,
        requirement: item.achievements.requirement,
        current_progress: item.current_progress,
        unlocked: item.unlocked,
        unlocked_at: item.unlocked_at,
        rarity: item.achievements.rarity,
        reward_type: item.achievements.reward_type,
        reward_value: item.achievements.reward_value,
      })) || []

      setAchievements(formattedAchievements)
    } catch (error: any) {
      console.error('Error fetching achievements:', error)
    }
  }

  const fetchMilestones = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_milestones')
        .select(`
          *,
          milestones (
            title,
            description,
            icon,
            shareable
          )
        `)
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })

      if (error) throw error

      const formattedMilestones = data?.map(item => ({
        id: item.id,
        title: item.milestones.title,
        description: item.milestones.description,
        icon: item.milestones.icon,
        achieved_at: item.achieved_at,
        shareable: item.milestones.shareable,
      })) || []

      setMilestones(formattedMilestones)
    } catch (error: any) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  const shareAchievement = async (achievement: Achievement) => {
    const shareMessage = `🏆 I just unlocked "${achievement.title}" on HomeTask!\n\n${achievement.description}\n\nJoin me in making household management fun! Download HomeTask today.`

    // Animate share button
    Animated.sequence([
      Animated.timing(shareAnimation, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shareAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    try {
      await Share.share({
        message: shareMessage,
        title: `I unlocked ${achievement.title}!`,
      })

      // Track share event
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id,
          event_type: 'achievement_shared',
          event_data: { achievement_id: achievement.id }
        })
    } catch (error) {
      console.error('Error sharing achievement:', error)
    }
  }

  const shareMilestone = async (milestone: Milestone) => {
    const shareMessage = `🎉 Milestone achieved: ${milestone.title}!\n\n${milestone.description}\n\nHomeTask is helping me stay organized and productive! #HomeTaskWin`

    try {
      await Share.share({
        message: shareMessage,
        title: `Milestone: ${milestone.title}`,
      })

      // Track share event
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id,
          event_type: 'milestone_shared',
          event_data: { milestone_id: milestone.id }
        })
    } catch (error) {
      console.error('Error sharing milestone:', error)
    }
  }

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  )

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading achievements...</Text>
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
            <Text style={styles.headerTitle}>Achievements</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Overview */}
          <BlurView intensity={20} style={styles.progressCard}>
            <View style={styles.progressContent}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <View style={styles.progressStats}>
                <Text style={styles.progressNumber}>{unlockedCount}/{totalCount}</Text>
                <Text style={styles.progressLabel}>Achievements Unlocked</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(completionPercentage)}% Complete</Text>
            </View>
          </BlurView>

          {/* Recent Milestones */}
          {milestones.length > 0 && (
            <BlurView intensity={20} style={styles.milestonesCard}>
              <View style={styles.milestonesContent}>
                <Text style={styles.milestonesTitle}>Recent Milestones</Text>
                {milestones.slice(0, 3).map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                      <Text style={styles.milestoneDate}>
                        {new Date(milestone.achieved_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {milestone.shareable && (
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => shareMilestone(milestone)}
                      >
                        <Text style={styles.shareButtonText}>📤</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </BlurView>
          )}

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
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

          {/* Achievements Grid */}
          <View style={styles.achievementsGrid}>
            {filteredAchievements.map((achievement, index) => (
              <BlurView key={index} intensity={15} style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked
              ]}>
                <View style={styles.achievementContent}>
                  <View style={[
                    styles.achievementIconContainer,
                    { backgroundColor: rarityColors[achievement.rarity] }
                  ]}>
                    <Text style={styles.achievementIcon}>
                      {achievement.unlocked ? achievement.icon : '🔒'}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked
                  ]}>
                    {achievement.title}
                  </Text>
                  
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.achievementDescriptionLocked
                  ]}>
                    {achievement.description}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.achievementProgressContainer}>
                    <View style={styles.achievementProgressBar}>
                      <View style={[
                        styles.achievementProgressFill,
                        { width: `${Math.min((achievement.current_progress / achievement.requirement) * 100, 100)}%` }
                      ]} />
                    </View>
                    <Text style={styles.achievementProgressText}>
                      {achievement.current_progress}/{achievement.requirement}
                    </Text>
                  </View>

                  {/* Rarity Badge */}
                  <View style={[
                    styles.rarityBadge,
                    { backgroundColor: rarityColors[achievement.rarity] }
                  ]}>
                    <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
                  </View>

                  {/* Share Button for Unlocked Achievements */}
                  {achievement.unlocked && (
                    <Animated.View style={{ transform: [{ scale: shareAnimation }] }}>
                      <TouchableOpacity
                        style={styles.achievementShareButton}
                        onPress={() => shareAchievement(achievement)}
                      >
                        <Text style={styles.achievementShareText}>Share 📤</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {/* Unlock Date */}
                  {achievement.unlocked && achievement.unlocked_at && (
                    <Text style={styles.unlockedDate}>
                      Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </BlurView>
            ))}
          </View>

          {/* Empty State */}
          {filteredAchievements.length === 0 && (
            <BlurView intensity={20} style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>No Achievements Yet</Text>
                <Text style={styles.emptyDescription}>
                  Start completing tasks and managing bills to unlock achievements!
                </Text>
              </View>
            </BlurView>
          )}
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
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressContent: {
    padding: 20,
    alignItems: 'center',
  },
  progressTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressNumber: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  progressPercentage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestonesCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  milestonesContent: {
    padding: 20,
  },
  milestonesTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  milestoneIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  milestoneDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  milestoneDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  achievementsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  achievementCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementContent: {
    padding: 20,
  },
  achievementIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementTitleLocked: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  achievementDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  achievementDescriptionLocked: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  achievementProgressContainer: {
    marginBottom: 16,
  },
  achievementProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  achievementProgressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  rarityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  rarityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  achievementShareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementShareText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unlockedDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
