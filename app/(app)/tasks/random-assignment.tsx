import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface TaskAssignment {
  task: any
  assignee: any
  previousAssignee?: any
}

export default function RandomTaskAssignmentScreen() {
  const [unassignedTasks, setUnassignedTasks] = useState<any[]>([])
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!user) return

    try {
      // Get user's household and role
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      setUserRole(householdMember.role)

      // Check if user has permission to shuffle tasks
      if (householdMember.role !== 'admin' && householdMember.role !== 'captain') {
        Alert.alert('Permission Denied', 'Only admins and captains can shuffle tasks', [
          { text: 'OK', onPress: () => router.back() }
        ])
        return
      }

      // Fetch unassigned tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (
            id,
            name
          )
        `)
        .eq('household_id', householdMember.household_id)
        .eq('status', 'pending')

      // Fetch household members
      const { data: members } = await supabase
        .from('household_members')
        .select(`
          user_id,
          profiles (
            id,
            name,
            email
          )
        `)
        .eq('household_id', householdMember.household_id)

      setUnassignedTasks(tasks || [])
      setHouseholdMembers(members || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const shuffleTasks = () => {
    if (unassignedTasks.length === 0 || householdMembers.length === 0) {
      Alert.alert('Error', 'No tasks or members available for assignment')
      return
    }

    setShuffling(true)

    // Simulate shuffling animation
    setTimeout(() => {
      const newAssignments: TaskAssignment[] = []
      const availableMembers = [...householdMembers]

      // Shuffle tasks randomly
      const shuffledTasks = [...unassignedTasks].sort(() => Math.random() - 0.5)

      shuffledTasks.forEach((task, index) => {
        // Round-robin assignment to ensure fair distribution
        const memberIndex = index % availableMembers.length
        const assignee = availableMembers[memberIndex]

        newAssignments.push({
          task,
          assignee: assignee.profiles,
          previousAssignee: task.assignee,
        })
      })

      setAssignments(newAssignments)
      setShuffling(false)
    }, 2000)
  }

  const confirmAssignments = async () => {
    if (assignments.length === 0) return

    setConfirming(true)
    try {
      // Update all task assignments
      const updates = assignments.map(assignment => ({
        id: assignment.task.id,
        assignee_id: assignment.assignee.id,
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('tasks')
          .update({ assignee_id: update.assignee_id })
          .eq('id', update.id)

        if (error) throw error
      }

      Alert.alert(
        'Success!',
        `${assignments.length} tasks have been randomly assigned`,
        [
          {
            text: 'View Tasks',
            onPress: () => router.replace('/(app)/tasks'),
          },
        ]
      )
    } catch (error) {
      console.error('Error confirming assignments:', error)
      Alert.alert('Error', 'Failed to save task assignments')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Random Assignment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔄 Fair Task Distribution</Text>
          <Text style={styles.infoText}>
            Randomly assign pending tasks to household members for fair distribution of chores.
          </Text>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{unassignedTasks.length}</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{householdMembers.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>
        </View>

        {unassignedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Tasks to Assign</Text>
            <Text style={styles.emptyStateText}>
              All tasks are already assigned or completed.
            </Text>
            <TouchableOpacity
              style={styles.createTaskButton}
              onPress={() => router.push('/(app)/tasks/create')}
            >
              <Text style={styles.createTaskButtonText}>Create New Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {assignments.length === 0 ? (
              <View style={styles.shuffleSection}>
                <TouchableOpacity
                  style={[styles.shuffleButton, shuffling && styles.shufflingButton]}
                  onPress={shuffleTasks}
                  disabled={shuffling}
                >
                  {shuffling ? (
                    <View style={styles.shufflingContent}>
                      <ActivityIndicator color="#fff" />
                      <Text style={styles.shuffleButtonText}>Shuffling...</Text>
                    </View>
                  ) : (
                    <Text style={styles.shuffleButtonText}>🎲 Shuffle Tasks</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.shuffleHint}>
                  This will randomly assign all pending tasks to household members
                </Text>
              </View>
            ) : (
              <View style={styles.assignmentsSection}>
                <Text style={styles.assignmentsTitle}>New Assignments</Text>
                
                {assignments.map((assignment, index) => (
                  <View key={assignment.task.id} style={styles.assignmentCard}>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{assignment.task.title}</Text>
                      {assignment.task.description && (
                        <Text style={styles.taskDescription}>
                          {assignment.task.description}
                        </Text>
                      )}
                    </View>

                    <View style={styles.assignmentChange}>
                      {assignment.previousAssignee ? (
                        <View style={styles.reassignment}>
                          <Text style={styles.previousAssignee}>
                            {assignment.previousAssignee.name}
                          </Text>
                          <Text style={styles.arrow}>→</Text>
                          <Text style={styles.newAssignee}>
                            {assignment.assignee.name}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.newAssignee}>
                          → {assignment.assignee.name}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                <View style={styles.confirmSection}>
                  <TouchableOpacity
                    style={styles.shuffleAgainButton}
                    onPress={shuffleTasks}
                    disabled={shuffling}
                  >
                    <Text style={styles.shuffleAgainButtonText}>
                      🎲 Shuffle Again
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmButton, confirming && styles.confirmingButton]}
                    onPress={confirmAssignments}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <View style={styles.confirmingContent}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.confirmButtonText}>Saving...</Text>
                      </View>
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        ✓ Confirm Assignments
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
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
    marginTop: 10,
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
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  shuffleSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  shuffleButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  shufflingButton: {
    backgroundColor: '#e0a800',
  },
  shufflingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shuffleButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shuffleHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  assignmentsSection: {
    marginBottom: 20,
  },
  assignmentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  assignmentCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  taskInfo: {
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  assignmentChange: {
    alignItems: 'flex-end',
  },
  reassignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previousAssignee: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: 'bold',
  },
  newAssignee: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  confirmSection: {
    marginTop: 20,
    gap: 12,
  },
  shuffleAgainButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shuffleAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmingButton: {
    backgroundColor: '#1e7e34',
  },
  confirmingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})
