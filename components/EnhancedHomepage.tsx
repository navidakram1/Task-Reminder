import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'

const { width } = Dimensions.get('window')

interface EnhancedHomepageProps {
  household: any
  tasks: any[]
  bills: any[]
  approvals: any[]
  activities: any[]
  analytics: any
  onRefresh: () => void
  onNavigate: (route: string) => void
}

export const EnhancedHomepage: React.FC<EnhancedHomepageProps> = ({
  household,
  tasks,
  bills,
  approvals,
  activities,
  analytics,
  onRefresh,
  onNavigate,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current
  const [refreshing, setRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  // Color scheme
  const colors = {
    tasks: '#667eea',
    bills: '#27AE60',
    approvals: '#FFD93D',
    messages: '#FF6B6B',
    members: '#f093fb',
    analytics: '#FF9500',
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>🏠 {household?.name || 'Household'}</Text>
            <TouchableOpacity
              onPress={() => onNavigate('/(app)/messages')}
              style={styles.messageButton}
            >
              <Text style={styles.messageBadge}>💬</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>Good Morning, John! 👋</Text>
          <Text style={styles.date}>Monday, Jan 15 • 67% Complete</Text>
        </View>
      </LinearGradient>

      {/* Status Overview Card */}
      <View style={styles.statusCard}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E8E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusGradient}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Tasks</Text>
              <Text style={styles.statusValue}>{tasks.length}</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Bills</Text>
              <Text style={styles.statusValue}>${bills.reduce((sum, b) => sum + b.amount, 0)}</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Approvals</Text>
              <Text style={styles.statusValue}>{approvals.length}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard
            icon="📝"
            title="Add Task"
            color={colors.tasks}
            onPress={() => onNavigate('/(app)/tasks/create')}
          />
          <QuickActionCard
            icon="💰"
            title="Add Bill"
            color={colors.bills}
            onPress={() => onNavigate('/(app)/bills/create')}
          />
          <QuickActionCard
            icon="🔀"
            title="Shuffle"
            color={colors.analytics}
            onPress={() => onNavigate('/(app)/tasks/random-assignment')}
          />
          <QuickActionCard
            icon="💬"
            title="Messages"
            color={colors.messages}
            onPress={() => onNavigate('/(app)/messages')}
          />
          <QuickActionCard
            icon="👥"
            title="Members"
            color={colors.members}
            onPress={() => onNavigate('/(app)/household/members')}
          />
          <QuickActionCard
            icon="⚙️"
            title="Settings"
            color={colors.approvals}
            onPress={() => onNavigate('/(app)/settings')}
          />
        </View>
      </View>

      {/* Connected Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>

        {/* Tasks */}
        <ConnectedCard
          icon="📋"
          title="Upcoming Tasks"
          color={colors.tasks}
          items={tasks.slice(0, 3)}
          onViewAll={() => onNavigate('/(app)/tasks')}
        />

        {/* Bills */}
        <ConnectedCard
          icon="💳"
          title="Pending Bills"
          color={colors.bills}
          items={bills.slice(0, 3)}
          onViewAll={() => onNavigate('/(app)/bills')}
        />

        {/* Approvals */}
        {approvals.length > 0 && (
          <ConnectedCard
            icon="✅"
            title="Approvals Needed"
            color={colors.approvals}
            items={approvals.slice(0, 3)}
            onViewAll={() => onNavigate('/(app)/approvals')}
          />
        )}
      </View>

      {/* Analytics Dashboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <AnalyticsCard analytics={analytics} />
      </View>

      {/* Activity Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activities.slice(0, 5).map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  )
}

// Quick Action Card Component
const QuickActionCard: React.FC<{
  icon: string
  title: string
  color: string
  onPress: () => void
}> = ({ icon, title, color, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[color, `${color}dd`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionCard}
        >
          <Text style={styles.actionIcon}>{icon}</Text>
          <Text style={styles.actionTitle}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Connected Card Component
const ConnectedCard: React.FC<{
  icon: string
  title: string
  color: string
  items: any[]
  onViewAll: () => void
}> = ({ icon, title, color, items, onViewAll }) => {
  return (
    <View style={[styles.connectedCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.connectedHeader}>
        <Text style={styles.connectedTitle}>
          {icon} {title}
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        items.map((item, index) => (
          <View key={index} style={styles.connectedItem}>
            <Text style={styles.itemText}>{item.title || item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.due_date || item.amount || item.status}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No items</Text>
      )}
    </View>
  )
}

// Analytics Card Component
const AnalyticsCard: React.FC<{ analytics: any }> = ({ analytics }) => {
  return (
    <View style={styles.analyticsCard}>
      <AnalyticsBar label="Tasks" value={80} color="#667eea" />
      <AnalyticsBar label="Bills" value={60} color="#27AE60" />
      <AnalyticsBar label="Score" value={70} color="#FF9500" />
    </View>
  )
}

// Analytics Bar Component
const AnalyticsBar: React.FC<{
  label: string
  value: number
  color: string
}> = ({ label, value, color }) => {
  const widthAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start()
  }, [value])

  return (
    <View style={styles.analyticsRow}>
      <Text style={styles.analyticsLabel}>{label}</Text>
      <View style={styles.analyticsBarContainer}>
        <Animated.View
          style={[
            styles.analyticsBarFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.analyticsValue}>{value}%</Text>
    </View>
  )
}

// Activity Item Component
const ActivityItem: React.FC<{ activity: any }> = ({ activity }) => {
  return (
    <View style={styles.activityItem}>
      <Text style={styles.activityIcon}>🔔</Text>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{activity.description}</Text>
        <Text style={styles.activityTime}>{activity.timestamp}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 16,
  },
  heroContent: {
    gap: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageButton: {
    position: 'relative',
  },
  messageBadge: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusCard: {
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 3,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  connectedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  connectedItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  analyticsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 50,
  },
  analyticsBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  analyticsBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  analyticsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  spacer: {
    height: 40,
  },
})

export default EnhancedHomepage

