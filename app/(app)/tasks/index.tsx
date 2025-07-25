import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

type FilterType = 'all' | 'assigned' | 'pending' | 'completed'

const { width: screenWidth } = Dimensions.get('window')

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
      case 'transfer_requested': return '🔄'
      default: return '📋'
    }
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

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getTaskCardStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: '#f8fff9',
          borderLeftColor: '#28a745',
          borderLeftWidth: 4,
        }
      case 'pending':
        return {
          backgroundColor: '#fffef8',
          borderLeftColor: '#ffc107',
          borderLeftWidth: 4,
        }
      case 'transfer_requested':
        return {
          backgroundColor: '#f8faff',
          borderLeftColor: '#667eea',
          borderLeftWidth: 4,
        }
      default:
        return {
          backgroundColor: '#fff',
          borderLeftColor: '#e9ecef',
          borderLeftWidth: 4,
        }
    }
  }

  const getTaskIconStyle = (status: string) => {
    switch (status) {
      case 'completed': return { backgroundColor: '#d4edda' }
      case 'pending': return { backgroundColor: '#fff3cd' }
      case 'transfer_requested': return { backgroundColor: '#e2e3ff' }
      default: return { backgroundColor: '#f8f9fa' }
    }
  }

  const getPriorityColor = (dueDate: string | null) => {
    if (!dueDate) return { backgroundColor: '#e9ecef' }

    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { backgroundColor: '#dc3545' } // Overdue - red
    if (diffDays <= 1) return { backgroundColor: '#fd7e14' } // Due soon - orange
    if (diffDays <= 3) return { backgroundColor: '#ffc107' } // Due this week - yellow
    return { backgroundColor: '#28a745' } // Future - green
  }

  // Duplicate isOverdue function removed

  const getEmptyStateIcon = (filter: FilterType) => {
    switch (filter) {
      case 'all': return '📋'
      case 'pending': return '⏳'
      case 'assigned': return '👤'
      case 'completed': return '✅'
      default: return '📋'
    }
  }

  const getEmptyStateTitle = (filter: FilterType) => {
    switch (filter) {
      case 'all': return 'No tasks yet'
      case 'pending': return 'No pending tasks'
      case 'assigned': return 'No assigned tasks'
      case 'completed': return 'No completed tasks'
      default: return 'No tasks found'
    }
  }

  const getEmptyStateMessage = (filter: FilterType) => {
    switch (filter) {
      case 'all': return 'Create your first task to get started with household management'
      case 'pending': return 'All caught up! No pending tasks at the moment'
      case 'assigned': return 'No tasks are currently assigned to you'
      case 'completed': return 'Complete some tasks to see them here'
      default: return 'Try adjusting your search or filter'
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
        .update({ status: 'completed' })
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
      {/* Enhanced Header with Gradient */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>📋 Tasks</Text>
                <Text style={styles.subtitle}>
                  {tasks.length} total • {tasks.filter(t => t.status === 'completed').length} completed
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` }
                    ]}
                  />
                </View>
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
          </View>
        </View>
      </View>

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced Filter Buttons */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilter,
              styles.filterButtonAll
            ]}
            onPress={() => setFilter('all')}
          >
            <View style={styles.filterButtonContent}>
              <Text style={styles.filterEmoji}>📋</Text>
              <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                All
              </Text>
              <Text style={[styles.filterCount, filter === 'all' && styles.activeFilterCount]}>
                {tasks.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'pending' && styles.activeFilter,
              styles.filterButtonPending
            ]}
            onPress={() => setFilter('pending')}
          >
            <View style={styles.filterButtonContent}>
              <Text style={styles.filterEmoji}>⏳</Text>
              <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
                Pending
              </Text>
              <Text style={[styles.filterCount, filter === 'pending' && styles.activeFilterCount]}>
                {tasks.filter(t => t.status === 'pending' || !t.status).length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'assigned' && styles.activeFilter,
              styles.filterButtonAssigned
            ]}
            onPress={() => setFilter('assigned')}
          >
            <View style={styles.filterButtonContent}>
              <Text style={styles.filterEmoji}>👤</Text>
              <Text style={[styles.filterText, filter === 'assigned' && styles.activeFilterText]}>
                Assigned
              </Text>
              <Text style={[styles.filterCount, filter === 'assigned' && styles.activeFilterCount]}>
                {tasks.filter(t => t.assignee_id === user?.id).length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'completed' && styles.activeFilter,
              styles.filterButtonCompleted
            ]}
            onPress={() => setFilter('completed')}
          >
            <View style={styles.filterButtonContent}>
              <Text style={styles.filterEmoji}>✅</Text>
              <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
                Completed
              </Text>
              <Text style={[styles.filterCount, filter === 'completed' && styles.activeFilterCount]}>
                {tasks.filter(t => t.status === 'completed').length}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Enhanced Quick Actions */}
      <View style={styles.quickActionsSection}>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionPrimary]}
            onPress={() => router.push('/(app)/tasks/create')}
          >
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionText}>Quick Add</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionSecondary]}
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
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionIcon}>✅</Text>
              <Text style={styles.quickActionText}>Complete All</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                getTaskCardStyle(task.status),
                {
                  marginBottom: index === filteredTasks.length - 1 ? 20 : 16,
                  transform: [{ scale: 1 }] // For potential animation
                }
              ]}
              onPress={() => handleTaskPress(task.id)}
              activeOpacity={0.7}
            >
              {/* Task Priority Indicator */}
              <View style={[styles.priorityIndicator, getPriorityColor(task.due_date)]} />

              <View style={styles.taskCardContent}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleRow}>
                    {task.emoji ? (
                      <Text style={styles.taskEmoji}>{task.emoji}</Text>
                    ) : (
                      <View style={[styles.defaultTaskIcon, getTaskIconStyle(task.status)]}>
                        <Text style={styles.defaultTaskIconText}>
                          {getStatusIcon(task.status)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(task.status)]}>
                      {task.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {task.description && (
                  <Text style={styles.taskDescription} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}

                <View style={styles.taskMeta}>
                  <View style={styles.taskInfo}>
                    {task.due_date && (
                      <View style={styles.dueDateContainer}>
                        <Text style={styles.dueDateIcon}>📅</Text>
                        <Text style={[
                          styles.dueDateText,
                          isOverdue(task.due_date) && styles.overdueDateText
                        ]}>
                          {formatDate(task.due_date)}
                          {isOverdue(task.due_date) && ' (Overdue)'}
                        </Text>
                      </View>
                    )}
                    {task.recurrence && (
                      <View style={styles.recurrenceContainer}>
                        <Text style={styles.recurrenceIcon}>🔄</Text>
                        <Text style={styles.recurrenceText}>
                          {task.recurrence}
                        </Text>
                      </View>
                    )}
                  </View>

                  {task.status === 'pending' && task.assignee_id === user?.id && (
                    <TouchableOpacity
                      style={styles.quickCompleteButton}
                      onPress={() => handleMarkComplete(task.id)}
                    >
                      <Text style={styles.quickCompleteText}>✓</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Progress indicator for recurring tasks */}
                {task.recurrence && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[
                        styles.progressBar,
                        { width: task.status === 'completed' ? '100%' : '30%' }
                      ]} />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateContent}>
              <Text style={styles.emptyStateIcon}>
                {getEmptyStateIcon(filter)}
              </Text>
              <Text style={styles.emptyStateTitle}>
                {getEmptyStateTitle(filter)}
              </Text>
              <Text style={styles.emptyStateText}>
                {getEmptyStateMessage(filter)}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={styles.createTaskButton}
                  onPress={() => router.push('/(app)/tasks/create')}
                >
                  <View style={styles.createTaskButtonContent}>
                    <Text style={styles.createTaskButtonIcon}>✨</Text>
                    <Text style={styles.createTaskButtonText}>Create Your First Task</Text>
                  </View>
                </TouchableOpacity>
              )}
              {filter !== 'all' && (
                <TouchableOpacity
                  style={styles.viewAllTasksButton}
                  onPress={() => setFilter('all')}
                >
                  <Text style={styles.viewAllTasksButtonText}>View All Tasks</Text>
                </TouchableOpacity>
              )}
            </View>
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
    backgroundColor: '#f8faff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  // Enhanced Header Styles
  headerContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    backgroundColor: '#667eea',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sortButtonText: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Enhanced Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 18,
    color: '#64748b',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 12,
    fontWeight: '500',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  // Enhanced Filter Styles
  filterSection: {
    marginBottom: 20,
  },
  filterScrollView: {
    paddingVertical: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 90,
  },
  filterButtonContent: {
    alignItems: 'center',
    gap: 4,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  filterCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'center',
  },
  activeFilter: {
    borderColor: '#667eea',
    backgroundColor: '#f1f5f9',
    transform: [{ scale: 1.05 }],
  },
  activeFilterText: {
    color: '#667eea',
  },
  activeFilterCount: {
    color: '#667eea',
  },
  filterButtonAll: {
    borderColor: '#64748b',
  },
  filterButtonPending: {
    borderColor: '#f59e0b',
  },
  filterButtonAssigned: {
    borderColor: '#8b5cf6',
  },
  filterButtonCompleted: {
    borderColor: '#10b981',
  },
  // Enhanced Quick Actions Styles
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionPrimary: {
    backgroundColor: '#667eea',
  },
  quickActionSecondary: {
    backgroundColor: '#10b981',
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionIcon: {
    fontSize: 18,
    color: '#fff',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  // Enhanced Task List Styles
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Enhanced Task Card Styles
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  taskCardContent: {
    padding: 20,
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
    marginRight: 12,
  },
  taskEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  defaultTaskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaultTaskIconText: {
    fontSize: 16,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  taskDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  taskInfo: {
    flex: 1,
    gap: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateIcon: {
    fontSize: 14,
  },
  dueDateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  overdueDateText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  recurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recurrenceIcon: {
    fontSize: 14,
  },
  recurrenceText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  quickCompleteButton: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCompleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  // Enhanced Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  createTaskButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createTaskButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createTaskButtonIcon: {
    fontSize: 18,
    color: '#fff',
  },
  createTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewAllTasksButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  viewAllTasksButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
})
