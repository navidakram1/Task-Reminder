import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

type FilterType = 'all' | 'assigned' | 'pending' | 'completed'

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, filter, searchQuery])

  const fetchTasks = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) {
        setLoading(false)
        return
      }

      // Fetch tasks with simplified query to avoid foreign key issues
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, status, assignee_id, emoji, created_at, household_id')
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Fetched tasks:', data?.length || 0)
      console.log('Sample task:', data?.[0])
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks
    console.log('Filtering tasks:', { totalTasks: tasks.length, filter, searchQuery })

    // Apply filter
    switch (filter) {
      case 'assigned':
        filtered = tasks.filter(task => {
          const isAssigned = task.assignee_id === user?.id
          console.log('Task assigned check:', { taskId: task.id, assigneeId: task.assignee_id, userId: user?.id, isAssigned })
          return isAssigned
        })
        break
      case 'completed':
        filtered = tasks.filter(task => {
          const isCompleted = task.status === 'completed'
          console.log('Task completed check:', { taskId: task.id, status: task.status, isCompleted })
          return isCompleted
        })
        break
      case 'pending':
        filtered = tasks.filter(task => task.status === 'pending' || !task.status)
        break
      default:
        filtered = tasks
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    console.log('Filtered result:', { filteredCount: filtered.length })
    setFilteredTasks(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchTasks()
    setRefreshing(false)
  }

  const markAllComplete = async () => {
    try {
      const taskIds = filteredTasks
        .filter(task => task.status !== 'completed')
        .map(task => task.id)

      if (taskIds.length === 0) {
        Alert.alert('Info', 'All visible tasks are already completed!')
        return
      }

      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .in('id', taskIds)

      if (error) throw error

      Alert.alert('Success', `Marked ${taskIds.length} tasks as completed!`)
      await fetchTasks()
    } catch (error) {
      console.error('Error marking tasks complete:', error)
      Alert.alert('Error', 'Failed to mark tasks as completed')
    }
  }

  const markTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (error) throw error

      await fetchTasks()
    } catch (error) {
      console.error('Error marking task complete:', error)
      Alert.alert('Error', 'Failed to mark task as completed')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'pending': return '⏳'
      case 'awaiting_approval': return '👀'
      default: return '📋'
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed': return { backgroundColor: '#d4edda', borderColor: '#c3e6cb' }
      case 'pending': return { backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }
      case 'awaiting_approval': return { backgroundColor: '#d1ecf1', borderColor: '#bee5eb' }
      default: return { backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }
    }
  }

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'completed': return { color: '#155724' }
      case 'pending': return { color: '#856404' }
      case 'awaiting_approval': return { color: '#0c5460' }
      default: return { color: '#6c757d' }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffc107'
      case 'completed':
        return '#28a745'
      case 'awaiting_approval':
        return '#17a2b8'
      default:
        return '#6c757d'
    }
  }

  const handleTaskPress = (taskId: string) => {
    router.push(`/(app)/tasks/${taskId}`)
  }

  const handleMarkComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'awaiting_approval' })
        .eq('id', taskId)

      if (error) throw error
      await fetchTasks()
    } catch (error) {
      console.error('Error marking task complete:', error)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>📋 Tasks</Text>
          <Text style={styles.subtitle}>
            {tasks.length} total • {tasks.filter(t => t.status === 'completed').length} completed
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              // Toggle sort order
              const sortedTasks = [...tasks].reverse()
              setTasks(sortedTasks)
            }}
          >
            <Text style={styles.sortButtonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/tasks/create')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            📋 All ({tasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
            ⏳ Pending ({tasks.filter(t => t.status === 'pending' || !t.status).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'assigned' && styles.activeFilter]}
          onPress={() => setFilter('assigned')}
        >
          <Text style={[styles.filterText, filter === 'assigned' && styles.activeFilterText]}>
            👤 Assigned ({tasks.filter(t => t.assignee_id === user?.id).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            ✅ Completed ({tasks.filter(t => t.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            // Mark all visible tasks as completed
            Alert.alert(
              'Mark All Complete',
              `Mark all ${filteredTasks.length} visible tasks as completed?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Mark Complete', onPress: () => markAllComplete() }
              ]
            )
          }}
        >
          <Text style={styles.quickActionText}>✅ Mark All Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(app)/tasks/create')}
        >
          <Text style={styles.quickActionText}>➕ Quick Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => handleTaskPress(task.id)}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleRow}>
                  {task.emoji && (
                    <Text style={styles.taskEmoji}>{task.emoji}</Text>
                  )}
                  <Text style={styles.taskTitle}>{task.title}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(task.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {task.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {task.description && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}

              <View style={styles.taskMeta}>
                <View style={styles.taskInfo}>
                  {task.assignee && (
                    <Text style={styles.assigneeText}>
                      Assigned to: {task.assignee.name}
                    </Text>
                  )}
                  {task.due_date && (
                    <Text style={styles.dueDateText}>
                      Due: {formatDate(task.due_date)}
                    </Text>
                  )}
                  {task.recurrence && (
                    <Text style={styles.recurrenceText}>
                      Repeats: {task.recurrence}
                    </Text>
                  )}
                </View>

                {task.status === 'pending' && task.assignee_id === user?.id && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleMarkComplete(task.id)}
                  >
                    <Text style={styles.completeButtonText}>Mark Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No tasks found</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Create your first task to get started'
                : `No ${filter} tasks found`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.createTaskButton}
                onPress={() => router.push('/(app)/tasks/create')}
              >
                <Text style={styles.createTaskButtonText}>Create Task</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Shuffle button removed - now available in task creation */}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterScrollView: {
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilter: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
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
    alignItems: 'flex-end',
  },
  taskInfo: {
    flex: 1,
  },
  assigneeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createTaskButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // bottomActions and shuffle button styles removed
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  // New styles for enhanced features
  headerLeft: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortButtonText: {
    fontSize: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
})
