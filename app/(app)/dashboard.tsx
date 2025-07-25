import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface DashboardData {
  upcomingTasks: any[]
  pendingTransfers: any[]
  recentBills: any[]
  household: any
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

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData>({
    upcomingTasks: [],
    pendingTransfers: [],
    recentBills: [],
    household: null,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [households, setHouseholds] = useState<Household[]>([])
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [switchingHousehold, setSwitchingHousehold] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
    fetchUserHouseholds()
  }, [])

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
        const { data: householdMember } = await supabase
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
          .single()

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

      console.log('About to setData with:', {
        upcomingTasks: tasks?.length || 0,
        pendingTransfers: transferRequests?.length || 0,
        recentBills: bills?.length || 0,
        household: householdData?.name || 'No household'
      })

      setData({
        upcomingTasks: tasks || [],
        pendingTransfers: transferRequests || [],
        recentBills: bills || [],
        household: {
          ...householdData,
          userRole: userRole,
        },
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
        <Text style={styles.noHouseholdTitle}>Welcome to HomeTask!</Text>
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>🏠 Welcome back!</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationBar,
              (data.upcomingTasks.length + data.pendingTransfers.length) === 0
                ? styles.notificationBarSuccess
                : styles.notificationBarAlert
            ]}
            onPress={() => router.push('/(app)/household/activity')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.notificationIcon,
              (data.upcomingTasks.length + data.pendingTransfers.length) === 0
                ? styles.notificationIconSuccess
                : styles.notificationIconAlert
            ]}>
              <Text style={styles.notificationBadge}>
                {(data.upcomingTasks.length + data.pendingTransfers.length) === 0
                  ? '✓'
                  : data.upcomingTasks.length + data.pendingTransfers.length
                }
              </Text>
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationText}>
                {data.upcomingTasks.length > 0
                  ? `${data.upcomingTasks.length} tasks due soon`
                  : data.pendingTransfers.length > 0
                    ? `${data.pendingTransfers.length} pending transfers`
                    : 'All caught up! 🎉'
                }
              </Text>
              <Text style={styles.notificationSubtext}>
                {(data.upcomingTasks.length + data.pendingTransfers.length) === 0
                  ? 'Great work, team!'
                  : 'Tap to view details'
                }
              </Text>
            </View>
            <Text style={styles.notificationArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Household Card with Dropdown */}
        <TouchableOpacity
          style={styles.householdCard}
          onPress={() => router.push('/(app)/household/activity')}
          activeOpacity={0.9}
        >
          <View style={styles.householdCardGradient}>
            <View style={styles.householdInfo}>
              <View style={styles.householdHeader}>
                <TouchableOpacity
                  style={styles.householdSelector}
                  onPress={(e) => {
                    e.stopPropagation()
                    setShowHouseholdModal(true)
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.householdName}>🏡 {data.household.name}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
                <View style={styles.householdBadge}>
                  <Text style={styles.badgeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.activityHint}>✨ Tap to view recent activity</Text>
              <View style={styles.householdStats}>
                <View style={styles.statItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statNumber}>{data.upcomingTasks.length}</Text>
                  </View>
                  <Text style={styles.statLabel}>Tasks</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statNumber}>{data.recentBills.length}</Text>
                  </View>
                  <Text style={styles.statLabel}>Bills</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statNumber}>{data.pendingTransfers.length}</Text>
                  </View>
                  <Text style={styles.statLabel}>Transfers</Text>
                </View>
              </View>
            </View>
            <View style={styles.householdIcon}>
              <View style={styles.arrowCircle}>
                <Text style={styles.householdIconText}>→</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionCard, styles.primaryAction]}
            onPress={() => router.push('/(app)/tasks/create')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <Text style={styles.actionTitle}>Create Task</Text>
            <Text style={styles.actionSubtitle}>Add new chore</Text>
            <View style={styles.actionGlow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.secondaryAction]}
            onPress={() => router.push('/(app)/bills/create')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>💰</Text>
            </View>
            <Text style={styles.actionTitle}>Add Bill</Text>
            <Text style={styles.actionSubtitle}>Split expense</Text>
            <View style={styles.actionGlow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.tertiaryAction]}
            onPress={() => router.push('/(app)/bills')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📊</Text>
            </View>
            <Text style={styles.actionTitle}>View Bills</Text>
            <Text style={styles.actionSubtitle}>Manage expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.tertiaryAction]}
            onPress={() => router.push('/(app)/household/transfer-requests')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🔄</Text>
            </View>
            <Text style={styles.actionTitle}>Transfers</Text>
            <Text style={styles.actionSubtitle}>
              {data.pendingTransfers.length > 0 ? `${data.pendingTransfers.length} pending` : 'No requests'}
            </Text>
            <View style={styles.actionGlow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.quaternaryAction]}
            onPress={() => router.push('/(app)/household/members')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>
            <Text style={styles.actionTitle}>Members</Text>
            <Text style={styles.actionSubtitle}>Manage team</Text>
            <View style={styles.actionGlow} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Feature Slider */}
      <View style={styles.featureSliderContainer}>
        <Text style={styles.sectionTitle}>✨ Discover Features</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featureSlider}
        >
          <View style={[styles.featureCard, styles.featureCard1]}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Smart Task Assignment</Text>
            <Text style={styles.featureDescription}>Auto-shuffle chores fairly among household members</Text>
          </View>

          <View style={[styles.featureCard, styles.featureCard2]}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureTitle}>Bill Splitting</Text>
            <Text style={styles.featureDescription}>Split expenses easily with custom amounts and tracking</Text>
          </View>

          <View style={[styles.featureCard, styles.featureCard3]}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureTitle}>Smart Reminders</Text>
            <Text style={styles.featureDescription}>Never miss a task with push and email notifications</Text>
          </View>

          <View style={[styles.featureCard, styles.featureCard4]}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureTitle}>Task Approval</Text>
            <Text style={styles.featureDescription}>Verify completed tasks with photo proof</Text>
          </View>
        </ScrollView>
      </View>

      {/* Navigation Guide */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Getting Started</Text>
        <View style={styles.guideContainer}>
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/tasks')}
            activeOpacity={0.8}
          >
            <View style={styles.guideIconContainer}>
              <Text style={styles.guideIcon}>📋</Text>
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Manage Tasks</Text>
              <Text style={styles.guideDescription}>View, create, and complete household chores</Text>
            </View>
            <View style={styles.guideArrowContainer}>
              <Text style={styles.guideArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/bills')}
            activeOpacity={0.8}
          >
            <View style={styles.guideIconContainer}>
              <Text style={styles.guideIcon}>💰</Text>
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Split Bills</Text>
              <Text style={styles.guideDescription}>Add expenses and track who owes what</Text>
            </View>
            <View style={styles.guideArrowContainer}>
              <Text style={styles.guideArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/bills')}
            activeOpacity={0.8}
          >
            <View style={styles.guideIconContainer}>
              <Text style={styles.guideIcon}>💰</Text>
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Bills & Expenses</Text>
              <Text style={styles.guideDescription}>Split bills, track payments, and manage household expenses</Text>
            </View>
            <View style={styles.guideArrowContainer}>
              <Text style={styles.guideArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/household/transfer-requests')}
            activeOpacity={0.8}
          >
            <View style={styles.guideIconContainer}>
              <Text style={styles.guideIcon}>🔄</Text>
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Transfer Requests</Text>
              <Text style={styles.guideDescription}>Manage task transfer requests</Text>
            </View>
            <View style={styles.guideArrowContainer}>
              <Text style={styles.guideArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Upcoming Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/tasks')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {data.upcomingTasks.length > 0 ? (
          data.upcomingTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}
            >
              <View style={styles.taskInfo}>
                <View style={styles.taskTitleRow}>
                  {task.emoji && (
                    <Text style={styles.taskEmoji}>{task.emoji}</Text>
                  )}
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
              <View style={styles.taskMeta}>
                {task.due_date && (
                  <Text style={styles.taskDueDate}>{formatDate(task.due_date)}</Text>
                )}
                <Text style={[styles.taskStatus, styles[`status_${task.status}`]]}>
                  {task.status.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/tasks/create')}>
              <Text style={styles.emptyStateAction}>Create your first task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {data.pendingTransfers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔄 Transfer Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/household/transfer-requests')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {data.pendingTransfers.slice(0, 3).map((request: any) => (
            <TouchableOpacity
              key={request.transfer_id}
              style={styles.transferCard}
              onPress={() => router.push('/(app)/household/transfer-requests')}
            >
              <View style={styles.transferInfo}>
                <Text style={styles.transferTitle}>📋 {request.task_title}</Text>
                <Text style={styles.transferFrom}>From: {request.from_user_name}</Text>
                <Text style={styles.transferDate}>
                  📅 {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.transferActions}>
                <Text style={styles.transferActionText}>Respond →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💰 Recent Bills</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/bills')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {data.recentBills.length > 0 ? (
          data.recentBills.map((bill) => (
            <TouchableOpacity
              key={bill.id}
              style={styles.billCard}
              onPress={() => router.push(`/(app)/bills/${bill.id}`)}
            >
              <View style={styles.billInfo}>
                <Text style={styles.billTitle}>{bill.title}</Text>
                <Text style={styles.billCategory}>{bill.category}</Text>
              </View>
              <View style={styles.billMeta}>
                <Text style={styles.billAmount}>{formatCurrency(bill.amount)}</Text>
                <Text style={styles.billDate}>{formatDate(bill.date)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent bills</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/bills/create')}>
              <Text style={styles.emptyStateAction}>Add your first bill</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Household Switcher Modal */}
      <Modal
        visible={showHouseholdModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHouseholdModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHouseholdModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Switch Household</Text>
            <TouchableOpacity onPress={() => {
              setShowHouseholdModal(false)
              router.push('/(onboarding)/create-join-household')
            }}>
              <Text style={styles.modalAddButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {households.map((household) => (
              <TouchableOpacity
                key={household.id}
                style={[
                  styles.householdOption,
                  household.is_active && styles.householdOptionActive
                ]}
                onPress={() => switchHousehold(household)}
                disabled={switchingHousehold}
              >
                <View style={styles.householdOptionLeft}>
                  <Text style={styles.householdOptionIcon}>
                    {household.type === 'group' ? '👥' : '🏠'}
                  </Text>
                  <View style={styles.householdOptionInfo}>
                    <Text style={[
                      styles.householdOptionName,
                      household.is_active && styles.householdOptionNameActive
                    ]}>
                      {household.name}
                    </Text>
                    <Text style={styles.householdOptionMeta}>
                      {household.member_count} member{household.member_count !== 1 ? 's' : ''} • {household.role}
                    </Text>
                  </View>
                </View>
                {household.is_active && (
                  <Text style={styles.activeIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            {households.length === 0 && (
              <View style={styles.emptyHouseholds}>
                <Text style={styles.emptyHouseholdsText}>No households found</Text>
                <TouchableOpacity
                  style={styles.createFirstHouseholdButton}
                  onPress={() => {
                    setShowHouseholdModal(false)
                    router.push('/(onboarding)/create-join-household')
                  }}
                >
                  <Text style={styles.createFirstHouseholdButtonText}>Create Your First Household</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  noHouseholdContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noHouseholdTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  noHouseholdText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createHouseholdButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  createHouseholdButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  notificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationBarAlert: {
    borderLeftColor: '#ff6b6b',
  },
  notificationBarSuccess: {
    borderLeftColor: '#4caf50',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconAlert: {
    backgroundColor: '#ff6b6b',
  },
  notificationIconSuccess: {
    backgroundColor: '#4caf50',
  },
  notificationBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationSubtext: {
    fontSize: 12,
    color: '#666',
  },
  notificationArrow: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: 'bold',
  },
  householdCard: {
    backgroundColor: '#667eea',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  householdCardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#667eea',
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  householdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  householdStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#e8eaff',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#8a9cff',
    marginHorizontal: 16,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  householdInfo: {
    flex: 1,
  },
  householdSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    marginBottom: 4,
  },
  activityHint: {
    fontSize: 14,
    color: '#e8f0fe',
  },
  householdIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  householdIconText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  status_pending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  status_transfer_requested: {
    backgroundColor: '#e2e3ff',
    color: '#4c4dff',
  },
  approveButton: {
    backgroundColor: '#28a745',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  billCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billInfo: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  billCategory: {
    fontSize: 14,
    color: '#666',
  },
  billMeta: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  billDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateAction: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalAddButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
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
})
