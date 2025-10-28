import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Dimensions,
    Modal,
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
type TabType = 'all' | 'stats' | 'history'

const { width: screenWidth } = Dimensions.get('window')

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationTask, setCelebrationTask] = useState<any>(null)
  const [userScore, setUserScore] = useState(0)
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
      const task = tasks.find(t => t.id === taskId)
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (error) throw error

      // Show celebration
      setCelebrationTask(task)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)

      // Update score
      setUserScore(prev => prev + 10)

      await fetchTasks()
    } catch (error) {
      console.error('Error marking task complete:', error)
    }
  }

  const groupTasksByTime = (taskList: any[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const groups = {
      dueToday: [] as any[],
      whenNeeded: [] as any[],
      upcomingWeek: [] as any[],
      overdue: [] as any[]
    }

    taskList.forEach(task => {
      if (task.status === 'completed') return

      if (!task.due_date) {
        groups.whenNeeded.push(task)
      } else {
        const dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < today) {
          groups.overdue.push(task)
        } else if (dueDate.getTime() === today.getTime()) {
          groups.dueToday.push(task)
        } else if (dueDate < weekEnd) {
          groups.upcomingWeek.push(task)
        }
      }
    })

    return groups
  }

  const calculateUserStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const pending = tasks.filter(t => t.status === 'pending' || !t.status).length
    const assignedToMe = tasks.filter(t => t.assignee_id === user?.id).length
    const completedByMe = tasks.filter(t => t.assignee_id === user?.id && t.status === 'completed').length

    return {
      completed,
      pending,
      assignedToMe,
      completedByMe,
      completionRate: assignedToMe > 0 ? Math.round((completedByMe / assignedToMe) * 100) : 0
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
      {/* Modern Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>✅ My Tasks</Text>
              <Text style={styles.subtitle}>
                {filteredTasks.length} of {tasks.length} tasks • {Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100)}% complete
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(app)/tasks/create')}
            >
              <Text style={styles.addButtonIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Search & Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#94a3b8"
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

      {/* Modern Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {[
            { key: 'all', label: 'All', icon: '📋', count: tasks.length },
            { key: 'pending', label: 'To Do', icon: '⏳', count: tasks.filter(t => t.status === 'pending' || !t.status).length },
            { key: 'assigned', label: 'Mine', icon: '👤', count: tasks.filter(t => t.assignee_id === user?.id).length },
            { key: 'completed', label: 'Done', icon: '✅', count: tasks.filter(t => t.status === 'completed').length }
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[
                styles.filterChip,
                filter === filterOption.key && styles.activeFilterChip
              ]}
              onPress={() => setFilter(filterOption.key as FilterType)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterIcon}>{filterOption.icon}</Text>
              <Text style={[
                styles.filterLabel,
                filter === filterOption.key && styles.activeFilterLabel
              ]}>
                {filterOption.label}
              </Text>
              <View style={[
                styles.filterBadge,
                filter === filterOption.key && styles.activeFilterBadge
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  filter === filterOption.key && styles.activeFilterBadgeText
                ]}>
                  {filterOption.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      {filteredTasks.length > 0 && (
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(app)/tasks/random-assignment')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>🎲</Text>
              <Text style={styles.quickActionText}>Shuffle Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(app)/approvals')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={styles.quickActionText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                const pendingTasks = filteredTasks.filter(t => t.status !== 'completed')
                if (pendingTasks.length === 0) {
                  Alert.alert('Info', 'All visible tasks are already completed!')
                  return
                }
                Alert.alert(
                  'Complete All',
                  `Mark ${pendingTasks.length} pending tasks as completed?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Complete', onPress: () => markAllComplete() }
                  ]
                )
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>✅</Text>
              <Text style={styles.quickActionText}>Complete All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'all' && filteredTasks.length > 0 ? (
          filteredTasks.map((task, index) => (
            <View
              key={task.id}
              style={[
                styles.taskCard,
                { marginBottom: index === filteredTasks.length - 1 ? 20 : 16 }
              ]}
            >
              {/* Priority Indicator */}
              <View style={[styles.priorityIndicator, getPriorityColor(task.due_date)]} />

              <TouchableOpacity
                style={styles.taskCardContent}
                onPress={() => handleTaskPress(task.id)}
                activeOpacity={0.8}
              >
                <View style={styles.taskHeader}>
                  <View style={styles.taskIconContainer}>
                    {task.emoji ? (
                      <Text style={styles.taskEmoji}>{task.emoji}</Text>
                    ) : (
                      <View style={[styles.defaultTaskIcon, getTaskIconStyle(task.status)]}>
                        <Text style={styles.defaultTaskIconText}>
                          {getStatusIcon(task.status)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.taskContent}>
                    <View style={styles.taskTitleRow}>
                      <Text style={styles.taskTitle} numberOfLines={2}>
                        {task.title}
                      </Text>
                      <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
                        <Text style={[styles.statusText, getStatusTextStyle(task.status)]}>
                          {task.status === 'pending' ? 'To Do' : task.status.replace('_', ' ')}
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
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Quick Complete Button */}
              {task.status === 'pending' && task.assignee_id === user?.id && (
                <TouchableOpacity
                  style={styles.quickCompleteButton}
                  onPress={() => handleMarkComplete(task.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickCompleteIcon}>✓</Text>
                </TouchableOpacity>
              )}
            </View>
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

        {activeTab === 'stats' && (
          <View style={styles.statsContainer}>
            {(() => {
              const stats = calculateUserStats()
              return (
                <>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>✅</Text>
                      <Text style={styles.statValue}>{stats.completed}</Text>
                      <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>⏳</Text>
                      <Text style={styles.statValue}>{stats.pending}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>👤</Text>
                      <Text style={styles.statValue}>{stats.assignedToMe}</Text>
                      <Text style={styles.statLabel}>Assigned to Me</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>🎯</Text>
                      <Text style={styles.statValue}>{stats.completionRate}%</Text>
                      <Text style={styles.statLabel}>Completion Rate</Text>
                    </View>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreCardTitle}>Your Score</Text>
                    <Text style={styles.scoreCardValue}>{userScore}</Text>
                    <Text style={styles.scoreCardSubtitle}>Keep completing tasks to earn more points!</Text>
                  </View>
                </>
              )
            })()}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.historyContainer}>
            {tasks.filter(t => t.status === 'completed').length > 0 ? (
              tasks
                .filter(t => t.status === 'completed')
                .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
                .map((task, index) => (
                  <View key={task.id} style={[styles.historyCard, { marginBottom: index === tasks.filter(t => t.status === 'completed').length - 1 ? 20 : 12 }]}>
                    <View style={styles.historyCardContent}>
                      <Text style={styles.historyCardIcon}>✅</Text>
                      <View style={styles.historyCardText}>
                        <Text style={styles.historyCardTitle}>{task.title}</Text>
                        <Text style={styles.historyCardDate}>
                          Completed on {new Date(task.updated_at || task.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
            ) : (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryIcon}>📋</Text>
                <Text style={styles.emptyHistoryTitle}>No completed tasks yet</Text>
                <Text style={styles.emptyHistoryText}>Complete some tasks to see them here</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Task Done!</Text>
            <Text style={styles.celebrationSubtitle}>
              You earned +10 points
            </Text>
            <Text style={styles.celebrationMessage}>
              Great job. You finished {celebrationTask?.title}!
            </Text>
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>{userScore}</Text>
            </View>
          </View>
        </View>
      </Modal>

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
  // Modern Header Styles
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  // Modern Search Styles
  searchFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  // Modern Filter Styles
  filterSection: {
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  activeFilterLabel: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  activeFilterBadgeText: {
    color: '#fff',
  },
  // Quick Actions Styles
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  quickActionIcon: {
    fontSize: 16,
    color: '#667eea',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  // Enhanced Task List Styles
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Modern Task Card Styles
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 1,
  },
  taskCardContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  taskEmoji: {
    fontSize: 24,
  },
  defaultTaskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultTaskIconText: {
    fontSize: 16,
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateIcon: {
    fontSize: 12,
  },
  dueDateText: {
    fontSize: 12,
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
    gap: 4,
  },
  recurrenceIcon: {
    fontSize: 12,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  quickCompleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  quickCompleteIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#667eea',
  },
  // Celebration Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '80%',
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '500',
  },
  celebrationMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  scoreDisplay: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#667eea',
  },
  // Stats Styles
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreCardTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreCardValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  scoreCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  // History Styles
  historyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyCardText: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyHistoryIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyHistoryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
})
