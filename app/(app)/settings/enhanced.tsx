import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { APP_THEME } from '@/constants/AppTheme'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function EnhancedSettingsScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [household, setHousehold] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    billAlerts: true,
  })
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))
  const { user, signOut } = useAuth()

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    if (!user) return
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      const { data: householdMember } = await supabase
        .from('household_members')
        .select('role, households(id, name, invite_code)')
        .eq('user_id', user.id)
        .single()

      if (householdMember) {
        setHousehold({
          ...householdMember.households,
          userRole: householdMember.role,
        })
      }

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSubscription(subscriptionData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>👤 Profile</Text>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/(onboarding)/profile-setup')}
            activeOpacity={0.8}
          >
            <View style={styles.profileContent}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profilePlaceholderText}>
                    {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.display_name || 'Set your name'}
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    {subscription?.plan === 'free' ? '🆓 Free' : '⭐ Pro'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={APP_THEME.colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Household Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Household</Text>
          {household ? (
            <View style={styles.householdCard}>
              <View style={styles.householdHeader}>
                <Text style={styles.householdIcon}>🏠</Text>
                <View style={styles.householdInfo}>
                  <Text style={styles.householdName}>{household.name}</Text>
                  <Text style={styles.householdRole}>
                    {household.userRole?.charAt(0).toUpperCase() + household.userRole?.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.householdCode}>
                <Text style={styles.householdCodeLabel}>Invite Code</Text>
                <Text style={styles.householdCodeValue}>{household.invite_code}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => router.push('/(onboarding)/create-join-household')}
            >
              <Text style={styles.emptyCardText}>Create or join a household</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="mail"
              title="Email Notifications"
              subtitle="Receive updates via email"
              value={notifications.email}
              onToggle={(val) => setNotifications({ ...notifications, email: val })}
            />
            <SettingRow
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive push alerts"
              value={notifications.push}
              onToggle={(val) => setNotifications({ ...notifications, push: val })}
            />
            <SettingRow
              icon="checkmark-circle"
              title="Task Reminders"
              subtitle="Remind me about tasks"
              value={notifications.taskReminders}
              onToggle={(val) => setNotifications({ ...notifications, taskReminders: val })}
            />
            <SettingRow
              icon="cash"
              title="Bill Alerts"
              subtitle="Notify about bills"
              value={notifications.billAlerts}
              onToggle={(val) => setNotifications({ ...notifications, billAlerts: val })}
            />
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Subscription</Text>
          <TouchableOpacity
            style={[
              styles.subscriptionCard,
              subscription?.plan === 'free' ? styles.subscriptionFree : styles.subscriptionPro,
            ]}
            onPress={() => router.push('/(app)/subscription')}
            activeOpacity={0.8}
          >
            <View style={styles.subscriptionContent}>
              <Text style={styles.subscriptionIcon}>
                {subscription?.plan === 'free' ? '🆓' : '⭐'}
              </Text>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionPlan}>
                  {subscription?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {subscription?.plan === 'free' ? 'Upgrade to Pro' : 'Active'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Help & Support</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="help-circle"
              title="Help Center"
              onPress={() => router.push('/(app)/support/help-center')}
            />
            <SettingItem
              icon="information-circle"
              title="About"
              onPress={() => Alert.alert('About', 'SplitDuty v1.0.0')}
            />
            <SettingItem
              icon="log-out"
              title="Logout"
              destructive
              onPress={handleLogout}
            />
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  )
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: string
  title: string
  subtitle: string
  value: boolean
  onToggle: (val: boolean) => void
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon as any} size={20} color={APP_THEME.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: APP_THEME.colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}

function SettingItem({
  icon,
  title,
  destructive,
  onPress,
}: {
  icon: string
  title: string
  destructive?: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons
            name={icon as any}
            size={20}
            color={destructive ? APP_THEME.colors.error : APP_THEME.colors.primary}
          />
        </View>
        <Text style={[styles.settingTitle, destructive && { color: APP_THEME.colors.error }]}>
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={APP_THEME.colors.textTertiary} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_THEME.colors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...APP_THEME.shadows.base,
  },
  profileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profilePlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 8,
  },
  profileBadge: {
    backgroundColor: APP_THEME.colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  householdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...APP_THEME.shadows.base,
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  householdIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  householdInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
  },
  householdRole: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
  },
  householdCode: {
    backgroundColor: APP_THEME.colors.background,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: APP_THEME.colors.secondary,
  },
  householdCodeLabel: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    marginBottom: 4,
  },
  householdCodeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...APP_THEME.shadows.base,
  },
  emptyCardText: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...APP_THEME.shadows.base,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },
  subscriptionCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...APP_THEME.shadows.base,
  },
  subscriptionFree: {
    backgroundColor: '#F3F4F6',
  },
  subscriptionPro: {
    backgroundColor: APP_THEME.colors.primary,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
  },
  footer: {
    height: 40,
  },
})

