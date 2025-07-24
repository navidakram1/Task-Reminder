import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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

    try {
      // Fetch user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select(`
          household_id,
          households (
            id,
            name,
            invite_code
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (!householdMember?.households) {
        setLoading(false)
        return
      }

      const household = householdMember.households
      const householdId = household.id

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
        .select(`
          *,
          tasks (
            title,
            description
          )
        `)
        .eq('status', 'pending')
        .limit(5)

      // Fetch recent bills
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(5)

      setData({
        upcomingTasks: tasks || [],
        pendingApprovals: approvals || [],
        recentBills: bills || [],
        household,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.householdName}>{data.household.name}</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(app)/tasks/create')}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(app)/bills/create')}
        >
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>Add Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(app)/tasks/random-assignment')}
        >
          <Text style={styles.quickActionIcon}>🔄</Text>
          <Text style={styles.quickActionText}>Shuffle</Text>
        </TouchableOpacity>
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
                <Text style={styles.taskTitle}>{task.title}</Text>
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
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  householdName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
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
})
