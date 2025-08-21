import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

const { width, height } = Dimensions.get('window')

interface SettingItem {
  id: string
  title: string
  subtitle?: string
  icon: string
  type: 'toggle' | 'navigation' | 'action'
  value?: boolean
  onPress?: () => void
  onToggle?: (value: boolean) => void
  color?: string
  destructive?: boolean
}

export default function ModernSettingsScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    billAlerts: true,
  })
  const [loading, setLoading] = useState(true)
  const [scrollY] = useState(new Animated.Value(0))
  const { user, signOut } = useAuth()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setNotifications(profileData.notification_preferences || notifications)
      }

      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single()

      setSubscription(subData)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationSetting = async (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)

    try {
      await supabase
        .from('profiles')
        .update({ notification_preferences: newNotifications })
        .eq('id', user?.id)
    } catch (error) {
      console.error('Error updating notifications:', error)
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    )
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const profileScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  })

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Name, photo, and personal info',
          icon: '👤',
          type: 'navigation',
          onPress: () => router.push('/(app)/profile/edit'),
        },
        {
          id: 'subscription',
          title: subscription?.plan === 'free' ? 'Upgrade to Pro' : 'Manage Subscription',
          subtitle: subscription?.plan === 'free' ? 'Unlock premium features' : `${subscription?.plan} plan`,
          icon: subscription?.plan === 'free' ? '⭐' : '👑',
          type: 'navigation',
          color: subscription?.plan === 'free' ? '#f59e0b' : '#8b5cf6',
          onPress: () => router.push('/(app)/subscription/plans'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'email',
          title: 'Email Notifications',
          subtitle: 'Receive updates via email',
          icon: '📧',
          type: 'toggle',
          value: notifications.email,
          onToggle: (value) => updateNotificationSetting('email', value),
        },
        {
          id: 'push',
          title: 'Push Notifications',
          subtitle: 'Get notified on your device',
          icon: '🔔',
          type: 'toggle',
          value: notifications.push,
          onToggle: (value) => updateNotificationSetting('push', value),
        },
        {
          id: 'taskReminders',
          title: 'Task Reminders',
          subtitle: 'Alerts for upcoming tasks',
          icon: '📋',
          type: 'toggle',
          value: notifications.taskReminders,
          onToggle: (value) => updateNotificationSetting('taskReminders', value),
        },
        {
          id: 'billAlerts',
          title: 'Bill Alerts',
          subtitle: 'Notifications for bills and payments',
          icon: '💰',
          type: 'toggle',
          value: notifications.billAlerts,
          onToggle: (value) => updateNotificationSetting('billAlerts', value),
        },
      ],
    },
    {
      title: 'Household',
      items: [
        {
          id: 'household',
          title: 'Household Settings',
          subtitle: 'Manage members and preferences',
          icon: '🏠',
          type: 'navigation',
          onPress: () => router.push('/(app)/household/settings'),
        },
        {
          id: 'members',
          title: 'Household Members',
          subtitle: 'View and manage members',
          icon: '👥',
          type: 'navigation',
          onPress: () => router.push('/(app)/household/members'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          icon: '❓',
          type: 'navigation',
          onPress: () => router.push('/(app)/help'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: '💬',
          type: 'navigation',
          onPress: () => router.push('/(app)/feedback'),
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'How we protect your data',
          icon: '🔒',
          type: 'navigation',
          onPress: () => router.push('/(app)/privacy'),
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'signout',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          icon: '🚪',
          type: 'action',
          destructive: true,
          onPress: handleSignOut,
        },
      ],
    },
  ]

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        item.destructive && styles.destructiveItem
      ]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: item.color || '#f3f4f6' }
        ]}>
          <Text style={styles.settingIcon}>{item.icon}</Text>
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            item.destructive && styles.destructiveText
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor={item.value ? '#ffffff' : '#f9fafb'}
            ios_backgroundColor="#e5e7eb"
          />
        )}
        {item.type === 'navigation' && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <Text style={styles.headerTitle}>Settings</Text>
        </BlurView>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <Animated.View style={[styles.profileHeader, { transform: [{ scale: profileScale }] }]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileContent}>
              <Image
                source={{
                  uri: profile?.photo_url || 'https://via.placeholder.com/80'
                }}
                style={styles.profileImage}
              />
              <Text style={styles.profileName}>
                {profile?.name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {profile?.email || user?.email}
              </Text>
              {subscription && (
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionText}>
                    {subscription.plan === 'free' ? '🆓 Free' : 
                     subscription.plan === 'monthly' ? '⭐ Pro' : '👑 Lifetime'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Settings Sections */}
        <View style={styles.sectionsContainer}>
          {settingSections.map((section, index) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map(renderSettingItem)}
              </View>
            </View>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>SplitDuty v1.0.0</Text>
          <Text style={styles.copyrightText}>Made with ❤️ for better households</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  headerBlur: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  profileGradient: {
    padding: 32,
  },
  profileContent: {
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  destructiveItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  destructiveText: {
    color: '#ef4444',
  },
  settingRight: {
    marginLeft: 16,
  },
  chevron: {
    fontSize: 20,
    color: '#d1d5db',
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
  },
})
