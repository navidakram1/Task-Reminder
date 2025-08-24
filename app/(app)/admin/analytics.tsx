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

interface AnalyticsData {
  revenue: {
    total: number
    monthly: number
    growth_rate: number
    subscriptions: {
      free: number
      monthly: number
      lifetime: number
    }
  }
  users: {
    total: number
    active_monthly: number
    active_daily: number
    retention_rate: number
    churn_rate: number
    new_signups: number
  }
  engagement: {
    tasks_created: number
    bills_added: number
    households_created: number
    avg_session_duration: number
    feature_usage: {
      task_management: number
      bill_splitting: number
      notifications: number
      social_features: number
    }
  }
  growth: {
    user_growth_rate: number
    revenue_growth_rate: number
    referral_conversion: number
    top_acquisition_channels: Array<{
      channel: string
      users: number
      conversion_rate: number
    }>
  }
}

export default function BusinessAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const { user } = useAuth()

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('subscription_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Fetch user data
      const { data: userData } = await supabase
        .from('user_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Fetch engagement data
      const { data: engagementData } = await supabase
        .from('analytics_events')
        .select('event_type, event_data, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Process and format data
      const processedAnalytics: AnalyticsData = {
        revenue: {
          total: revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
          monthly: revenueData?.filter(item => 
            new Date(item.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
          growth_rate: calculateGrowthRate(revenueData || []),
          subscriptions: {
            free: userData?.filter(u => u.subscription_type === 'free').length || 0,
            monthly: userData?.filter(u => u.subscription_type === 'monthly').length || 0,
            lifetime: userData?.filter(u => u.subscription_type === 'lifetime').length || 0,
          }
        },
        users: {
          total: userData?.length || 0,
          active_monthly: userData?.filter(u => u.last_active >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0,
          active_daily: userData?.filter(u => u.last_active >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length || 0,
          retention_rate: calculateRetentionRate(userData || []),
          churn_rate: calculateChurnRate(userData || []),
          new_signups: userData?.filter(u => 
            new Date(u.created_at) >= startDate
          ).length || 0,
        },
        engagement: {
          tasks_created: engagementData?.filter(e => e.event_type === 'task_created').length || 0,
          bills_added: engagementData?.filter(e => e.event_type === 'bill_added').length || 0,
          households_created: engagementData?.filter(e => e.event_type === 'household_created').length || 0,
          avg_session_duration: calculateAvgSessionDuration(engagementData || []),
          feature_usage: {
            task_management: engagementData?.filter(e => e.event_type.includes('task')).length || 0,
            bill_splitting: engagementData?.filter(e => e.event_type.includes('bill')).length || 0,
            notifications: engagementData?.filter(e => e.event_type.includes('notification')).length || 0,
            social_features: engagementData?.filter(e => e.event_type.includes('social')).length || 0,
          }
        },
        growth: {
          user_growth_rate: calculateUserGrowthRate(userData || []),
          revenue_growth_rate: calculateGrowthRate(revenueData || []),
          referral_conversion: calculateReferralConversion(engagementData || []),
          top_acquisition_channels: calculateTopChannels(userData || [])
        }
      }

      setAnalytics(processedAnalytics)
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateGrowthRate = (data: any[]) => {
    if (data.length < 2) return 0
    const current = data.slice(-30).reduce((sum, item) => sum + (item.amount || 1), 0)
    const previous = data.slice(-60, -30).reduce((sum, item) => sum + (item.amount || 1), 0)
    return previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  const calculateRetentionRate = (users: any[]) => {
    const activeUsers = users.filter(u => u.last_active >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    return users.length > 0 ? (activeUsers.length / users.length) * 100 : 0
  }

  const calculateChurnRate = (users: any[]) => {
    const churnedUsers = users.filter(u => u.last_active < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    return users.length > 0 ? (churnedUsers.length / users.length) * 100 : 0
  }

  const calculateAvgSessionDuration = (events: any[]) => {
    const sessionEvents = events.filter(e => e.event_type === 'session_duration')
    if (sessionEvents.length === 0) return 0
    const totalDuration = sessionEvents.reduce((sum, e) => sum + (e.event_data?.duration || 0), 0)
    return Math.round(totalDuration / sessionEvents.length / 60) // Convert to minutes
  }

  const calculateUserGrowthRate = (users: any[]) => {
    const thisMonth = users.filter(u => 
      new Date(u.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    const lastMonth = users.filter(u => {
      const date = new Date(u.created_at)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      return date >= twoMonthsAgo && date < monthAgo
    }).length
    return lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
  }

  const calculateReferralConversion = (events: any[]) => {
    const referralShares = events.filter(e => e.event_type === 'referral_shared').length
    const referralSignups = events.filter(e => e.event_type === 'referral_signup').length
    return referralShares > 0 ? (referralSignups / referralShares) * 100 : 0
  }

  const calculateTopChannels = (users: any[]) => {
    const channels = users.reduce((acc, user) => {
      const channel = user.acquisition_channel || 'direct'
      acc[channel] = (acc[channel] || 0) + 1
      return acc
    }, {})

    return Object.entries(channels)
      .map(([channel, count]) => ({
        channel,
        users: count as number,
        conversion_rate: Math.random() * 20 + 5 // Mock conversion rate
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
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
            <Text style={styles.headerTitle}>Business Analytics</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeRangeButton,
                    timeRange === option.value && styles.timeRangeButtonActive
                  ]}
                  onPress={() => setTimeRange(option.value as any)}
                >
                  <Text style={[
                    styles.timeRangeText,
                    timeRange === option.value && styles.timeRangeTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Revenue Metrics */}
          <BlurView intensity={20} style={styles.metricsCard}>
            <View style={styles.metricsContent}>
              <Text style={styles.metricsTitle}>💰 Revenue</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatCurrency(analytics?.revenue.total || 0)}</Text>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{formatCurrency(analytics?.revenue.monthly || 0)}</Text>
                  <Text style={styles.metricLabel}>Monthly Revenue</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: (analytics?.revenue.growth_rate || 0) >= 0 ? '#28a745' : '#dc3545' }
                  ]}>
                    {formatPercentage(analytics?.revenue.growth_rate || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>Growth Rate</Text>
                </View>
              </View>
              
              <View style={styles.subscriptionBreakdown}>
                <Text style={styles.subscriptionTitle}>Subscription Breakdown</Text>
                <View style={styles.subscriptionStats}>
                  <View style={styles.subscriptionStat}>
                    <Text style={styles.subscriptionCount}>{analytics?.revenue.subscriptions.free || 0}</Text>
                    <Text style={styles.subscriptionType}>Free</Text>
                  </View>
                  <View style={styles.subscriptionStat}>
                    <Text style={styles.subscriptionCount}>{analytics?.revenue.subscriptions.monthly || 0}</Text>
                    <Text style={styles.subscriptionType}>Monthly</Text>
                  </View>
                  <View style={styles.subscriptionStat}>
                    <Text style={styles.subscriptionCount}>{analytics?.revenue.subscriptions.lifetime || 0}</Text>
                    <Text style={styles.subscriptionType}>Lifetime</Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>

          {/* User Metrics */}
          <BlurView intensity={20} style={styles.metricsCard}>
            <View style={styles.metricsContent}>
              <Text style={styles.metricsTitle}>👥 Users</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.users.total || 0}</Text>
                  <Text style={styles.metricLabel}>Total Users</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.users.active_monthly || 0}</Text>
                  <Text style={styles.metricLabel}>Monthly Active</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.users.active_daily || 0}</Text>
                  <Text style={styles.metricLabel}>Daily Active</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.users.new_signups || 0}</Text>
                  <Text style={styles.metricLabel}>New Signups</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: '#28a745' }
                  ]}>
                    {formatPercentage(analytics?.users.retention_rate || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>Retention Rate</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: '#dc3545' }
                  ]}>
                    {formatPercentage(analytics?.users.churn_rate || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>Churn Rate</Text>
                </View>
              </View>
            </View>
          </BlurView>

          {/* Engagement Metrics */}
          <BlurView intensity={20} style={styles.metricsCard}>
            <View style={styles.metricsContent}>
              <Text style={styles.metricsTitle}>📊 Engagement</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.engagement.tasks_created || 0}</Text>
                  <Text style={styles.metricLabel}>Tasks Created</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.engagement.bills_added || 0}</Text>
                  <Text style={styles.metricLabel}>Bills Added</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.engagement.households_created || 0}</Text>
                  <Text style={styles.metricLabel}>Households</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{analytics?.engagement.avg_session_duration || 0}m</Text>
                  <Text style={styles.metricLabel}>Avg Session</Text>
                </View>
              </View>

              <View style={styles.featureUsage}>
                <Text style={styles.featureUsageTitle}>Feature Usage</Text>
                {Object.entries(analytics?.engagement.feature_usage || {}).map(([feature, usage]) => (
                  <View key={feature} style={styles.featureUsageItem}>
                    <Text style={styles.featureUsageName}>
                      {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <Text style={styles.featureUsageValue}>{usage}</Text>
                  </View>
                ))}
              </View>
            </View>
          </BlurView>

          {/* Growth Metrics */}
          <BlurView intensity={20} style={styles.metricsCard}>
            <View style={styles.metricsContent}>
              <Text style={styles.metricsTitle}>🚀 Growth</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: (analytics?.growth.user_growth_rate || 0) >= 0 ? '#28a745' : '#dc3545' }
                  ]}>
                    {formatPercentage(analytics?.growth.user_growth_rate || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>User Growth</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[
                    styles.metricValue,
                    { color: (analytics?.growth.revenue_growth_rate || 0) >= 0 ? '#28a745' : '#dc3545' }
                  ]}>
                    {formatPercentage(analytics?.growth.revenue_growth_rate || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>Revenue Growth</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {formatPercentage(analytics?.growth.referral_conversion || 0)}
                  </Text>
                  <Text style={styles.metricLabel}>Referral Conversion</Text>
                </View>
              </View>

              <View style={styles.acquisitionChannels}>
                <Text style={styles.acquisitionTitle}>Top Acquisition Channels</Text>
                {analytics?.growth.top_acquisition_channels.map((channel, index) => (
                  <View key={index} style={styles.channelItem}>
                    <Text style={styles.channelName}>{channel.channel}</Text>
                    <View style={styles.channelStats}>
                      <Text style={styles.channelUsers}>{channel.users} users</Text>
                      <Text style={styles.channelConversion}>
                        {channel.conversion_rate.toFixed(1)}% conv.
                      </Text>
                    </View>
                  </View>
                ))}
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
  timeRangeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeRangeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  timeRangeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  timeRangeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  metricsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricsContent: {
    padding: 20,
  },
  metricsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  subscriptionBreakdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  subscriptionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subscriptionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  subscriptionStat: {
    alignItems: 'center',
  },
  subscriptionCount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscriptionType: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  featureUsage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  featureUsageTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featureUsageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureUsageName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  featureUsageValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  acquisitionChannels: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  acquisitionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  channelStats: {
    alignItems: 'flex-end',
  },
  channelUsers: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  channelConversion: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
})
