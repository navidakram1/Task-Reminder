import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [task, setTask] = useState<any>(null)
  const [approval, setApproval] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchTaskDetails()
    }
  }, [id])

  const fetchTaskDetails = async () => {
    try {
      // Fetch task details
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (
            id,
            name,
            email
          ),
          creator:created_by (
            id,
            name,
            email
          )
        `)
        .eq('id', id)
        .single()

      if (taskError) throw taskError
      setTask(taskData)

      // Fetch approval if task is awaiting approval
      if (taskData.status === 'awaiting_approval') {
        const { data: approvalData } = await supabase
          .from('task_approvals')
          .select(`
            *,
            submitted_by_user:submitted_by (
              id,
              name
            ),
            reviewed_by_user:reviewed_by (
              id,
              name
            )
          `)
          .eq('task_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        setApproval(approvalData)
      }
    } catch (error) {
      console.error('Error fetching task details:', error)
      Alert.alert('Error', 'Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!task) return

    try {
      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'awaiting_approval' })
        .eq('id', task.id)

      if (taskError) throw taskError

      // Create approval record
      const { error: approvalError } = await supabase
        .from('task_approvals')
        .insert({
          task_id: task.id,
          submitted_by: user?.id,
          status: 'pending',
        })

      if (approvalError) throw approvalError

      Alert.alert('Success', 'Task marked as complete and sent for approval')
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error marking task complete:', error)
      Alert.alert('Error', 'Failed to mark task as complete')
    }
  }

  const handleApprove = async () => {
    if (!approval) return

    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from('task_approvals')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approval.id)

      if (approvalError) throw approvalError

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id)

      if (taskError) throw taskError

      Alert.alert('Success', 'Task approved successfully')
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error approving task:', error)
      Alert.alert('Error', 'Failed to approve task')
    }
  }

  const handleReject = async () => {
    if (!approval) return

    Alert.alert(
      'Reject Task',
      'Are you sure you want to reject this task completion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update approval status
              const { error: approvalError } = await supabase
                .from('task_approvals')
                .update({
                  status: 'rejected',
                  reviewed_by: user?.id,
                  reviewed_at: new Date().toISOString(),
                })
                .eq('id', approval.id)

              if (approvalError) throw approvalError

              // Update task status back to pending
              const { error: taskError } = await supabase
                .from('tasks')
                .update({ status: 'pending' })
                .eq('id', task.id)

              if (taskError) throw taskError

              Alert.alert('Task Rejected', 'Task has been rejected and marked as pending')
              await fetchTaskDetails()
            } catch (error) {
              console.error('Error rejecting task:', error)
              Alert.alert('Error', 'Failed to reject task')
            }
          },
        },
      ]
    )
  }

  const handleEdit = () => {
    router.push(`/(app)/tasks/create?edit=${task.id}`)
  }

  const handleDelete = () => {
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
                .eq('id', task.id)

              if (error) throw error

              Alert.alert('Success', 'Task deleted successfully')
              router.back()
            } catch (error) {
              console.error('Error deleting task:', error)
              Alert.alert('Error', 'Failed to delete task')
            }
          },
        },
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    )
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isAssignee = task.assignee_id === user?.id
  const isCreator = task.created_by === user?.id
  const canApprove = task.status === 'awaiting_approval' && !isAssignee

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        {(isCreator || isAssignee) && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            {isCreator && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{task.title}</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          {task.assignee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned to:</Text>
              <Text style={styles.detailValue}>{task.assignee.name}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created by:</Text>
            <Text style={styles.detailValue}>{task.creator.name}</Text>
          </View>

          {task.due_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due date:</Text>
              <Text style={styles.detailValue}>{formatDate(task.due_date)}</Text>
            </View>
          )}

          {task.recurrence && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recurrence:</Text>
              <Text style={styles.detailValue}>{task.recurrence}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(task.created_at)}</Text>
          </View>
        </View>

        {approval && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval Status</Text>
            
            <View style={styles.approvalCard}>
              <Text style={styles.approvalText}>
                Submitted by {approval.submitted_by_user?.name} for approval
              </Text>
              
              {approval.proof_photo_url && (
                <Image
                  source={{ uri: approval.proof_photo_url }}
                  style={styles.proofImage}
                />
              )}

              {approval.status === 'approved' && approval.reviewed_by_user && (
                <Text style={styles.approvalResult}>
                  ✅ Approved by {approval.reviewed_by_user.name}
                </Text>
              )}

              {approval.status === 'rejected' && approval.reviewed_by_user && (
                <Text style={styles.approvalResult}>
                  ❌ Rejected by {approval.reviewed_by_user.name}
                </Text>
              )}

              {approval.comments && (
                <Text style={styles.approvalComments}>{approval.comments}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {task.status === 'pending' && isAssignee && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleMarkComplete}
            >
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            </TouchableOpacity>
          )}

          {canApprove && approval && (
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={handleApprove}
              >
                <Text style={styles.approveButtonText}>✓ Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={handleReject}
              >
                <Text style={styles.rejectButtonText}>✗ Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  approvalCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  approvalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  approvalResult: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  approvalComments: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actions: {
    marginTop: 20,
  },
  completeButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
