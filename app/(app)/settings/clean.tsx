import { APP_THEME } from '@/constants/AppTheme'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface SettingItem {
  id: string
  title: string
  subtitle?: string
  icon: keyof typeof Ionicons.glyphMap
  type: 'navigation' | 'toggle' | 'action'
  value?: boolean
  onPress?: () => void
  onToggle?: (value: boolean) => void
  destructive?: boolean
}

export default function CleanSettingsScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    billAlerts: true,
  })

  useEffect(() => {
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      if (profileData?.notification_preferences) {
        setNotifications(profileData.notification_preferences)
      }

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSubscription(subscriptionData)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const updateNotification = async (key: string, value: boolean) => {
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

  const settingSections = [
    {
      title: 'Personal',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Name, photo, and personal info',
          icon: 'person-outline' as const,
          type: 'navigation' as const,
          onPress: () => router.push('/(app)/profile/edit'),
        },
        {
          id: 'subscription',
          title: subscription?.plan === 'free' ? 'Upgrade to Pro' : 'Manage Subscription',
          subtitle: subscription?.plan === 'free' ? 'Unlock premium features' : `${subscription?.plan} plan`,
          icon: subscription?.plan === 'free' ? 'star-outline' : 'diamond-outline' as const,
          type: 'navigation' as const,
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
          icon: 'mail-outline' as const,
          type: 'toggle' as const,
          value: notifications.email,
          onToggle: (value) => updateNotification('email', value),
        },
        {
          id: 'push',
          title: 'Push Notifications',
          subtitle: 'Get notified on your device',
          icon: 'notifications-outline' as const,
          type: 'toggle' as const,
          value: notifications.push,
          onToggle: (value) => updateNotification('push', value),
        },
        {
          id: 'taskReminders',
          title: 'Task Reminders',
          subtitle: 'Reminders for upcoming tasks',
          icon: 'alarm-outline' as const,
          type: 'toggle' as const,
          value: notifications.taskReminders,
          onToggle: (value) => updateNotification('taskReminders', value),
        },
        {
          id: 'billAlerts',
          title: 'Bill Alerts',
          subtitle: 'Notifications for bills',
          icon: 'wallet-outline' as const,
          type: 'toggle' as const,
          value: notifications.billAlerts,
          onToggle: (value) => updateNotification('billAlerts', value),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'password',
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: 'lock-closed-outline' as const,
          type: 'navigation' as const,
          onPress: () => Alert.alert('Coming Soon', 'Password change feature coming soon'),
        },
        {
          id: 'biometric',
          title: 'Passcode & Face ID',
          subtitle: 'Secure your app',
          icon: 'finger-print' as const,
          type: 'navigation' as const,
          onPress: () => Alert.alert('Coming Soon', 'Biometric security coming soon'),
        },
      ],
    },
    {
      title: 'Feedback',
      items: [
        {
          id: 'feedback',
          title: 'Give us Feedback',
          subtitle: 'Help us improve',
          icon: 'chatbubble-outline' as const,
          type: 'navigation' as const,
          onPress: () => Alert.alert('Feedback', 'Thank you for your interest!'),
        },
        {
          id: 'rate',
          title: 'Rate the App',
          subtitle: 'Share your experience',
          icon: 'star-outline' as const,
          type: 'navigation' as const,
          onPress: () => Alert.alert('Rate App', 'Thank you for your support!'),
        },
      ],
    },
  ]

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={20} color={APP_THEME.colors.textSecondary} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={APP_THEME.components.toggle.trackColor}
            thumbColor={APP_THEME.components.toggle.thumbColor}
            ios_backgroundColor={APP_THEME.components.toggle.trackColor.false}
          />
        </View>
      )
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        activeOpacity={0.6}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={item.icon} 
              size={20} 
              color={item.destructive ? APP_THEME.colors.error : APP_THEME.colors.textSecondary} 
            />
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
        <Ionicons name="chevron-forward" size={20} color={APP_THEME.colors.textTertiary} />
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={APP_THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Profile Card */}
      <TouchableOpacity 
        style={styles.profileCard}
        onPress={() => router.push('/(app)/profile/edit')}
        activeOpacity={0.7}
      >
        <View style={styles.profileImageContainer}>
          {profile?.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={32} color={APP_THEME.colors.textTertiary} />
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'Set your name'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={APP_THEME.colors.textTertiary} />
      </TouchableOpacity>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map(renderSettingItem)}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={APP_THEME.colors.error} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.versionText}>DONE! APP VERSION{'\n'}1.02</Text>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: APP_THEME.spacing.base,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: APP_THEME.spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: APP_THEME.typography.fontSize.xl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: APP_THEME.spacing.base,
    marginBottom: APP_THEME.spacing.lg,
    padding: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.lg,
    ...APP_THEME.shadows.sm,
  },
  profileImageContainer: {
    marginRight: APP_THEME.spacing.md,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: APP_THEME.typography.fontSize.md,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
  section: {
    marginBottom: APP_THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: APP_THEME.typography.fontSize.xs,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: APP_THEME.spacing.base,
    marginBottom: APP_THEME.spacing.sm,
  },
  sectionContent: {
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.lg,
    ...APP_THEME.shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: APP_THEME.spacing.md,
    paddingHorizontal: APP_THEME.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: APP_THEME.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.medium,
    color: APP_THEME.colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
  destructiveText: {
    color: APP_THEME.colors.error,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.colors.surface,
    marginHorizontal: APP_THEME.spacing.base,
    marginTop: APP_THEME.spacing.lg,
    paddingVertical: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.lg,
    ...APP_THEME.shadows.sm,
  },
  logoutText: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.error,
    marginLeft: APP_THEME.spacing.sm,
  },
  versionText: {
    fontSize: APP_THEME.typography.fontSize.xs,
    color: APP_THEME.colors.textTertiary,
    textAlign: 'center',
    marginTop: APP_THEME.spacing.xl,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
})

