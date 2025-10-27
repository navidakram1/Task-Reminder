import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { APP_THEME } from '../../constants/AppTheme'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface DashboardData {
  upcomingTasks: any[]
  pendingTransfers: any[]
  recentBills: any[]
  household: any
  analytics: {
    tasksCompleted: number
    totalSpent: number
    avgTasksPerWeek: number
    householdEfficiency: number
  }
  activityFeed: any[]
  userScore: number
  scoreLevel: string
  scoreProgress: number
}

interface Household {
  id: string
  name: string
  invite_code: string
  role: string
  member_count: number
  is_default: boolean
  is_active: boolean
  type: string
}

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `in ${diffDays} days`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData>({
    upcomingTasks: [],
    pendingTransfers: [],
    recentBills: [],
    household: null,
    analytics: {
      tasksCompleted: 0,
      totalSpent: 0,
      avgTasksPerWeek: 0,
      householdEfficiency: 0,
    },
    activityFeed: [],
    userScore: 0,
    scoreLevel: 'Beginner',
    scoreProgress: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [households, setHouseholds] = useState<Household[]>([])
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [switchingHousehold, setSwitchingHousehold] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
    fetchUserHouseholds()
    fetchUserProfile()
    fetchUserScore()
  }, [])

  const calculateScoreLevel = (score: number) => {
    if (score < 100) return { level: 'Beginner', emoji: '🌱' }
    if (score < 250) return { level: 'Novice', emoji: '⭐' }
    if (score < 500) return { level: 'Expert', emoji: '🔥' }
    if (score < 1000) return { level: 'Master', emoji: '👑' }
    return { level: 'Legend', emoji: '🏆' }
  }

  const fetchUserScore = async () => {
    if (!user) return
    try {
      // Calculate score based on completed tasks and bills
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'completed')

      const { data: createdBills } = await supabase
        .from('bills')
        .select('id', { count: 'exact', head: true })
        .eq('paid_by', user.id)

      const completedCount = completedTasks?.length || 0
      const billsCount = createdBills?.length || 0

      // Score calculation: 10 points per completed task, 5 points per bill
      const totalScore = (completedCount * 10) + (billsCount * 5)
      const levelInfo = calculateScoreLevel(totalScore)

      // Calculate progress to next level
      const levels = [100, 250, 500, 1000]
      const currentLevelIndex = levels.findIndex(l => totalScore < l)
      const nextLevel = currentLevelIndex >= 0 ? levels[currentLevelIndex] : 1000
      const prevLevel = currentLevelIndex > 0 ? levels[currentLevelIndex - 1] : 0
      const progress = ((totalScore - prevLevel) / (nextLevel - prevLevel)) * 100

      setData(prev => ({
        ...prev,
        userScore: totalScore,
        scoreLevel: levelInfo.level,
        scoreProgress: Math.min(progress, 100)
      }))
    } catch (error) {
      console.error('Error fetching user score:', error)
    }
  }

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserHouseholds = async () => {
    if (!user) return

    try {
      const { data: householdData, error } = await supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          joined_at,
          households (
            id,
            name,
            invite_code,
            type
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Get member counts for each household
      const householdsWithCounts = await Promise.all(
        (householdData || []).map(async (hm) => {
          const { count } = await supabase
            .from('household_members')
            .select('*', { count: 'exact', head: true })
            .eq('household_id', hm.household_id)

          return {
            id: hm.household_id,
            name: hm.households.name,
            invite_code: hm.households.invite_code,
            type: hm.households.type || 'household',
            role: hm.role,
            member_count: count || 0,
            is_default: false, // Will be updated below
            is_active: data.household?.id === hm.household_id,
            joined_at: hm.joined_at
          }
        })
      )

      setHouseholds(householdsWithCounts)
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  const switchHousehold = async (household: Household) => {
    if (household.is_active) {
      setShowHouseholdModal(false)
      return
    }

    setSwitchingHousehold(true)
    try {
      // Update the current data to use the new household
      setData(prev => ({
        ...prev,
        household: {
          id: household.id,
          name: household.name,
          invite_code: household.invite_code
        }
      }))

      // Update households state
      setHouseholds(prev => prev.map(h => ({
        ...h,
        is_active: h.id === household.id
      })))

      setShowHouseholdModal(false)

      // Refresh dashboard data for new household
      await fetchDashboardData()

      Alert.alert('Success', `Switched to ${household.name}`)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to switch household')
    } finally {
      setSwitchingHousehold(false)
    }
  }

  const fetchDashboardData = async () => {
    if (!user) return

    console.log('Starting fetchDashboardData...')
    try {
      // Try to get user's default household first
      const { data: defaultHousehold } = await supabase.rpc('get_default_household')

      let householdData = null
      let userRole = 'member'

      if (defaultHousehold && defaultHousehold.length > 0) {
        // Use default household
        const defaultHH = defaultHousehold[0]
        householdData = {
          id: defaultHH.household_id,
          name: defaultHH.household_name,
          invite_code: defaultHH.invite_code,
        }
        userRole = defaultHH.user_role
      } else {
        // Fallback to first household user is a member of
        // Get user's active household using the new multi-household function
        const { data: activeHouseholds, error: householdError } = await supabase
          .rpc('get_user_active_household', {
            p_user_id: user.id
          })

        let householdMember = null
        if (activeHouseholds && activeHouseholds.length > 0) {
          const activeHousehold = activeHouseholds[0]
          householdMember = {
            household_id: activeHousehold.household_id,
            role: activeHousehold.user_role,
            households: {
              id: activeHousehold.household_id,
              name: activeHousehold.household_name,
              invite_code: activeHousehold.invite_code
            }
          }
        } else {
          // Fallback to first household if no active household function
          const { data: fallbackMember } = await supabase
            .from('household_members')
            .select(`
              household_id,
              role,
              households (
                id,
                name,
                invite_code
              )
            `)
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

          householdMember = fallbackMember
        }

        if (!householdMember) {
          setLoading(false)
          return
        }

        householdData = householdMember.households
        userRole = householdMember.role
      }

      if (!householdData) {
        setLoading(false)
        return
      }

      const householdId = householdData.id

      // Fetch upcoming tasks (very simple query - no assignee_id)
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, status, created_at')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
      }

      // Fetch pending transfer requests (gracefully handle if function doesn't exist)
      let transferRequests = []
      try {
        const { data, error } = await supabase.rpc('get_pending_transfer_requests')
        if (error) {
          console.error('Error fetching transfer requests:', error)
          transferRequests = []
        } else {
          transferRequests = data || []
        }
      } catch (error) {
        console.error('Transfer requests function not available:', error)
        transferRequests = []
      }

      // Fetch recent bills (gracefully handle if table doesn't exist)
      let bills = []
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('id, title, amount, category, date, paid_by, created_at')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error fetching bills:', error)
          bills = []
        } else {
          bills = data || []
        }
      } catch (error) {
        console.error('Bills table not available:', error)
        bills = []
      }

      // Fetch analytics data
      let analytics = {
        tasksCompleted: 0,
        totalSpent: 0,
        avgTasksPerWeek: 0,
        householdEfficiency: 0,
      }

      try {
        // Get completed tasks count for this month
        const { count: completedCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', householdId)
          .eq('status', 'completed')
          .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

        // Get total spending for this month
        const { data: spendingData } = await supabase
          .from('bills')
          .select('amount')
          .eq('household_id', householdId)
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

        const totalSpent = spendingData?.reduce((sum, bill) => sum + bill.amount, 0) || 0

        // Calculate average tasks per week (last 4 weeks)
        const fourWeeksAgo = new Date()
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

        const { count: recentTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', householdId)
          .gte('created_at', fourWeeksAgo.toISOString())

        const avgTasksPerWeek = Math.round((recentTasksCount || 0) / 4)

        // Calculate household efficiency (completed vs total tasks ratio)
        const { count: totalTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', householdId)
          .gte('created_at', fourWeeksAgo.toISOString())

        const efficiency = totalTasksCount ? Math.round(((recentTasksCount || 0) / totalTasksCount) * 100) : 0

        analytics = {
          tasksCompleted: completedCount || 0,
          totalSpent,
          avgTasksPerWeek,
          householdEfficiency: efficiency,
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }

      // Fetch activity feed
      let activityFeed = []
      try {
        // Get recent activities (tasks created, completed, bills added)
        const { data: recentActivities } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            status,
            created_at,
            updated_at,
            assignee_id,
            profiles:assignee_id (name, email)
          `)
          .eq('household_id', householdId)
          .order('updated_at', { ascending: false })
          .limit(10)

        activityFeed = recentActivities?.map(activity => ({
          id: activity.id,
          type: 'task',
          title: activity.title,
          status: activity.status,
          timestamp: activity.updated_at,
          user: activity.profiles?.name || activity.profiles?.email?.split('@')[0] || 'Someone',
        })) || []
      } catch (error) {
        console.error('Error fetching activity feed:', error)
      }

      console.log('About to setData with:', {
        upcomingTasks: tasks?.length || 0,
        pendingTransfers: transferRequests?.length || 0,
        recentBills: bills?.length || 0,
        household: householdData?.name || 'No household',
        analytics,
        activityFeed: activityFeed.length
      })

      setData({
        upcomingTasks: tasks || [],
        pendingTransfers: transferRequests || [],
        recentBills: bills || [],
        household: {
          ...householdData,
          userRole: userRole,
        },
        analytics,
        activityFeed,
      })

      console.log('setData completed successfully')
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed': return { backgroundColor: '#d4edda', borderColor: '#c3e6cb' }
      case 'pending': return { backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }
      case 'transfer_requested': return { backgroundColor: '#e2e3ff', borderColor: '#c5c6ff' }
      default: return { backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }
    }
  }

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'completed': return { color: '#155724' }
      case 'pending': return { color: '#856404' }
      case 'transfer_requested': return { color: '#4c4dff' }
      default: return { color: '#6c757d' }
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getUserDisplayName = () => {
    return user?.user_metadata?.name ||
           user?.user_metadata?.full_name ||
           user?.email?.split('@')[0] ||
           'Friend'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!data.household) {
    return (
      <View style={styles.noHouseholdContainer}>
        <Text style={styles.noHouseholdTitle}>Welcome to SplitDuty!</Text>
        <Text style={styles.noHouseholdText}>
          You're not part of any household yet. Create one or join an existing household to get started.
        </Text>
        <TouchableOpacity
          style={styles.createHouseholdButton}
          onPress={() => router.push('/(onboarding)/create-join-household')}
        >
          <Text style={styles.createHouseholdButtonText}>Create or Join Household</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header with Gradient */}
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  {getGreeting()}, {getUserDisplayName()}
                </Text>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.headerRightContainer}>
                {/* Score Badge */}
                <TouchableOpacity
                  style={styles.scoreBadge}
                  onPress={() => router.push('/(app)/social/achievements')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scoreBadgeEmoji}>⭐</Text>
                  <View style={styles.scoreBadgeContent}>
                    <Text style={styles.scoreBadgeValue}>{data.userScore}</Text>
                    <Text style={styles.scoreBadgeLabel}>{data.scoreLevel}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => router.push('/(app)/settings')}
                  activeOpacity={0.8}
                >
                  {userProfile?.avatar_url ? (
                    <Image
                      source={{ uri: userProfile.avatar_url }}
                      style={styles.profileAvatar}
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Text style={styles.profileIcon}>👤</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Enhanced Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusContent}>
                <View style={styles.statusIconContainer}>
                  <Text style={styles.statusIcon}>
                    {(data.upcomingTasks.length + data.pendingTransfers.length) === 0 ? '✨' : '📋'}
                  </Text>
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    {(data.upcomingTasks.length + data.pendingTransfers.length) === 0
                      ? 'All caught up!'
                      : `${data.upcomingTasks.length + data.pendingTransfers.length} items need attention`
                    }
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {data.upcomingTasks.length} tasks • {data.recentBills.length} bills
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Household Selector */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.householdSelector}
            onPress={() => setShowHouseholdModal(true)}
          >
            <View style={styles.householdInfo}>
              <Text style={styles.householdIcon}>🏠</Text>
              <View style={styles.householdDetails}>
                <Text style={styles.householdName}>{data.household.name}</Text>
                <Text style={styles.householdMeta}>Tap to switch households</Text>
              </View>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions - Modern Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardPrimary]}
              onPress={() => router.push('/(app)/tasks/create')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>📝</Text>
              </View>
              <Text style={styles.quickActionTitle}>Add Task</Text>
              <Text style={styles.quickActionSubtitle}>Create new task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardSecondary]}
              onPress={() => router.push('/(app)/bills/create')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>💰</Text>
              </View>
              <Text style={styles.quickActionTitle}>Add Bill</Text>
              <Text style={styles.quickActionSubtitle}>Split expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardTertiary]}
              onPress={() => router.push('/(app)/tasks/random-assignment')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>🎲</Text>
              </View>
              <Text style={styles.quickActionTitle}>Auto Assign</Text>
              <Text style={styles.quickActionSubtitle}>Fair distribution</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardQuaternary]}
              onPress={() => router.push('/(app)/household/members')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>👥</Text>
              </View>
              <Text style={styles.quickActionTitle}>Members</Text>
              <Text style={styles.quickActionSubtitle}>View household</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/household/activity')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {data.activityFeed.length > 0 ? (
            <View style={styles.activityList}>
              {data.activityFeed.slice(0, 3).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>
                    {activity.type === 'task_completed' ? '✅' :
                     activity.type === 'bill_added' ? '💰' :
                     activity.type === 'member_joined' ? '👋' : '📝'}
                  </Text>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{activity.time_ago}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          )}
        </View>

        {/* Tasks Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/tasks')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {data.upcomingTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {data.upcomingTasks.slice(0, 3).map((task, index) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => router.push(`/(app)/tasks/${task.id}`)}
                >
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.due_date && (
                      <Text style={styles.taskDue}>
                        Due {formatDate(task.due_date)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.chevronIcon}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming tasks</Text>
            </View>
          )}
        </View>

        {/* Bills Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bills</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/bills')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {data.recentBills.length > 0 ? (
            <View style={styles.billsList}>
              {data.recentBills.slice(0, 3).map((bill, index) => (
                <TouchableOpacity
                  key={bill.id}
                  style={styles.billItem}
                  onPress={() => router.push(`/(app)/bills/${bill.id}`)}
                >
                  <View style={styles.billContent}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                    <Text style={styles.billAmount}>${bill.amount}</Text>
                  </View>
                  <Text style={styles.chevronIcon}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent bills</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/tasks/create')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Household Switcher Modal */}
      <Modal
        visible={showHouseholdModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHouseholdModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Switch Household</Text>
            <TouchableOpacity onPress={() => setShowHouseholdModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {households.map((household) => (
              <TouchableOpacity
                key={household.id}
                style={[
                  styles.modalHouseholdItem,
                  household.is_active && styles.modalHouseholdItemActive
                ]}
                onPress={() => switchHousehold(household)}
              >
                <Text style={styles.modalHouseholdIcon}>
                  {household.type === 'group' ? '👥' : '🏠'}
                </Text>
                <View style={styles.modalHouseholdInfo}>
                  <Text style={styles.modalHouseholdName}>{household.name}</Text>
                  <Text style={styles.modalHouseholdMeta}>
                    {household.member_count} members
                  </Text>
                </View>
                {household.is_active && (
                  <Text style={styles.modalActiveIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalAddHousehold}
              onPress={() => {
                setShowHouseholdModal(false)
                router.push('/(onboarding)/create-join-household')
              }}
            >
              <Text style={styles.modalAddIcon}>+</Text>
              <Text style={styles.modalAddText}>Create or Join Household</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textSecondary,
  },
  noHouseholdContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: APP_THEME.spacing.lg,
  },
  noHouseholdTitle: {
    fontSize: APP_THEME.typography.fontSize.xxl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.base,
    textAlign: 'center',
  },
  noHouseholdText: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: APP_THEME.spacing.xl,
  },
  createHouseholdButton: {
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: APP_THEME.spacing.base,
    paddingHorizontal: APP_THEME.spacing.xl,
    borderRadius: APP_THEME.borderRadius.lg,
  },
  createHouseholdButtonText: {
    color: APP_THEME.colors.surface,
    fontSize: APP_THEME.typography.fontSize.lg,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
  },

  // Header Styles
  header: {
    backgroundColor: APP_THEME.colors.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: APP_THEME.spacing.lg,
    paddingBottom: APP_THEME.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: APP_THEME.spacing.lg,
  },
  greetingText: {
    fontSize: APP_THEME.typography.fontSize.xxxl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.xs,
  },
  dateText: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textSecondary,
    fontWeight: APP_THEME.typography.fontWeight.medium,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    overflow: 'hidden',
  },
  profileIcon: {
    fontSize: 20,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Status Card
  statusCard: {
    backgroundColor: APP_THEME.colors.background,
    borderRadius: APP_THEME.borderRadius.base,
    padding: APP_THEME.spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.xs,
  },
  statusSubtitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
  statusEmoji: {
    fontSize: 24,
  },

  // Section Styles
  section: {
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: APP_THEME.spacing.lg,
    marginBottom: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.base,
    padding: APP_THEME.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_THEME.spacing.base,
  },
  sectionTitle: {
    fontSize: APP_THEME.typography.fontSize.lg,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
  },
  seeAllText: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.primary,
    fontWeight: APP_THEME.typography.fontWeight.medium,
  },

  // Household Selector
  householdSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: APP_THEME.spacing.xs,
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdIcon: {
    fontSize: 20,
    marginRight: APP_THEME.spacing.base,
  },
  householdDetails: {
    flex: 1,
  },
  householdName: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.xs,
  },
  householdMeta: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
  chevronIcon: {
    fontSize: 18,
    color: APP_THEME.colors.textTertiary,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: APP_THEME.spacing.base,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: APP_THEME.colors.background,
    borderRadius: APP_THEME.borderRadius.base,
    padding: APP_THEME.spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: APP_THEME.spacing.sm,
  },
  quickActionTitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
    textAlign: 'center',
  },

  // Activity List
  activityList: {
    gap: APP_THEME.spacing.base,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: APP_THEME.spacing.sm,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: APP_THEME.spacing.base,
    width: 24,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: APP_THEME.typography.fontSize.sm,
    fontWeight: APP_THEME.typography.fontWeight.medium,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.xs,
  },
  activityTime: {
    fontSize: APP_THEME.typography.fontSize.xs,
    color: APP_THEME.colors.textSecondary,
  },


  // New Quick Actions Grid Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  actionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    opacity: 0.1,
  },
  primaryAction: {
    borderColor: '#667eea',
    backgroundColor: '#f8faff',
  },
  secondaryAction: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  tertiaryAction: {
    borderColor: '#ffc107',
    backgroundColor: '#fffef8',
  },
  quaternaryAction: {
    borderColor: '#17a2b8',
    backgroundColor: '#f8feff',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Feature Slider Styles
  featureSliderContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureSlider: {
    paddingRight: 20,
  },
  featureCard: {
    width: 200,
    padding: 20,
    borderRadius: 20,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureCard1: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  featureCard2: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  featureCard3: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  featureCard4: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Guide Section Styles
  guideContainer: {
    gap: 12,
  },
  guideCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  guideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guideIcon: {
    fontSize: 24,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  guideDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  guideArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideArrow: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskCreated: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Transfer Card Styles
  transferCard: {
    backgroundColor: '#f8faff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  transferInfo: {
    flex: 1,
  },
  transferTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transferFrom: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginBottom: 2,
  },
  transferDate: {
    fontSize: 12,
    color: '#999',
  },
  transferActions: {
    alignItems: 'flex-end',
  },
  transferActionText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  // Enhanced Cool Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  modalHeaderGradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  modalCloseButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  modalAddButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddButtonText: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  // Cool Household Cards
  coolHouseholdCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coolHouseholdCardActive: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
    shadowColor: '#667eea',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  householdCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#667eea',
    opacity: 0,
  },
  householdCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  householdCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  householdIconContainerActive: {
    backgroundColor: '#667eea',
  },
  householdCardIcon: {
    fontSize: 24,
  },
  householdCardInfo: {
    flex: 1,
  },
  householdCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  householdCardNameActive: {
    color: '#667eea',
  },
  householdCardMeta: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  householdCardType: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  householdCardRight: {
    alignItems: 'center',
  },
  activeIndicatorContainer: {
    alignItems: 'center',
  },
  activeIndicatorText: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeLabel: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchIndicator: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  switchArrow: {
    fontSize: 16,
    color: '#94a3b8',
  },
  activeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#667eea',
  },
  householdOption: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  householdOptionActive: {
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  householdOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  householdOptionInfo: {
    flex: 1,
  },
  householdOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  householdOptionNameActive: {
    color: '#667eea',
  },
  householdOptionMeta: {
    fontSize: 14,
    color: '#64748b',
  },
  activeIndicator: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  emptyHouseholds: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyHouseholdsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstHouseholdButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createFirstHouseholdButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Analytics Widgets Styles
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
  },
  analyticsCard1: {
    borderLeftColor: '#4caf50',
    backgroundColor: '#f8fff9',
  },
  analyticsCard2: {
    borderLeftColor: '#ff9800',
    backgroundColor: '#fffef8',
  },
  analyticsCard3: {
    borderLeftColor: '#2196f3',
    backgroundColor: '#f8fcff',
  },
  analyticsCard4: {
    borderLeftColor: '#9c27b0',
    backgroundColor: '#fef8ff',
  },
  analyticsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsIcon: {
    fontSize: 24,
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  analyticsSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Activity Feed Styles
  activityFeedContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityUser: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  fabIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  // Work Showcase Styles
  workShowcaseContainer: {
    gap: 16,
  },
  workShowcaseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  workShowcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workShowcaseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workShowcaseIconCompleted: {
    backgroundColor: '#28a745',
  },
  workShowcaseIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  workShowcaseInfo: {
    flex: 1,
  },
  workShowcaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  workShowcaseSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  workShowcaseBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  workShowcaseBadgeCompleted: {
    backgroundColor: '#28a745',
  },
  workShowcaseBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  workShowcasePreview: {
    gap: 8,
  },
  workPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  workPreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  workPreviewText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  workPreviewDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  workPreviewMore: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  workShowcaseEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  workShowcaseEmptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  workShowcaseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  workStatItem: {
    alignItems: 'center',
  },
  workStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  // Tasks List
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 14,
    color: '#666',
  },

  // Bills List
  billsList: {
    gap: 8,
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  billContent: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 14,
    color: '#666',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 18,
    color: '#666',
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHouseholdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  modalHouseholdItemActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalHouseholdIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalHouseholdInfo: {
    flex: 1,
  },
  modalHouseholdName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  modalHouseholdMeta: {
    fontSize: 14,
    color: '#666',
  },
  modalActiveIndicator: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalAddHousehold: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  modalAddIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#666',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },

  // Enhanced Header Styles
  headerGradient: {
    backgroundColor: '#FF6B6B',
    paddingBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Status Card
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 28,
  },
  statusTextContainer: {
    flex: 1,
  },

  // Quick Action Cards with Colors
  quickActionCardPrimary: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  quickActionCardSecondary: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  quickActionCardTertiary: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickActionCardQuaternary: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },

  // Score Badge Styles
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  scoreBadgeEmoji: {
    fontSize: 18,
  },
  scoreBadgeContent: {
    alignItems: 'flex-start',
  },
  scoreBadgeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreBadgeLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
})
