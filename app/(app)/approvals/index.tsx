import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

export default function ApprovalRequestsScreen() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      // Fetch pending approvals for tasks in the household
      const { data, error } = await supabase
        .from('task_approvals')
        .select(`
          *,
          tasks (
            id,
            title,
            description,
            household_id
          ),
          submitted_by_user:submitted_by (
            id,
            name,
            email
          )
        `)
        .eq('status', 'pending')
        .eq('tasks.household_id', householdMember.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter out approvals for tasks submitted by the current user
      const filteredApprovals = (data || []).filter(
        approval => approval.submitted_by !== user.id
      )

      setApprovals(filteredApprovals)
    } catch (error) {
      console.error('Error fetching approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchApprovals()
    setRefreshing(false)
  }

  const handleApprove = async (approvalId: string, taskId: string) => {
    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from('task_approvals')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId)

      if (approvalError) throw approvalError

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (taskError) throw taskError

      Alert.alert('Success', 'Task approved successfully')
      await fetchApprovals()
    } catch (error) {
      console.error('Error approving task:', error)
      Alert.alert('Error', 'Failed to approve task')
    }
  }

  const handleReject = async (approvalId: string, taskId: string) => {
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
                .eq('id', approvalId)

              if (approvalError) throw approvalError

              // Update task status back to pending
              const { error: taskError } = await supabase
                .from('tasks')
                .update({ status: 'pending' })
                .eq('id', taskId)

              if (taskError) throw taskError

              Alert.alert('Task Rejected', 'Task has been rejected and marked as pending')
              await fetchApprovals()
            } catch (error) {
              console.error('Error rejecting task:', error)
              Alert.alert('Error', 'Failed to reject task')
            }
          },
        },
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading approvals...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Approval Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {approvals.length > 0 ? (
          <>
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Review and approve task completions from your housemates
              </Text>
            </View>

            {approvals.map((approval) => (
              <View key={approval.id} style={styles.approvalCard}>
                <View style={styles.approvalHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{approval.tasks?.title}</Text>
                    {approval.tasks?.description && (
                      <Text style={styles.taskDescription}>
                        {approval.tasks.description}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.submittedDate}>
                    {formatDate(approval.created_at)}
                  </Text>
                </View>

                <View style={styles.submissionInfo}>
                  <Text style={styles.submittedBy}>
                    Submitted by {approval.submitted_by_user?.name}
                  </Text>
                  
                  {approval.proof_photo_url && (
                    <TouchableOpacity
                      style={styles.proofImageContainer}
                      onPress={() => {
                        // In a real app, you might want to open a full-screen image viewer
                        Alert.alert('Proof Photo', 'Tap to view full size')
                      }}
                    >
                      <Image
                        source={{ uri: approval.proof_photo_url }}
                        style={styles.proofImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.proofImageLabel}>Proof Photo</Text>
                    </TouchableOpacity>
                  )}

                  {approval.comments && (
                    <View style={styles.commentsSection}>
                      <Text style={styles.commentsLabel}>Comments:</Text>
                      <Text style={styles.commentsText}>{approval.comments}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.approvalActions}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(approval.id, approval.tasks.id)}
                  >
                    <Text style={styles.rejectButtonText}>✗ Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(approval.id, approval.tasks.id)}
                  >
                    <Text style={styles.approveButtonText}>✓ Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateTitle}>No Pending Approvals</Text>
            <Text style={styles.emptyStateText}>
              All task completions have been reviewed. New requests will appear here when housemates mark tasks as complete.
            </Text>
            
            <TouchableOpacity
              style={styles.viewTasksButton}
              onPress={() => router.push('/(app)/tasks')}
            >
              <Text style={styles.viewTasksButtonText}>View All Tasks</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  backText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  approvalCard: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  submittedDate: {
    fontSize: 12,
    color: '#999',
  },
  submissionInfo: {
    marginBottom: 16,
  },
  submittedBy: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  proofImageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  proofImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  proofImageLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  viewTasksButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewTasksButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
