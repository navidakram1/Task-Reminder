import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { APP_THEME } from '../../../constants/AppTheme'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface PendingTask {
  id: string
  title: string
  description: string
  emoji: string
  completed_at: string
  assignee_name: string
  assignee_email: string
  assignee_photo: string
  creator_name: string
  household_name: string
}

export default function ApprovalsScreen() {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({})
  const { user } = useAuth()

  useEffect(() => {
    fetchPendingTasks()
  }, [])

  const fetchPendingTasks = async () => {
    try {
      setRefreshing(true)

      // Get user's households
      const { data: households } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user?.id)

      if (!households || households.length === 0) {
        setPendingTasks([])
        return
      }

      const householdIds = households.map(h => h.household_id)

      // Fetch tasks pending review from user's households
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, description, emoji, completed_at, household_id, assignee_id, created_by')
        .in('household_id', householdIds)
        .eq('status', 'pending_review')
        .order('completed_at', { ascending: false })

      if (error) throw error

      // Fetch user details separately to avoid foreign key issues
      const userIds = new Set<string>()
      tasks?.forEach((t: any) => {
        if (t.assignee_id) userIds.add(t.assignee_id)
        if (t.created_by) userIds.add(t.created_by)
      })

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url')
        .in('id', Array.from(userIds))

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Fetch household names
      const { data: households } = await supabase
        .from('households')
        .select('id, name')
        .in('id', householdIds)

      const householdMap = new Map(households?.map(h => [h.id, h]) || [])

      const formattedTasks = (tasks || []).map((t: any) => {
        const assignee = profileMap.get(t.assignee_id)
        const creator = profileMap.get(t.created_by)
        const household = householdMap.get(t.household_id)

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          emoji: t.emoji,
          completed_at: t.completed_at,
          assignee_name: assignee?.name,
          assignee_email: assignee?.email,
          assignee_photo: assignee?.photo_url,
          creator_name: creator?.name,
          household_name: household?.name
        }
      })

      setPendingTasks(formattedTasks)
    } catch (error) {
      console.error('Error fetching pending tasks:', error)
      Alert.alert('Error', 'Failed to load pending reviews')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleApprove = async (taskId: string) => {
    Alert.alert(
      'Approve Task',
      'Are you sure you want to approve this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const notes = reviewNotes[taskId] || null

              const { data, error } = await supabase.rpc('approve_task_review', {
                p_task_id: taskId,
                p_reviewer_id: user?.id,
                p_review_notes: notes
              })

              if (error) throw error

              Alert.alert('Success', 'Task approved and marked as completed!')
              setReviewNotes(prev => {
                const newNotes = { ...prev }
                delete newNotes[taskId]
                return newNotes
              })
              await fetchPendingTasks()
            } catch (error) {
              console.error('Error approving task:', error)
              Alert.alert('Error', 'Failed to approve task')
            }
          }
        }
      ]
    )
  }

  const handleRequestChanges = async (taskId: string) => {
    const notes = reviewNotes[taskId]

    if (!notes || !notes.trim()) {
      Alert.alert('Review Notes Required', 'Please add notes explaining what changes are needed.')
      return
    }

    Alert.alert(
      'Request Changes',
      'This will move the task back to in progress with your review notes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Changes',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('request_task_changes', {
                p_task_id: taskId,
                p_reviewer_id: user?.id,
                p_review_notes: notes.trim()
              })

              if (error) throw error

              Alert.alert('Success', 'Changes requested. Task moved back to in progress.')
              setReviewNotes(prev => {
                const newNotes = { ...prev }
                delete newNotes[taskId]
                return newNotes
              })
              await fetchPendingTasks()
            } catch (error) {
              console.error('Error requesting changes:', error)
              Alert.alert('Error', 'Failed to request changes')
            }
          }
        }
      ]
    )
  }


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading pending reviews...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Task Reviews</Text>
          <Text style={styles.headerSubtitle}>
            {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} pending review
          </Text>
        </View>
        <TouchableOpacity onPress={fetchPendingTasks}>
          <Ionicons name="refresh" size={24} color={APP_THEME.colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPendingTasks} />
        }
      >
        {pendingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={80} color={APP_THEME.colors.textSecondary} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              No tasks are currently pending review.
            </Text>
          </View>
        ) : (
          pendingTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              {/* Task Header */}
              <TouchableOpacity
                style={styles.taskHeader}
                onPress={() => router.push(`/(app)/tasks/${task.id}`)}
              >
                {task.emoji && <Text style={styles.taskEmoji}>{task.emoji}</Text>}
                <View style={styles.taskHeaderText}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMetaRow}>
                    {task.assignee_photo ? (
                      <Image source={{ uri: task.assignee_photo }} style={styles.assigneeAvatar} />
                    ) : (
                      <View style={[styles.assigneeAvatar, styles.assigneeAvatarPlaceholder]}>
                        <Text style={styles.assigneeAvatarText}>
                          {(task.assignee_name || task.assignee_email || 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.taskMeta}>
                      {task.assignee_name || task.assignee_email || 'Unknown'} • {formatDateTime(task.completed_at)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={APP_THEME.colors.textSecondary} />
              </TouchableOpacity>

              {/* Task Description */}
              {task.description && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.description}
                </Text>
              )}

              {/* Review Notes Input */}
              <TextInput
                style={styles.notesInput}
                placeholder="Add review notes (optional for approval, required for changes)..."
                placeholderTextColor={APP_THEME.colors.textSecondary}
                value={reviewNotes[task.id] || ''}
                onChangeText={(text) => setReviewNotes(prev => ({ ...prev, [task.id]: text }))}
                multiline
                maxLength={500}
              />

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(task.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color={APP_THEME.colors.surface} />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.changesButton]}
                  onPress={() => handleRequestChanges(task.id)}
                >
                  <Ionicons name="return-down-back" size={20} color={APP_THEME.colors.surface} />
                  <Text style={styles.actionButtonText}>Request Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: APP_THEME.colors.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: APP_THEME.colors.surface,
  },
  headerSubtitle: {
    fontSize: 14,
    color: APP_THEME.colors.surface,
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  taskCard: {
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  taskHeaderText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: APP_THEME.colors.text,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: APP_THEME.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: APP_THEME.colors.text,
    marginBottom: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: APP_THEME.colors.success,
  },
  changesButton: {
    backgroundColor: APP_THEME.colors.warning,
  },
  actionButtonText: {
    color: APP_THEME.colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  assigneeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  assigneeAvatarPlaceholder: {
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarText: {
    color: APP_THEME.colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
})
