import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
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
import ReviewCountdown from '../../../components/tasks/ReviewCountdown'
import { APP_THEME } from '../../../constants/AppTheme'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { triggerAutoApproval } from '../../../utils/autoApprovalHelper'

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
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'me'>('all')
  const [historySortBy, setHistorySortBy] = useState<'date' | 'title'>('date')
  const { user } = useAuth()

  // Calculate user score from actual completed tasks (persistent)
  const userScore = tasks.filter(t =>
    t.assignee_id === user?.id && t.status === 'completed'
  ).length * 10

  useEffect(() => {
    // Trigger auto-approval on mount, then fetch tasks
    const initializeTasks = async () => {
      await triggerAutoApproval()
      await fetchTasks()
      await fetchPendingReviewCount()
    }
    initializeTasks()
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

      // Fetch tasks - simplified query to avoid PostgREST cache issues
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch assignee profiles separately to avoid cache issues
      const tasksWithProfiles = await Promise.all(
        (tasksData || []).map(async (task) => {
          let assignee = null
          let creator = null

          if (task.assignee_id) {
            const { data: assigneeData } = await supabase
              .from('profiles')
              .select('id, display_name, username, avatar_url')
              .eq('id', task.assignee_id)
              .single()
            assignee = assigneeData
          }

          if (task.created_by) {
            const { data: creatorData } = await supabase
              .from('profiles')
              .select('id, display_name, username')
              .eq('id', task.created_by)
              .single()
            creator = creatorData
          }

          return {
            ...task,
            assignee,
            creator
          }
        })
      )

      console.log('Fetched tasks:', tasksWithProfiles?.length || 0)
      console.log('Sample task:', tasksWithProfiles?.[0])
      setTasks(tasksWithProfiles || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch count of tasks pending review for badge display
  const fetchPendingReviewCount = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      // Count tasks with pending_review status
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdMember.household_id)
        .eq('status', 'pending_review')

      if (error) throw error
      setPendingReviewCount(count || 0)
    } catch (error) {
      console.error('Error fetching pending review count:', error)
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
    // Trigger auto-approval of expired reviews first
    await triggerAutoApproval()
    // Then fetch updated tasks
    await Promise.all([fetchTasks(), fetchPendingReviewCount()])
    setRefreshing(false)
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
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    Alert.alert(
      'Complete Task',
      'Would you like to add a completion proof photo?',
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: () => confirmMarkComplete(taskId, null)
        },
        {
          text: 'Add Photo',
          onPress: () => pickImageForTask(taskId)
        }
      ]
    )
  }

  const pickImageForTask = async (taskId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await confirmMarkComplete(taskId, result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const confirmMarkComplete = async (taskId: string, photoUri: string | null) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      let proofUrl = null

      // Upload photo if provided
      if (photoUri) {
        const fileExt = photoUri.split('.').pop()
        const fileName = `${taskId}-${Date.now()}.${fileExt}`
        const filePath = `completion-proofs/${fileName}`

        const response = await fetch(photoUri)
        const blob = await response.blob()

        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`,
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(filePath)

        proofUrl = publicUrl
      }

      // Mark task as complete
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completion_proof_url: proofUrl,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Show celebration
      setCelebrationTask(task)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)

      // Refresh tasks to update score (calculated from completed tasks)
      await fetchTasks()
    } catch (error) {
      console.error('Error marking task complete:', error)
      Alert.alert('Error', 'Failed to complete task. Please try again.')
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

        {/* Action Buttons beside History tab */}
        <TouchableOpacity
          style={styles.tabActionButton}
          onPress={() => router.push('/(app)/tasks/random-assignment')}
          activeOpacity={0.8}
        >
          <Text style={styles.tabActionIcon}>🎲</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabActionButton}
          onPress={() => router.push('/(app)/approvals')}
          activeOpacity={0.8}
        >
          <View style={{ position: 'relative' }}>
            <Text style={styles.tabActionIcon}>⭐</Text>
            {pendingReviewCount > 0 && (
              <View style={styles.tabActionBadge}>
                <Text style={styles.tabActionBadgeText}>{pendingReviewCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Modern Search & Filter Bar - Only show on "All Tasks" tab */}
      {activeTab === 'all' && (
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
      )}

      {/* Modern Filter Chips - Only show on "All Tasks" tab */}
      {activeTab === 'all' && (
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
      )}

      <ScrollView
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'all' && filteredTasks.length > 0 && (
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

                    {/* Auto-Approval Countdown for Pending Review */}
                    {task.status === 'pending_review' && task.pending_review_since && (
                      <View style={styles.countdownContainer}>
                        <ReviewCountdown
                          pendingReviewSince={task.pending_review_since}
                          compact={false}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Quick Complete Button */}
              {(task.status === 'pending' || task.status === 'in_progress') && task.assignee_id === user?.id && (
                <TouchableOpacity
                  style={styles.quickCompleteButton}
                  onPress={() => handleMarkComplete(task.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={28} color={APP_THEME.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {activeTab === 'stats' && (
          <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
            {(() => {
              const stats = calculateUserStats()
              const completionPercentage = stats.assignedToMe > 0
                ? (stats.completedByMe / stats.assignedToMe) * 100
                : 0

              return (
                <>
                  {/* Score Hero Card */}
                  <View style={styles.scoreHeroCard}>
                    <View style={styles.scoreHeroContent}>
                      <Text style={styles.scoreHeroLabel}>Your Total Score</Text>
                      <Text style={styles.scoreHeroValue}>{userScore}</Text>
                      <Text style={styles.scoreHeroSubtitle}>
                        🎉 {stats.completedByMe} tasks completed
                      </Text>
                    </View>
                    <View style={styles.scoreHeroBadge}>
                      <Text style={styles.scoreHeroBadgeText}>⭐</Text>
                    </View>
                  </View>

                  {/* Progress Ring */}
                  <View style={styles.progressCard}>
                    <Text style={styles.progressCardTitle}>Completion Progress</Text>
                    <View style={styles.progressRingContainer}>
                      <View style={styles.progressRing}>
                        <Text style={styles.progressPercentage}>{Math.round(completionPercentage)}%</Text>
                        <Text style={styles.progressLabel}>Complete</Text>
                      </View>
                    </View>
                    <View style={styles.progressStats}>
                      <View style={styles.progressStatItem}>
                        <Text style={styles.progressStatValue}>{stats.completedByMe}</Text>
                        <Text style={styles.progressStatLabel}>Done</Text>
                      </View>
                      <View style={styles.progressStatDivider} />
                      <View style={styles.progressStatItem}>
                        <Text style={styles.progressStatValue}>{stats.assignedToMe - stats.completedByMe}</Text>
                        <Text style={styles.progressStatLabel}>Remaining</Text>
                      </View>
                      <View style={styles.progressStatDivider} />
                      <View style={styles.progressStatItem}>
                        <Text style={styles.progressStatValue}>{stats.assignedToMe}</Text>
                        <Text style={styles.progressStatLabel}>Total</Text>
                      </View>
                    </View>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={[styles.modernStatCard, { backgroundColor: '#FF6B6B15' }]}>
                      <View style={[styles.statIconCircle, { backgroundColor: '#FF6B6B' }]}>
                        <Text style={styles.statIconText}>✅</Text>
                      </View>
                      <Text style={[styles.modernStatValue, { color: '#FF6B6B' }]}>{stats.completed}</Text>
                      <Text style={styles.modernStatLabel}>Completed</Text>
                      <View style={[styles.statProgressBar, { backgroundColor: '#FF6B6B20' }]}>
                        <View style={[styles.statProgressFill, {
                          width: `${tasks.length > 0 ? (stats.completed / tasks.length) * 100 : 0}%`,
                          backgroundColor: '#FF6B6B'
                        }]} />
                      </View>
                    </View>

                    <View style={[styles.modernStatCard, { backgroundColor: '#4ECDC415' }]}>
                      <View style={[styles.statIconCircle, { backgroundColor: '#4ECDC4' }]}>
                        <Text style={styles.statIconText}>⏳</Text>
                      </View>
                      <Text style={[styles.modernStatValue, { color: '#4ECDC4' }]}>{stats.pending}</Text>
                      <Text style={styles.modernStatLabel}>Pending</Text>
                      <View style={[styles.statProgressBar, { backgroundColor: '#4ECDC420' }]}>
                        <View style={[styles.statProgressFill, {
                          width: `${tasks.length > 0 ? (stats.pending / tasks.length) * 100 : 0}%`,
                          backgroundColor: '#4ECDC4'
                        }]} />
                      </View>
                    </View>

                    <View style={[styles.modernStatCard, { backgroundColor: '#667eea15' }]}>
                      <View style={[styles.statIconCircle, { backgroundColor: '#667eea' }]}>
                        <Text style={styles.statIconText}>👤</Text>
                      </View>
                      <Text style={[styles.modernStatValue, { color: '#667eea' }]}>{stats.assignedToMe}</Text>
                      <Text style={styles.modernStatLabel}>My Tasks</Text>
                      <View style={[styles.statProgressBar, { backgroundColor: '#667eea20' }]}>
                        <View style={[styles.statProgressFill, {
                          width: `${tasks.length > 0 ? (stats.assignedToMe / tasks.length) * 100 : 0}%`,
                          backgroundColor: '#667eea'
                        }]} />
                      </View>
                    </View>

                    <View style={[styles.modernStatCard, { backgroundColor: '#f093fb15' }]}>
                      <View style={[styles.statIconCircle, { backgroundColor: '#f093fb' }]}>
                        <Text style={styles.statIconText}>🎯</Text>
                      </View>
                      <Text style={[styles.modernStatValue, { color: '#f093fb' }]}>{stats.completionRate}%</Text>
                      <Text style={styles.modernStatLabel}>Success Rate</Text>
                      <View style={[styles.statProgressBar, { backgroundColor: '#f093fb20' }]}>
                        <View style={[styles.statProgressFill, {
                          width: `${stats.completionRate}%`,
                          backgroundColor: '#f093fb'
                        }]} />
                      </View>
                    </View>
                  </View>

                  {/* Achievement Badges */}
                  <View style={styles.achievementsCard}>
                    <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
                    <View style={styles.achievementsList}>
                      {stats.completedByMe >= 1 && (
                        <View style={styles.achievementBadge}>
                          <Text style={styles.achievementIcon}>🌟</Text>
                          <Text style={styles.achievementName}>First Task</Text>
                        </View>
                      )}
                      {stats.completedByMe >= 5 && (
                        <View style={styles.achievementBadge}>
                          <Text style={styles.achievementIcon}>🔥</Text>
                          <Text style={styles.achievementName}>On Fire</Text>
                        </View>
                      )}
                      {stats.completedByMe >= 10 && (
                        <View style={styles.achievementBadge}>
                          <Text style={styles.achievementIcon}>💪</Text>
                          <Text style={styles.achievementName}>Power User</Text>
                        </View>
                      )}
                      {stats.completionRate === 100 && stats.assignedToMe > 0 && (
                        <View style={styles.achievementBadge}>
                          <Text style={styles.achievementIcon}>👑</Text>
                          <Text style={styles.achievementName}>Perfect</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )
            })()}
          </ScrollView>
        )}

        {activeTab === 'history' && (
          <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
            {/* Modern Filter Chips */}
            <View style={styles.modernFilters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsScroll}>
                <TouchableOpacity
                  style={[styles.historyFilterChip, historyFilter === 'all' && styles.historyFilterChipActive]}
                  onPress={() => setHistoryFilter('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.historyFilterChipText, historyFilter === 'all' && styles.historyFilterChipTextActive]}>
                    🌐 All Tasks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.historyFilterChip, historyFilter === 'me' && styles.historyFilterChipActive]}
                  onPress={() => setHistoryFilter('me')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.historyFilterChipText, historyFilter === 'me' && styles.historyFilterChipTextActive]}>
                    👤 My Tasks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.historyFilterChip, historySortBy === 'date' && styles.historyFilterChipActive]}
                  onPress={() => setHistorySortBy('date')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.historyFilterChipText, historySortBy === 'date' && styles.historyFilterChipTextActive]}>
                    📅 By Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.historyFilterChip, historySortBy === 'title' && styles.historyFilterChipActive]}
                  onPress={() => setHistorySortBy('title')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.historyFilterChipText, historySortBy === 'title' && styles.historyFilterChipTextActive]}>
                    🔤 By Title
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {(() => {
              // Filter completed tasks
              let completedTasks = tasks.filter(t => t.status === 'completed')

              // Apply history filter
              if (historyFilter === 'me') {
                completedTasks = completedTasks.filter(t => t.assignee_id === user?.id)
              }

              // Apply sorting
              if (historySortBy === 'date') {
                completedTasks.sort((a, b) => {
                  const dateA = new Date(a.completed_at || a.updated_at || a.created_at).getTime()
                  const dateB = new Date(b.completed_at || b.updated_at || b.created_at).getTime()
                  return dateB - dateA
                })
              } else {
                completedTasks.sort((a, b) => a.title.localeCompare(b.title))
              }

              // Group by date sections
              const groupTasksByDate = (tasks: any[]) => {
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)

                const groups: { [key: string]: any[] } = {
                  'Today': [],
                  'Yesterday': [],
                  'This Week': [],
                  'Earlier': []
                }

                tasks.forEach(task => {
                  const taskDate = new Date(task.completed_at || task.updated_at || task.created_at)
                  const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())

                  if (taskDay.getTime() === today.getTime()) {
                    groups['Today'].push(task)
                  } else if (taskDay.getTime() === yesterday.getTime()) {
                    groups['Yesterday'].push(task)
                  } else if (taskDay.getTime() >= weekAgo.getTime()) {
                    groups['This Week'].push(task)
                  } else {
                    groups['Earlier'].push(task)
                  }
                })

                return groups
              }

              const groupedTasks = historySortBy === 'date' ? groupTasksByDate(completedTasks) : null

              return (
                <View style={styles.timelineContainer}>
                  {historySortBy === 'date' && groupedTasks ? (
                    // Timeline view grouped by date
                    Object.entries(groupedTasks).map(([section, sectionTasks]) =>
                      sectionTasks.length > 0 ? (
                        <View key={section} style={styles.timelineSection}>
                          <View style={styles.timelineSectionHeader}>
                            <View style={styles.timelineDot} />
                            <Text style={styles.timelineSectionTitle}>{section}</Text>
                            <View style={styles.timelineLine} />
                          </View>
                          {sectionTasks.map((task, index) => (
                            <TouchableOpacity
                              key={task.id}
                              style={styles.timelineCard}
                              onPress={() => handleTaskPress(task.id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.timelineCardLeft}>
                                <View style={styles.timelineMarker} />
                                {index < sectionTasks.length - 1 && <View style={styles.timelineConnector} />}
                              </View>
                              <View style={styles.timelineCardContent}>
                                <View style={styles.timelineCardHeader}>
                                  <View style={styles.timelineCardIconBadge}>
                                    <Text style={styles.timelineCardEmoji}>{task.emoji || '✅'}</Text>
                                  </View>
                                  <View style={styles.timelineCardInfo}>
                                    <Text style={styles.timelineCardTitle}>{task.title}</Text>
                                    <View style={styles.timelineCardMeta}>
                                      <Text style={styles.timelineCardTime}>
                                        🕐 {new Date(task.completed_at || task.updated_at || task.created_at).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </Text>
                                      {task.assignee && (
                                        <View style={styles.timelineCardAssignee}>
                                          <Text style={styles.timelineCardAssigneeText}>
                                            {task.assignee.display_name || task.assignee.username || 'Unknown'}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                  <View style={styles.timelineCardPoints}>
                                    <Text style={styles.timelineCardPointsValue}>+10</Text>
                                    <Text style={styles.timelineCardPointsLabel}>pts</Text>
                                  </View>
                                </View>
                                {task.description && (
                                  <Text style={styles.timelineCardDescription} numberOfLines={2}>
                                    {task.description}
                                  </Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null
                    )
                  ) : (
                    // List view (sorted by title)
                    completedTasks.map((task, index) => (
                      <TouchableOpacity
                        key={task.id}
                        style={styles.modernHistoryCard}
                        onPress={() => handleTaskPress(task.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modernHistoryCardIcon}>
                          <Text style={styles.modernHistoryCardEmoji}>{task.emoji || '✅'}</Text>
                        </View>
                        <View style={styles.modernHistoryCardContent}>
                          <Text style={styles.modernHistoryCardTitle}>{task.title}</Text>
                          <View style={styles.modernHistoryCardMeta}>
                            <Text style={styles.modernHistoryCardDate}>
                              {new Date(task.completed_at || task.updated_at || task.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                            {task.assignee && (
                              <Text style={styles.modernHistoryCardAssignee}>
                                • {task.assignee.display_name || task.assignee.username}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.modernHistoryCardBadge}>
                          <Text style={styles.modernHistoryCardBadgeText}>+10</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )
            })()}
          </ScrollView>
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
    gap: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.15)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 10,
    minWidth: 90,
    justifyContent: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  filterIcon: {
    fontSize: 18,
  },
  filterLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeFilterLabel: {
    color: '#fff',
    fontWeight: '800',
  },
  filterBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '800',
  },
  activeFilterBadgeText: {
    color: '#fff',
    fontWeight: '900',
  },
  // Quick Actions Styles
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: 12,
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
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
    borderWidth: 2,
    borderColor: APP_THEME.colors.primary,
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
    alignItems: 'center',
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
  // Tab Action Button Styles
  tabActionButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActionIcon: {
    fontSize: 20,
  },
  tabActionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  tabActionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scoreHeroCard: {
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreHeroContent: {
    flex: 1,
  },
  scoreHeroLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scoreHeroValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -2,
  },
  scoreHeroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  scoreHeroBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHeroBadgeText: {
    fontSize: 36,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4ECDC4',
    letterSpacing: -1,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  modernStatCard: {
    width: '48%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 24,
  },
  modernStatValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -1,
  },
  modernStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 12,
  },
  statProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  achievementLocked: {
    borderColor: '#e2e8f0',
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 20,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  // History Styles
  historyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modernFilters: {
    paddingVertical: 16,
    paddingLeft: 20,
  },
  filterChipsScroll: {
    flexGrow: 0,
  },
  historyFilterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.15)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  historyFilterChipActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  historyFilterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  historyFilterChipTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginRight: 12,
  },
  timelineSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginRight: 12,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  timelineCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineCardLeft: {
    width: 40,
    alignItems: 'center',
    paddingTop: 8,
  },
  timelineMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  timelineCardContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineCardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineCardEmoji: {
    fontSize: 24,
  },
  timelineCardInfo: {
    flex: 1,
  },
  timelineCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 20,
  },
  timelineCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineCardTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  timelineCardAssignee: {
    backgroundColor: '#667eea15',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  timelineCardAssigneeText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
  },
  timelineCardPoints: {
    backgroundColor: '#FF6B6B15',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  timelineCardPointsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B6B',
    lineHeight: 18,
  },
  timelineCardPointsLabel: {
    fontSize: 9,
    color: '#FF6B6B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timelineCardDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 4,
  },
  modernHistoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernHistoryCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modernHistoryCardEmoji: {
    fontSize: 26,
  },
  modernHistoryCardContent: {
    flex: 1,
  },
  modernHistoryCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  modernHistoryCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernHistoryCardDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  modernHistoryCardAssignee: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  modernHistoryCardBadge: {
    backgroundColor: '#4ECDC415',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modernHistoryCardBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4ECDC4',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyHistoryIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyHistoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyHistoryText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Review Badge Styles
  reviewBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  reviewBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Countdown Container Styles
  countdownContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
})
