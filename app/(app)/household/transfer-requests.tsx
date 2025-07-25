import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
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

interface TransferRequest {
  transfer_id: string
  task_id: string
  task_title: string
  task_description: string
  from_user_name: string
  from_user_email: string
  message: string
  created_at: string
}

export default function TransferRequestsScreen() {
  const [pendingRequests, setPendingRequests] = useState<TransferRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pending_transfer_requests')

      if (error) throw error

      setPendingRequests(data || [])
    } catch (error) {
      console.error('Error fetching transfer requests:', error)
      Alert.alert('Error', 'Failed to load transfer requests')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPendingRequests()
    setRefreshing(false)
  }

  const handleResponse = async (transferId: string, response: 'accepted' | 'rejected', taskTitle: string) => {
    try {
      const { error } = await supabase.rpc('respond_to_task_transfer', {
        p_transfer_id: transferId,
        p_response: response
      })

      if (error) throw error

      Alert.alert(
        'Success', 
        `Transfer request ${response}! ${response === 'accepted' ? `"${taskTitle}" is now assigned to you.` : ''}`
      )
      await fetchPendingRequests()
    } catch (error) {
      console.error('Error responding to transfer:', error)
      Alert.alert('Error', error.message || 'Failed to respond to transfer request')
    }
  }

  const confirmResponse = (transferId: string, response: 'accepted' | 'rejected', taskTitle: string) => {
    Alert.alert(
      response === 'accepted' ? 'Accept Transfer' : 'Reject Transfer',
      `Are you sure you want to ${response} the transfer of "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: response === 'accepted' ? 'Accept' : 'Reject',
          style: response === 'accepted' ? 'default' : 'destructive',
          onPress: () => handleResponse(transferId, response, taskTitle)
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading transfer requests...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transfer Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingRequests.length > 0 ? (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📨 Pending Requests</Text>
              <Text style={styles.infoDescription}>
                You have {pendingRequests.length} task transfer request{pendingRequests.length !== 1 ? 's' : ''} waiting for your response.
              </Text>
            </View>

            {pendingRequests.map((request) => (
              <View key={request.transfer_id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.taskTitle}>📋 {request.task_title}</Text>
                  <Text style={styles.fromUser}>From: {request.from_user_name}</Text>
                </View>

                {request.task_description && (
                  <Text style={styles.taskDescription} numberOfLines={2}>
                    {request.task_description}
                  </Text>
                )}

                {request.message && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>💬 Message:</Text>
                    <Text style={styles.messageText}>"{request.message}"</Text>
                  </View>
                )}

                <Text style={styles.requestDate}>
                  📅 Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => confirmResponse(request.transfer_id, 'accepted', request.task_title)}
                  >
                    <Text style={styles.acceptButtonText}>✅ Accept Task</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => confirmResponse(request.transfer_id, 'rejected', request.task_title)}
                  >
                    <Text style={styles.rejectButtonText}>❌ Reject</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.viewTaskButton}
                  onPress={() => router.push(`/(app)/tasks/${request.task_id}`)}
                >
                  <Text style={styles.viewTaskButtonText}>👁️ View Task Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateTitle}>No Transfer Requests</Text>
            <Text style={styles.emptyStateText}>
              You don't have any pending task transfer requests at the moment.
            </Text>
            <TouchableOpacity
              style={styles.backToTasksButton}
              onPress={() => router.push('/(app)/tasks')}
            >
              <Text style={styles.backToTasksButtonText}>📋 View All Tasks</Text>
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
  infoCard: {
    backgroundColor: '#f8faff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requestHeader: {
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fromUser: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  messageContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  rejectButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewTaskButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  viewTaskButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  backToTasksButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToTasksButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
