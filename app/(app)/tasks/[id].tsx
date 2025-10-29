import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
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

interface Comment {
  id: string
  task_id: string
  user_id: string
  comment: string
  is_anonymous?: boolean
  created_at: string
  user_name?: string
  user_email?: string
  user_photo?: string
}

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams()
  const { user } = useAuth()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [completionProofUri, setCompletionProofUri] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (id) {
      fetchTaskDetails()
      fetchComments()
    }
  }, [id])

  const fetchTaskDetails = async () => {
    try {
      const isRefresh = refreshing
      if (!isRefresh) setLoading(true)

      // Fetch task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (taskError) throw taskError

      // Fetch assignee profile
      let assigneeProfile = null
      if (taskData.assignee_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, email, photo_url')
          .eq('id', taskData.assignee_id)
          .single()
        assigneeProfile = data
      }

      // Fetch creator profile
      let creatorProfile = null
      if (taskData.created_by) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, email, photo_url')
          .eq('id', taskData.created_by)
          .single()
        creatorProfile = data
      }

      // Fetch reviewer profile if reviewed
      let reviewerProfile = null
      if (taskData.reviewed_by) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, email, photo_url')
          .eq('id', taskData.reviewed_by)
          .single()
        reviewerProfile = data
      }

      setTask({
        ...taskData,
        assignee: assigneeProfile,
        creator: creatorProfile,
        reviewer: reviewerProfile
      })
    } catch (error) {
      console.error('Error fetching task:', error)
      Alert.alert('Error', 'Failed to load task details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          id,
          task_id,
          user_id,
          comment,
          is_anonymous,
          created_at
        `)
        .eq('task_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch user profiles for comments
      const userIds = [...new Set(data?.map(c => c.user_id) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      const commentsWithUsers = (data || []).map(comment => {
        const profile = profileMap.get(comment.user_id)
        return {
          ...comment,
          user_name: profile?.name,
          user_email: profile?.email,
          user_photo: profile?.photo_url
        }
      })

      setComments(commentsWithUsers)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchTaskDetails(), fetchComments()])
  }

  const pickCompletionProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload completion proof.')
      return
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setCompletionProofUri(result.assets[0].uri)
    }
  }

  const uploadCompletionProof = async (taskId: string): Promise<string | null> => {
    if (!completionProofUri) return null

    try {
      setUploadingProof(true)
      const response = await fetch(completionProofUri)
      const blob = await response.blob()
      const fileExt = completionProofUri.split('.').pop()
      const fileName = `${taskId}_${Date.now()}.${fileExt}`
      const filePath = `task-completions/${fileName}`

      const { data, error } = await supabase.storage
        .from('task-proofs')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('task-proofs')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading proof:', error)
      Alert.alert('Warning', 'Failed to upload completion proof, but task will still be marked as done.')
      return null
    } finally {
      setUploadingProof(false)
    }
  }

  const handleMarkDone = async () => {
    if (!task) return

    Alert.alert(
      'Complete Task',
      'Would you like to add a completion proof photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Photo',
          onPress: async () => {
            await pickCompletionProof()
          }
        },
        {
          text: 'Skip Photo',
          onPress: () => confirmMarkDone()
        }
      ]
    )
  }

  const confirmMarkDone = async () => {
    try {
      let proofUrl = null
      if (completionProofUri) {
        proofUrl = await uploadCompletionProof(task.id)
      }

      const { data, error } = await supabase.rpc('mark_task_done', {
        p_task_id: task.id
      })

      if (error) {
        console.error('RPC Error:', error)
        throw error
      }

      // Update completion proof URL if uploaded
      if (proofUrl) {
        await supabase
          .from('tasks')
          .update({ completion_proof_url: proofUrl })
          .eq('id', task.id)
      }

      Alert.alert('Success! 🎉', 'Task completed successfully!')
      setCompletionProofUri(null)
      await fetchTaskDetails()

      // Navigate back to tasks list after a short delay
      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (error: any) {
      console.error('Error completing task:', error)
      Alert.alert(
        'Error',
        error.message || 'Failed to complete task. Please make sure the database migration has been run.'
      )
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return

    try {
      setSubmittingComment(true)

      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: task.id,
          household_id: task.household_id,
          user_id: user?.id,
          comment: newComment.trim(),
          is_anonymous: isAnonymous
        })

      if (error) throw error

      setNewComment('')
      setIsAnonymous(false)
      await fetchComments()

      // Scroll to bottom to show new comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error('Error adding comment:', error)
      Alert.alert('Error', 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id)

              if (error) throw error

              Alert.alert('Success', 'Task deleted')
              router.back()
            } catch (error) {
              console.error('Error deleting task:', error)
              Alert.alert('Error', 'Failed to delete task')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    )
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={APP_THEME.colors.error} />
        <Text style={styles.errorText}>Task not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isAssignee = task.assigned_to === user?.id
  const isCreator = task.created_by === user?.id
  const canMarkDone = (isAssignee || isCreator) && (task.status === 'pending' || task.status === 'in_progress')

  console.log('Mark Complete Button Debug:', {
    assigned_to: task.assigned_to,
    user_id: user?.id,
    isAssignee,
    isCreator,
    status: task.status,
    canMarkDone
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50'
      case 'pending_review': return '#FF9800'
      case 'in_progress': return '#2196F3'
      default: return APP_THEME.colors.textSecondary
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_review': return 'Pending Review'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={APP_THEME.colors.surface} />
            </TouchableOpacity>

            {(isCreator || isAssignee) && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.push(`/(app)/tasks/edit/${task.id}`)}
                >
                  <Ionicons name="create-outline" size={24} color={APP_THEME.colors.surface} />
                </TouchableOpacity>
                {isCreator && (
                  <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color={APP_THEME.colors.surface} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Task Title & Status */}
          <View style={styles.titleSection}>
            <View style={styles.titleContainer}>
              {task.emoji && <Text style={styles.emoji}>{task.emoji}</Text>}
              <Text style={styles.title}>{task.title}</Text>
            </View>
            <View style={styles.titleRightSection}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
              </View>
              {canMarkDone && (
                <TouchableOpacity
                  style={styles.quickCompleteButton}
                  onPress={handleMarkDone}
                  disabled={markingComplete}
                >
                  {markingComplete ? (
                    <ActivityIndicator size="small" color={APP_THEME.colors.surface} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={APP_THEME.colors.surface} />
                      <Text style={styles.quickCompleteText}>Complete</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Assignee Card with Avatar */}
          {task.assignee && (
            <View style={styles.assigneeCard}>
              <View style={styles.assigneeHeader}>
                <Ionicons name="person" size={18} color={APP_THEME.colors.primary} />
                <Text style={styles.assigneeLabel}>Assigned to</Text>
              </View>
              <View style={styles.assigneeInfo}>
                {task.assignee.photo_url ? (
                  <Image source={{ uri: task.assignee.photo_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {(task.assignee.name || task.assignee.email || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.assigneeDetails}>
                  <Text style={styles.assigneeName}>
                    {task.assignee.name || task.assignee.email || 'Unassigned'}
                  </Text>
                  {task.assignee.email && task.assignee.name && (
                    <Text style={styles.assigneeEmail}>{task.assignee.email}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Task Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={20} color={APP_THEME.colors.primary} />
              <Text style={styles.cardTitle}>Task Details</Text>
            </View>

            {task.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{task.description}</Text>
              </View>
            )}

            {task.due_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.due_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}

            {task.priority && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Priority</Text>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                  {task.priority}
                </Text>
              </View>
            )}

            {task.created_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.created_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Completion Proof Preview */}
          {completionProofUri && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="camera" size={20} color={APP_THEME.colors.primary} />
                <Text style={styles.cardTitle}>Completion Proof</Text>
                <TouchableOpacity
                  onPress={() => setCompletionProofUri(null)}
                  style={styles.removeProofButton}
                >
                  <Ionicons name="close-circle" size={20} color={APP_THEME.colors.error} />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: completionProofUri }} style={styles.proofImage} />
              <TouchableOpacity style={styles.confirmButton} onPress={confirmMarkDone}>
                <Text style={styles.confirmButtonText}>
                  {uploadingProof ? 'Uploading...' : 'Confirm & Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Existing Completion Proof */}
          {task.completion_proof_url && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.cardTitle}>Completion Proof</Text>
              </View>
              <Image source={{ uri: task.completion_proof_url }} style={styles.proofImage} />
            </View>
          )}

          {/* Review Info */}
          {task.status === 'completed' && task.reviewer && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                <Text style={styles.cardTitle}>Review Information</Text>
              </View>
              <View style={styles.reviewerInfo}>
                {task.reviewer.photo_url ? (
                  <Image source={{ uri: task.reviewer.photo_url }} style={styles.smallAvatar} />
                ) : (
                  <View style={[styles.smallAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.smallAvatarText}>
                      {(task.reviewer.name || task.reviewer.email || 'R')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>
                    Approved by {task.reviewer.name || task.reviewer.email}
                  </Text>
                  {task.reviewed_at && (
                    <Text style={styles.reviewDate}>
                      {new Date(task.reviewed_at).toLocaleDateString()}
                    </Text>
                  )}
                  {task.review_notes && (
                    <Text style={styles.reviewNotes}>{task.review_notes}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Comments Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubbles" size={20} color={APP_THEME.colors.primary} />
              <Text style={styles.cardTitle}>Comments ({comments.length})</Text>
            </View>

            {comments.length > 0 ? (
              <View style={styles.commentsContainer}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      {comment.is_anonymous ? (
                        <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                          <Ionicons name="person-outline" size={20} color={APP_THEME.colors.textSecondary} />
                        </View>
                      ) : comment.user_photo ? (
                        <Image source={{ uri: comment.user_photo }} style={styles.commentAvatar} />
                      ) : (
                        <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                          <Text style={styles.commentAvatarText}>
                            {(comment.user_name || comment.user_email || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>
                          {comment.is_anonymous ? 'Anonymous' : (comment.user_name || comment.user_email || 'Unknown')}
                        </Text>
                        <Text style={styles.commentTime}>
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
            )}

            {/* Add Comment Input */}
            <View style={styles.addCommentContainer}>
              <View style={styles.commentInputWrapper}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={APP_THEME.colors.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={styles.anonymousToggle}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                >
                  <Ionicons
                    name={isAnonymous ? "checkbox" : "square-outline"}
                    size={20}
                    color={isAnonymous ? APP_THEME.colors.primary : APP_THEME.colors.textSecondary}
                  />
                  <Text style={[styles.anonymousText, isAnonymous && styles.anonymousTextActive]}>
                    Post anonymously
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color={APP_THEME.colors.surface} />
                ) : (
                  <Ionicons name="send" size={20} color={APP_THEME.colors.surface} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Action Button */}
        {canMarkDone && !completionProofUri && (
          <TouchableOpacity style={styles.actionButton} onPress={handleMarkDone}>
            <Ionicons name="checkmark-circle" size={24} color={APP_THEME.colors.surface} />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: APP_THEME.colors.background,
  },
  errorText: {
    fontSize: 18,
    color: APP_THEME.colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
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
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    backgroundColor: APP_THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: APP_THEME.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleRightSection: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    lineHeight: 32,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: APP_THEME.colors.surface,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  assigneeCard: {
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assigneeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  assigneeLabel: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: APP_THEME.colors.surface,
    fontSize: 20,
    fontWeight: 'bold',
  },
  assigneeDetails: {
    flex: 1,
  },
  assigneeName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: 2,
  },
  assigneeEmail: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  card: {
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: APP_THEME.colors.text,
    lineHeight: 22,
  },
  removeProofButton: {
    padding: 4,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: APP_THEME.colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  smallAvatarText: {
    color: APP_THEME.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 6,
  },
  reviewNotes: {
    fontSize: 14,
    color: APP_THEME.colors.text,
    fontStyle: 'italic',
  },
  commentsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  commentItem: {
    gap: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarText: {
    color: APP_THEME.colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
  },
  commentTime: {
    fontSize: 11,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: APP_THEME.colors.text,
    lineHeight: 20,
    marginLeft: 42,
  },
  noComments: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.border,
  },
  commentInputWrapper: {
    flex: 1,
    gap: 8,
  },
  commentInput: {
    backgroundColor: APP_THEME.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: APP_THEME.colors.text,
    maxHeight: 100,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  anonymousText: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  anonymousTextActive: {
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: APP_THEME.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  quickCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: APP_THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCompleteText: {
    color: APP_THEME.colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: APP_THEME.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
})

