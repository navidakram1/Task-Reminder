import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface RecurringTask {
  id: string
  title: string
  description: string
  recurrence: 'daily' | 'weekly' | 'monthly'
  emoji: string
  assignee_name: string
  last_generated: string
  created_at: string
  instances_count: number
  completed_instances: number
}

interface RecurringStats {
  total_recurring_tasks: number
  active_instances: number
  completed_instances: number
  overdue_instances: number
}

export default function RecurringTasksScreen() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  const [stats, setStats] = useState<RecurringStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id, households(id, name)')
        .eq('user_id', user?.id)
        .single()

      if (!householdMember) {
        Alert.alert('Error', 'No household found')
        return
      }

      setHousehold(householdMember.households)
      const householdId = householdMember.household_id

      // Fetch recurring tasks (templates)
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          recurrence,
          emoji,
          last_generated,
          created_at,
          profiles!tasks_assignee_id_fkey(name)
        `)
        .eq('household_id', householdId)
        .eq('is_template', true)
        .not('recurrence', 'is', null)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      // Get instance counts for each recurring task
      const tasksWithCounts = await Promise.all(
        (tasks || []).map(async (task) => {
          const { count: totalInstances } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('parent_task_id', task.id)

          const { count: completedInstances } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('parent_task_id', task.id)
            .eq('status', 'completed')

          return {
            ...task,
            assignee_name: task.profiles?.name || 'Unassigned',
            instances_count: totalInstances || 0,
            completed_instances: completedInstances || 0,
          }
        })
      )

      setRecurringTasks(tasksWithCounts)

      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_recurring_task_stats', { household_id: householdId })

      if (!statsError && statsData && statsData.length > 0) {
        setStats(statsData[0])
      }

    } catch (error) {
      console.error('Error fetching recurring tasks:', error)
      Alert.alert('Error', 'Failed to load recurring tasks')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const generatePendingTasks = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.rpc('generate_pending_recurring_tasks')
      
      if (error) throw error

      Alert.alert(
        'Success',
        `Generated ${data || 0} new recurring task instances`,
        [{ text: 'OK', onPress: () => fetchData() }]
      )
    } catch (error) {
      console.error('Error generating tasks:', error)
      Alert.alert('Error', 'Failed to generate recurring tasks')
    } finally {
      setLoading(false)
    }
  }

  const viewTaskInstances = (taskId: string, taskTitle: string) => {
    router.push({
      pathname: '/(app)/tasks/recurring-instances',
      params: { taskId, taskTitle }
    })
  }

  const getRecurrenceIcon = (recurrence: string) => {
    switch (recurrence) {
      case 'daily': return '📅'
      case 'weekly': return '📆'
      case 'monthly': return '🗓️'
      default: return '🔄'
    }
  }

  const getRecurrenceColor = (recurrence: string) => {
    switch (recurrence) {
      case 'daily': return '#4CAF50'
      case 'weekly': return '#2196F3'
      case 'monthly': return '#FF9800'
      default: return '#9E9E9E'
    }
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading recurring tasks...</Text>
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
        <Text style={styles.title}>🔄 Recurring Tasks</Text>
        <Text style={styles.subtitle}>
          Manage your household's repeating chores
        </Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total_recurring_tasks}</Text>
            <Text style={styles.statLabel}>Recurring Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active_instances}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed_instances}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#f44336' }]}>
              {stats.overdue_instances}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generatePendingTasks}
        >
          <Text style={styles.generateButtonText}>⚡ Generate Pending Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(app)/tasks/create')}
        >
          <Text style={styles.createButtonText}>➕ Create Recurring Task</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tasksList}>
        {recurringTasks.length > 0 ? (
          recurringTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => viewTaskInstances(task.id, task.title)}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleRow}>
                  {task.emoji && (
                    <Text style={styles.taskEmoji}>{task.emoji}</Text>
                  )}
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>
                <View style={[
                  styles.recurrenceBadge,
                  { backgroundColor: getRecurrenceColor(task.recurrence) }
                ]}>
                  <Text style={styles.recurrenceIcon}>
                    {getRecurrenceIcon(task.recurrence)}
                  </Text>
                  <Text style={styles.recurrenceText}>
                    {task.recurrence}
                  </Text>
                </View>
              </View>

              {task.description && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}

              <View style={styles.taskMeta}>
                <Text style={styles.assigneeText}>
                  👤 {task.assignee_name}
                </Text>
                <Text style={styles.instancesText}>
                  📊 {task.completed_instances}/{task.instances_count} completed
                </Text>
              </View>

              <View style={styles.taskFooter}>
                <Text style={styles.lastGenerated}>
                  Last generated: {task.last_generated 
                    ? new Date(task.last_generated).toLocaleDateString()
                    : 'Never'
                  }
                </Text>
                <Text style={styles.viewInstances}>View instances →</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔄</Text>
            <Text style={styles.emptyStateTitle}>No Recurring Tasks</Text>
            <Text style={styles.emptyStateText}>
              Create tasks with daily, weekly, or monthly recurrence to see them here.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/(app)/tasks/create')}
            >
              <Text style={styles.emptyStateButtonText}>Create Recurring Task</Text>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  recurrenceIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assigneeText: {
    fontSize: 14,
    color: '#666',
  },
  instancesText: {
    fontSize: 14,
    color: '#666',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lastGenerated: {
    fontSize: 12,
    color: '#999',
  },
  viewInstances: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
