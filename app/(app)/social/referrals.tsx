import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Animated,
    Clipboard,
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

interface ReferralData {
  referral_code: string
  total_referrals: number
  successful_referrals: number
  pending_rewards: number
  total_rewards_earned: number
  referral_history: any[]
}

export default function ReferralsScreen() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareAnimation] = useState(new Animated.Value(1))
  const { user } = useAuth()

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          *,
          referral_history (
            id,
            referred_user_id,
            status,
            reward_amount,
            created_at,
            profiles!referred_user_id (
              name,
              email
            )
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Create referral record for new user
        const referralCode = generateReferralCode()
        const { data: newReferral, error: createError } = await supabase
          .from('user_referrals')
          .insert({
            user_id: user.id,
            referral_code: referralCode,
            total_referrals: 0,
            successful_referrals: 0,
            pending_rewards: 0,
            total_rewards_earned: 0
          })
          .select()
          .single()

        if (createError) throw createError
        setReferralData({ ...newReferral, referral_history: [] })
      } else {
        setReferralData(data)
      }
    } catch (error: any) {
      console.error('Error fetching referral data:', error)
      Alert.alert('Error', 'Failed to load referral information')
    } finally {
      setLoading(false)
    }
  }

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const shareReferralCode = async () => {
    if (!referralData) return

    const shareMessage = `🏠 Join me on HomeTask - the best app for managing household chores and bills!\n\nUse my referral code: ${referralData.referral_code}\n\nWe'll both get premium features when you sign up!\n\nDownload: https://hometask.app/invite/${referralData.referral_code}`

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
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareMessage)
        Alert.alert('Copied!', 'Referral link copied to clipboard')
      } else {
        await Share.share({
          message: shareMessage,
          title: 'Join HomeTask with my referral code!',
        })
      }

      // Track share event
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id,
          event_type: 'referral_shared',
          event_data: { referral_code: referralData.referral_code }
        })
    } catch (error) {
      console.error('Error sharing referral:', error)
    }
  }

  const copyReferralCode = async () => {
    if (!referralData) return

    try {
      await Clipboard.setStringAsync(referralData.referral_code)
      Alert.alert('Copied!', 'Referral code copied to clipboard')
    } catch (error) {
      console.error('Error copying code:', error)
    }
  }

  const rewardTiers = [
    { referrals: 1, reward: 'Premium features for 1 month', icon: '🌟' },
    { referrals: 3, reward: 'Premium features for 3 months', icon: '💎' },
    { referrals: 5, reward: 'Lifetime Premium access', icon: '👑' },
    { referrals: 10, reward: 'Exclusive beta features', icon: '🚀' },
  ]

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading referral data...</Text>
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
            <Text style={styles.headerTitle}>Invite Friends</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Referral Stats Card */}
          <BlurView intensity={20} style={styles.statsCard}>
            <View style={styles.statsContent}>
              <Text style={styles.statsTitle}>Your Referral Stats</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{referralData?.total_referrals || 0}</Text>
                  <Text style={styles.statLabel}>Total Invites</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{referralData?.successful_referrals || 0}</Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>${referralData?.total_rewards_earned || 0}</Text>
                  <Text style={styles.statLabel}>Rewards Earned</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>${referralData?.pending_rewards || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Referral Code Card */}
          <BlurView intensity={20} style={styles.codeCard}>
            <View style={styles.codeContent}>
              <Text style={styles.codeTitle}>Your Referral Code</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{referralData?.referral_code}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyReferralCode}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              
              <Animated.View style={{ transform: [{ scale: shareAnimation }] }}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={shareReferralCode}
                >
                  <Text style={styles.shareButtonText}>📤 Share Invite Link</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </BlurView>

          {/* Reward Tiers */}
          <BlurView intensity={20} style={styles.rewardsCard}>
            <View style={styles.rewardsContent}>
              <Text style={styles.rewardsTitle}>Referral Rewards</Text>
              <Text style={styles.rewardsSubtitle}>
                Earn amazing rewards for every friend you invite!
              </Text>
              
              {rewardTiers.map((tier, index) => (
                <View
                  key={index}
                  style={[
                    styles.rewardTier,
                    (referralData?.successful_referrals || 0) >= tier.referrals && styles.rewardTierCompleted
                  ]}
                >
                  <Text style={styles.rewardIcon}>{tier.icon}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardCount}>{tier.referrals} referrals</Text>
                    <Text style={styles.rewardDescription}>{tier.reward}</Text>
                  </View>
                  {(referralData?.successful_referrals || 0) >= tier.referrals && (
                    <Text style={styles.completedBadge}>✅</Text>
                  )}
                </View>
              ))}
            </View>
          </BlurView>

          {/* Referral History */}
          {referralData?.referral_history && referralData.referral_history.length > 0 && (
            <BlurView intensity={20} style={styles.historyCard}>
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>Referral History</Text>
                
                {referralData.referral_history.map((referral, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyName}>
                        {referral.profiles?.name || 'Anonymous User'}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(referral.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[
                      styles.historyStatus,
                      referral.status === 'completed' && styles.historyStatusCompleted
                    ]}>
                      <Text style={styles.historyStatusText}>
                        {referral.status === 'completed' ? 'Completed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </BlurView>
          )}

          {/* How It Works */}
          <BlurView intensity={20} style={styles.howItWorksCard}>
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>How It Works</Text>
              
              <View style={styles.stepContainer}>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Share your referral code with friends</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>They sign up using your code</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>You both get premium features!</Text>
                </View>
              </View>
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
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContent: {
    padding: 20,
  },
  statsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  codeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeContent: {
    padding: 20,
    alignItems: 'center',
  },
  codeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  codeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rewardsContent: {
    padding: 20,
  },
  rewardsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardsSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 20,
  },
  rewardTier: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rewardTierCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  rewardIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardCount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  completedBadge: {
    fontSize: 20,
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyContent: {
    padding: 20,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  historyStatus: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyStatusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  historyStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  howItWorksCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  howItWorksContent: {
    padding: 20,
  },
  howItWorksTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
  },
  stepText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    flex: 1,
  },
})
