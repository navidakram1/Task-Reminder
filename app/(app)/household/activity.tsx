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

interface ActivityItem {
  id: string
  type: 'task_created' | 'task_completed' | 'task_approved' | 'bill_added' | 'member_joined' | 'role_changed'
  user_name: string
  user_id: string
  description: string
  created_at: string
  metadata?: any
}

export default function HouseholdActivityScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [household, setHousehold] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          households (
            id,
            name,
            invite_code
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (!householdMember) {
        router.push('/(onboarding)/create-join-household')
        return
      }

      setHousehold({
        ...householdMember.households,
        userRole: householdMember.role,
      })

      // Fetch recent activities (simulated from various tables)
      const householdId = householdMember.household_id
      const activities: ActivityItem[] = []

      // Get recent tasks
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          created_by,
          profiles!tasks_created_by_fkey (name)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(10)

      recentTasks?.forEach(task => {
        activities.push({
          id: `task_${task.id}`,
          type: 'task_created',
          user_name: task.profiles?.name || 'Someone',
          user_id: task.created_by,
          description: `created task "${task.title}"`,
          created_at: task.created_at,
          metadata: { task_id: task.id, task_title: task.title }
        })
      })

      // Get recent bills
      const { data: recentBills } = await supabase
        .from('bills')
        .select(`
          id,
          title,
          amount,
          created_at,
          paid_by,
          profiles!bills_paid_by_fkey (name)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(10)

      recentBills?.forEach(bill => {
        activities.push({
          id: `bill_${bill.id}`,
          type: 'bill_added',
          user_name: bill.profiles?.name || 'Someone',
          user_id: bill.paid_by,
          description: `added bill "${bill.title}" for $${bill.amount}`,
          created_at: bill.created_at,
          metadata: { bill_id: bill.id, bill_title: bill.title, amount: bill.amount }
        })
      })

      // Get recent member joins
      const { data: recentMembers } = await supabase
        .from('household_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          profiles!household_members_user_id_fkey (name)
        `)
        .eq('household_id', householdId)
        .order('joined_at', { ascending: false })
        .limit(10)

      recentMembers?.forEach(member => {
        activities.push({
          id: `member_${member.id}`,
          type: 'member_joined',
          user_name: member.profiles?.name || 'Someone',
          user_id: member.user_id,
          description: `joined as ${member.role}`,
          created_at: member.joined_at,
          metadata: { role: member.role }
        })
      })

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setActivities(activities.slice(0, 20)) // Show latest 20 activities
    } catch (error) {
      console.error('Error fetching activity:', error)
      Alert.alert('Error', 'Failed to load activity feed')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchActivity()
    setRefreshing(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created': return '📋'
      case 'task_completed': return '✅'
      case 'task_approved': return '👍'
      case 'bill_added': return '💰'
      case 'member_joined': return '👋'
      case 'role_changed': return '⭐'
      default: return '📝'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created': return '#667eea'
      case 'task_completed': return '#28a745'
      case 'task_approved': return '#28a745'
      case 'bill_added': return '#ffc107'
      case 'member_joined': return '#17a2b8'
      case 'role_changed': return '#6f42c1'
      default: return '#6c757d'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading activity...</Text>
      </View>
    )
  }

  if (!household) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No household found</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(onboarding)/create-join-household')}
        >
          <Text style={styles.createButtonText}>Create or Join Household</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Activity Feed</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.householdInfo}>
        <Text style={styles.householdName}>{household.name}</Text>
        <Text style={styles.householdSubtitle}>Recent household activity</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activities.length > 0 ? (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: getActivityColor(activity.type) }
                  ]}
                >
                  <Text style={styles.activityIconText}>
                    {getActivityIcon(activity.type)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityText}>
                    <Text style={styles.userName}>{activity.user_name}</Text>
                    {' '}
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                  </Text>
                  <Text style={styles.activityTime}>{formatTime(activity.created_at)}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateTitle}>No activity yet</Text>
            <Text style={styles.emptyStateText}>
              Start creating tasks and adding bills to see activity here!
            </Text>
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
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  householdInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  householdName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  householdSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityLeft: {
    marginRight: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
  },
  userName: {
    fontWeight: '600',
    color: '#333',
  },
  activityDescription: {
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
})
