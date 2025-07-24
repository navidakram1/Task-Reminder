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
  pendingApprovals: any[]
  recentBills: any[]
  household: any
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData>({
    upcomingTasks: [],
    pendingApprovals: [],
    recentBills: [],
    household: null,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

      // Fetch upcoming tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', householdId)
        .in('status', ['pending', 'awaiting_approval'])
        .order('due_date', { ascending: true })
        .limit(5)

      // Fetch pending approvals
      const { data: approvals } = await supabase
        .from('task_approvals')
        .select('*')
        .eq('status', 'pending')
        .limit(5)

      // Fetch recent bills
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('About to setData with:', {
        upcomingTasks: tasks?.length || 0,
        pendingApprovals: approvals?.length || 0,
        recentBills: bills?.length || 0,
        household: householdData?.name || 'No household'
      })

      setData({
        upcomingTasks: tasks || [],
        pendingApprovals: approvals || [],
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
          <Text style={styles.welcomeText}>🏠 Welcome back!</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}</Text>
        </View>

        <HouseholdSwitcher
          currentHousehold={data.household}
          onHouseholdChange={(household) => {
            // Update the data when household changes
            setData(prev => ({ ...prev, household }))
            // Refresh dashboard data for new household
            fetchDashboardData()
          }}
        />

        <TouchableOpacity
          style={styles.householdCard}
          onPress={() => router.push('/(app)/household/activity')}
        >
          <View style={styles.householdInfo}>
            <Text style={styles.householdName}>{data.household.name}</Text>
            <Text style={styles.activityHint}>📋 View recent activity</Text>
          </View>
          <View style={styles.householdIcon}>
            <Text style={styles.householdIconText}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionCard, styles.primaryAction]}
            onPress={() => router.push('/(app)/tasks/create')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <Text style={styles.actionTitle}>Create Task</Text>
            <Text style={styles.actionSubtitle}>Add new chore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.secondaryAction]}
            onPress={() => router.push('/(app)/bills/create')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>💰</Text>
            </View>
            <Text style={styles.actionTitle}>Add Bill</Text>
            <Text style={styles.actionSubtitle}>Split expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.tertiaryAction]}
            onPress={() => router.push('/(app)/tasks/random-assignment')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🎲</Text>
            </View>
            <Text style={styles.actionTitle}>Shuffle Tasks</Text>
            <Text style={styles.actionSubtitle}>Random assign</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, styles.quaternaryAction]}
            onPress={() => router.push('/(app)/household/members')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>
            <Text style={styles.actionTitle}>Members</Text>
            <Text style={styles.actionSubtitle}>Manage team</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature Slider */}
      <FeatureSlider />

      {/* Navigation Guide */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Getting Started</Text>
        <View style={styles.guideContainer}>
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/tasks')}
          >
            <Text style={styles.guideIcon}>📋</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Manage Tasks</Text>
              <Text style={styles.guideDescription}>View, create, and complete household chores</Text>
            </View>
            <Text style={styles.guideArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/bills')}
          >
            <Text style={styles.guideIcon}>💰</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Split Bills</Text>
              <Text style={styles.guideDescription}>Add expenses and track who owes what</Text>
            </View>
            <Text style={styles.guideArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => router.push('/(app)/approvals')}
          >
            <Text style={styles.guideIcon}>✅</Text>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>Approve Work</Text>
              <Text style={styles.guideDescription}>Review and approve completed tasks</Text>
            </View>
            <Text style={styles.guideArrow}>→</Text>
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

      {data.pendingApprovals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Pending Approvals</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/approvals')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {data.pendingApprovals.map((approval) => (
            <TouchableOpacity
              key={approval.id}
              style={styles.approvalCard}
              onPress={() => router.push(`/(app)/approvals/${approval.id}`)}
            >
              <View style={styles.approvalInfo}>
                <Text style={styles.approvalTitle}>{approval.tasks?.title}</Text>
                <Text style={styles.approvalDescription}>Waiting for approval</Text>
              </View>
              <View style={styles.approvalActions}>
                <TouchableOpacity style={styles.approveButton}>
                  <Text style={styles.approveButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton}>
                  <Text style={styles.rejectButtonText}>✗</Text>
                </TouchableOpacity>
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
    marginBottom: 20,
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
  householdCard: {
    backgroundColor: '#667eea',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  householdInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  status_awaiting_approval: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
  },
  approvalCard: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalInfo: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  approvalDescription: {
    fontSize: 14,
    color: '#666',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
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
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
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
  // Guide Section Styles
  guideContainer: {
    gap: 12,
  },
  guideCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guideIcon: {
    fontSize: 24,
    marginRight: 16,
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
  guideArrow: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
})
