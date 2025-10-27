import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [task, setTask] = useState<any>(null)
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [transferRequests, setTransferRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchTaskDetails()
    }
  }, [id])

  const fetchTaskDetails = async () => {
    try {
      // Fetch task details with simplified query
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (taskError) throw taskError
      setTask(taskData)

      // Fetch household members
      if (taskData?.household_id) {
        const { data: members } = await supabase
          .from('household_members')
          .select(`
            user_id,
            role,
            profiles (
              id,
              name,
              email
            )
          `)
          .eq('household_id', taskData.household_id)

        setHouseholdMembers(members || [])
      }

      // Fetch transfer requests for this task
      const { data: transfers } = await supabase
        .from('task_transfer_requests')
        .select(`
          *,
          from_user:from_user_id (
            name,
            email
          ),
          to_user:to_user_id (
            name,
            email
          )
        `)
        .eq('task_id', id)
        .order('created_at', { ascending: false })

      setTransferRequests(transfers || [])

      // Approval system removed
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
      // Update task status to completed (no approval needed)
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id)

      if (taskError) throw taskError

      Alert.alert('Success', 'Task marked as complete!')
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error marking task complete:', error)
      Alert.alert('Error', 'Failed to mark task as complete')
    }
  }

  const handleTransferRequest = (toUserId: string, toUserName: string) => {
    Alert.prompt(
      'Transfer Task',
      `Transfer this task to ${toUserName}? Add an optional message:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          onPress: (message) => createTransferRequest(toUserId, message || '')
        }
      ],
      'plain-text',
      '',
      'default'
    )
  }

  const createTransferRequest = async (toUserId: string, message: string) => {
    try {
      const { data, error } = await supabase.rpc('create_task_transfer_request', {
        p_task_id: id,
        p_to_user_id: toUserId,
        p_message: message
      })

      if (error) throw error

      Alert.alert('Success', 'Transfer request sent!')
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error creating transfer request:', error)
      Alert.alert('Error', error.message || 'Failed to create transfer request')
    }
  }

  const handleTransferResponse = async (transferId: string, response: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase.rpc('respond_to_task_transfer', {
        p_transfer_id: transferId,
        p_response: response
      })

      if (error) throw error

      Alert.alert('Success', `Transfer request ${response}!`)
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error responding to transfer:', error)
      Alert.alert('Error', error.message || 'Failed to respond to transfer request')
    }
  }

  // Approval functions removed - using direct completion now

  const getTransferStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return { backgroundColor: '#d4edda', borderColor: '#c3e6cb' }
      case 'rejected': return { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' }
      case 'pending': return { backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }
      default: return { backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }
    }
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
          <View style={styles.titleRow}>
            {task.emoji && (
              <Text style={styles.taskEmoji}>{task.emoji}</Text>
            )}
            <Text style={styles.title}>{task.title}</Text>
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

        {/* Approval section removed */}

        <View style={styles.actions}>
          {task.status === 'pending' && isAssignee && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleMarkComplete}
            >
              <Text style={styles.completeButtonText}>✅ Mark as Complete</Text>
            </TouchableOpacity>
          )}

          {/* Transfer Task Section */}
          {task.status === 'pending' && isAssignee && householdMembers.length > 1 && (
            <View style={styles.transferSection}>
              <Text style={styles.transferTitle}>🔄 Transfer Task</Text>
              <Text style={styles.transferSubtitle}>Can't complete this task? Transfer it to someone else</Text>

              <View style={styles.membersList}>
                {householdMembers
                  .filter(member => member.user_id !== user?.id)
                  .map((member) => (
                    <TouchableOpacity
                      key={member.user_id}
                      style={styles.memberButton}
                      onPress={() => handleTransferRequest(member.user_id, member.profiles?.name || 'Unknown')}
                    >
                      <Text style={styles.memberName}>
                        👤 {member.profiles?.name || member.profiles?.email || 'Unknown'}
                      </Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}

          {/* Transfer Requests Section */}
          {transferRequests.length > 0 && (
            <View style={styles.transferRequestsSection}>
              <Text style={styles.transferRequestsTitle}>📨 Transfer Requests</Text>

              {transferRequests.map((request) => (
                <View key={request.id} style={styles.transferRequestCard}>
                  <View style={styles.transferRequestHeader}>
                    <Text style={styles.transferRequestFrom}>
                      From: {request.from_user?.name || 'Unknown'}
                    </Text>
                    <View style={[styles.statusBadge, getTransferStatusStyle(request.status)]}>
                      <Text style={styles.statusText}>{request.status}</Text>
                    </View>
                  </View>

                  {request.message && (
                    <Text style={styles.transferMessage}>💬 "{request.message}"</Text>
                  )}

                  <Text style={styles.transferDate}>
                    📅 {new Date(request.created_at).toLocaleDateString()}
                  </Text>

                  {request.status === 'pending' && request.to_user_id === user?.id && (
                    <View style={styles.transferActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleTransferResponse(request.id, 'accepted')}
                      >
                        <Text style={styles.acceptButtonText}>✅ Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleTransferResponse(request.id, 'rejected')}
                      >
                        <Text style={styles.rejectButtonText}>❌ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  taskEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
  // Transfer Section Styles
  transferSection: {
    backgroundColor: '#f8faff',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  transferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  transferSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  membersList: {
    gap: 8,
  },
  memberButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Transfer Requests Styles
  transferRequestsSection: {
    marginTop: 20,
  },
  transferRequestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  transferRequestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transferRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transferRequestFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transferMessage: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  transferDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  transferActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
