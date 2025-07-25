import { useEffect, useState } from 'react'
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
    RefreshControl
} from 'react-native'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface BillNotification {
  id: string
  type: 'new_bill' | 'payment_reminder' | 'payment_received' | 'bill_settled' | 'spending_summary'
  title: string
  message: string
  is_read: boolean
  created_at: string
  bill_id?: string
  split_id?: string
}

interface NotificationSystemProps {
  visible: boolean
  onClose: () => void
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function NotificationSystem({ visible, onClose }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<BillNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      setupNotifications()
      fetchNotifications()
      scheduleReminders()
    }
  }, [user])

  useEffect(() => {
    if (visible) {
      fetchNotifications()
    }
  }, [visible])

  const setupNotifications = async () => {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please enable notifications to receive bill reminders')
      return
    }

    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync()).data
    
    // Save token to user profile
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user?.id)
  }

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bill_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('bill_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('bill_notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const scheduleReminders = async () => {
    if (!user) return

    try {
      // Schedule daily reminder check
      await Notifications.cancelAllScheduledNotificationsAsync()
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bill Reminder Check',
          body: 'Checking for overdue bills...',
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      })

      // Call backend function to schedule payment reminders
      await supabase.rpc('schedule_payment_reminders')
    } catch (error) {
      console.error('Error scheduling reminders:', error)
    }
  }

  const sendPaymentReminder = async (splitId: string) => {
    try {
      // Get split details
      const { data: split } = await supabase
        .from('bill_splits')
        .select(`
          *,
          bills (title, amount),
          profiles (name)
        `)
        .eq('id', splitId)
        .single()

      if (!split) return

      // Create notification
      await supabase
        .from('bill_notifications')
        .insert({
          user_id: split.user_id,
          split_id: splitId,
          type: 'payment_reminder',
          title: `Payment Reminder: ${split.bills.title}`,
          message: `You owe $${split.amount} for ${split.bills.title}`,
          scheduled_for: new Date().toISOString()
        })

      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Payment Reminder: ${split.bills.title}`,
          body: `You owe $${split.amount} for ${split.bills.title}`,
          data: { splitId, type: 'payment_reminder' },
        },
        trigger: null, // Send immediately
      })
    } catch (error) {
      console.error('Error sending payment reminder:', error)
    }
  }

  const sendSpendingSummary = async (period: 'weekly' | 'monthly') => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      // Calculate spending for period
      const endDate = new Date()
      const startDate = new Date()
      if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7)
      } else {
        startDate.setMonth(startDate.getMonth() - 1)
      }

      const { data: bills } = await supabase
        .from('bills')
        .select('amount')
        .eq('household_id', householdMember.household_id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      const totalSpending = (bills || []).reduce((sum, bill) => sum + bill.amount, 0)

      // Create notification
      await supabase
        .from('bill_notifications')
        .insert({
          user_id: user.id,
          type: 'spending_summary',
          title: `${period === 'weekly' ? 'Weekly' : 'Monthly'} Spending Summary`,
          message: `Your household spent $${totalSpending.toFixed(2)} this ${period.slice(0, -2)}`,
          scheduled_for: new Date().toISOString()
        })

      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${period === 'weekly' ? 'Weekly' : 'Monthly'} Spending Summary`,
          body: `Your household spent $${totalSpending.toFixed(2)} this ${period.slice(0, -2)}`,
          data: { type: 'spending_summary', period },
        },
        trigger: null,
      })
    } catch (error) {
      console.error('Error sending spending summary:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_bill': return '💰'
      case 'payment_reminder': return '⏰'
      case 'payment_received': return '✅'
      case 'bill_settled': return '🤝'
      case 'spending_summary': return '📊'
      default: return '📋'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const renderNotification = ({ item }: { item: BillNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadNotification]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
          </View>
          <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔔 Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllButton}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unread Count */}
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Text style={styles.unreadText}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔔</Text>
              <Text style={styles.emptyStateTitle}>No Notifications</Text>
              <Text style={styles.emptyStateText}>
                You're all caught up! Notifications about bills and payments will appear here.
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  markAllButton: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  unreadBanner: {
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  unreadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginLeft: 8,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
})
