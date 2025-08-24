import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
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
    View
} from 'react-native'
import { BRAND_COLORS } from '../../../constants/Brand'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

const { width } = Dimensions.get('window')

export default function SettingsScreen() {
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
  const [slideAnim] = useState(new Animated.Value(50))
  const { user, signOut } = useAuth()

  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      if (profileData?.notification_preferences) {
        setNotifications(profileData.notification_preferences)
      }

      // Fetch household info
      const { data: householdMember } = await supabase
        .from('household_members')
        .select(`
          role,
          households (
            id,
            name,
            invite_code,
            admin_id
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (householdMember) {
        setHousehold({
          ...householdMember.households,
          userRole: householdMember.role,
        })
      }

      // Fetch subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setSubscription(subscriptionData)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationPreferences = async (newPreferences: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      setNotifications(newPreferences)
    } catch (error) {
      console.error('Error updating preferences:', error)
      Alert.alert('Error', 'Failed to update notification preferences')
    }
  }

  const handleNotificationToggle = (key: string, value: boolean) => {
    const newPreferences = { ...notifications, [key]: value }
    updateNotificationPreferences(newPreferences)
  }

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      `Are you sure you want to leave "${household?.name}"? You will lose access to all shared tasks and bills.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('household_members')
                .delete()
                .eq('user_id', user?.id)
                .eq('household_id', household?.id)

              if (error) throw error

              Alert.alert('Left Household', 'You have left the household successfully')
              setHousehold(null)
            } catch (error) {
              console.error('Error leaving household:', error)
              Alert.alert('Error', 'Failed to leave household')
            }
          },
        },
      ]
    )
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
          onPress: async () => {
            try {
              await signOut()
              router.replace('/(auth)/landing')
            } catch (error) {
              console.error('Error signing out:', error)
              Alert.alert('Error', 'Failed to sign out')
            }
          },
        },
      ]
    )
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return 'Free'
    
    if (subscription.plan === 'lifetime') return 'Lifetime'
    if (subscription.plan === 'monthly') {
      const expiresAt = new Date(subscription.expires_at)
      const now = new Date()
      return expiresAt > now ? 'Monthly (Active)' : 'Monthly (Expired)'
    }
    
    return subscription.plan
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
      {/* Modern Gradient Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.backgroundGradient}
      >
        {/* Header Section */}
        <View style={styles.modernHeader}>
          <TouchableOpacity
            style={styles.modernBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.modernBackIcon}>←</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.profileSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Profile Card */}
            <BlurView intensity={20} style={styles.profileCard}>
              <View style={styles.profileContent}>
                <View style={styles.avatarContainer}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {(profile?.name || user?.email || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.statusIndicator} />
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {profile?.name || user?.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {user?.email}
                  </Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planText}>
                      {subscription?.plan === 'free' ? '🆓 Free Plan' : '⭐ Premium'}
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </View>

        {/* Modern Content Section */}
        <ScrollView
          style={styles.modernContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quick Actions Grid */}
          <BlurView intensity={15} style={styles.modernSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.modernSectionTitle}>⚡ Quick Actions</Text>
              <Text style={styles.modernSectionSubtitle}>Frequently used features</Text>
            </View>

            <View style={styles.modernQuickActions}>
              <TouchableOpacity
                style={styles.modernActionCard}
                onPress={() => router.push('/(app)/household/activity')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>📋</Text>
                  <Text style={styles.actionTitle}>Activity</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modernActionCard}
                onPress={() => router.push('/(app)/social/referrals')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🎁</Text>
                  <Text style={styles.actionTitle}>Referrals</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modernActionCard}
                onPress={() => router.push('/(app)/social/achievements')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🏆</Text>
                  <Text style={styles.actionTitle}>Achievements</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modernActionCard}
                onPress={() => router.push('/(app)/support/help-center')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#43e97b', '#38f9d7']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionTitle}>Help</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Account Settings */}
          <BlurView intensity={15} style={styles.modernSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.modernSectionTitle}>👤 Account</Text>
              <Text style={styles.modernSectionSubtitle}>Manage your profile and preferences</Text>
            </View>

            <View style={styles.modernSettingsList}>
              <TouchableOpacity
                style={styles.modernSettingItem}
                onPress={() => router.push('/(onboarding)/profile-setup')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.settingIconGradient}
                  >
                    <Text style={styles.settingIcon}>👤</Text>
                  </LinearGradient>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Edit Profile</Text>
                  <Text style={styles.settingSubtitle}>Name, photo, and personal info</Text>
                </View>
                <Text style={styles.modernArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modernSettingItem}
                onPress={() => router.push('/(app)/subscription/plans')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconContainer}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={styles.settingIconGradient}
                  >
                    <Text style={styles.settingIcon}>⭐</Text>
                  </LinearGradient>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Subscription</Text>
                  <Text style={styles.settingSubtitle}>
                    {subscription?.plan === 'free' ? 'Upgrade to Premium' : 'Manage Premium plan'}
                  </Text>
                </View>
                <View style={styles.planBadgeSmall}>
                  <Text style={styles.planBadgeText}>
                    {subscription?.plan === 'free' ? 'FREE' : 'PRO'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Household Management */}
          <BlurView intensity={15} style={styles.modernSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.modernSectionTitle}>🏠 Household</Text>
              <Text style={styles.modernSectionSubtitle}>Manage your household settings</Text>
            </View>

            {household ? (
              <>
                {/* Current Household Card */}
                <View style={styles.currentHouseholdCard}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.householdGradient}
                  >
                    <View style={styles.householdCardContent}>
                      <Text style={styles.householdCardIcon}>🏠</Text>
                      <View style={styles.householdCardInfo}>
                        <Text style={styles.householdCardName}>{household.name}</Text>
                        <View style={styles.householdCardMeta}>
                          <View style={styles.modernRoleBadge}>
                            <Text style={styles.modernRoleText}>
                              {household.userRole?.charAt(0).toUpperCase() + household.userRole?.slice(1)}
                            </Text>
                          </View>
                          <Text style={styles.householdCardCode}>#{household.invite_code}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Household Settings */}
                <View style={styles.modernSettingsList}>
                  <TouchableOpacity
                    style={styles.modernSettingItem}
                    onPress={() => router.push('/(app)/settings/default-household')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingIconContainer}>
                      <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        style={styles.settingIconGradient}
                      >
                        <Text style={styles.settingIcon}>🏠</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Default Household</Text>
                      <Text style={styles.settingSubtitle}>Choose startup household</Text>
                    </View>
                    <Text style={styles.modernArrow}>›</Text>
                  </TouchableOpacity>

                  {(household.userRole === 'admin' || household.userRole === 'captain') && (
                    <TouchableOpacity
                      style={styles.modernSettingItem}
                      onPress={() => router.push('/(app)/household/members')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.settingIconContainer}>
                        <LinearGradient
                          colors={['#43e97b', '#38f9d7']}
                          style={styles.settingIconGradient}
                        >
                          <Text style={styles.settingIcon}>👥</Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>Manage Members</Text>
                        <Text style={styles.settingSubtitle}>
                          {household.userRole === 'admin'
                            ? 'View and manage household members'
                            : 'View and manage members (except admins)'}
                        </Text>
                      </View>
                      <Text style={styles.modernArrow}>›</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.modernSettingItem}
                    onPress={() => router.push('/(onboarding)/invite-members')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingIconContainer}>
                      <LinearGradient
                        colors={['#f093fb', '#f5576c']}
                        style={styles.settingIconGradient}
                      >
                        <Text style={styles.settingIcon}>📧</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>Invite Members</Text>
                      <Text style={styles.settingSubtitle}>Add more people to your household</Text>
                    </View>
                    <Text style={styles.modernArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modernSettingItem, styles.dangerItem]}
                    onPress={handleLeaveHousehold}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingIconContainer}>
                      <LinearGradient
                        colors={['#ff6b6b', '#ee5a52']}
                        style={styles.settingIconGradient}
                      >
                        <Text style={styles.settingIcon}>🚪</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={[styles.settingTitle, styles.dangerText]}>Leave Household</Text>
                      <Text style={styles.settingSubtitle}>Remove yourself from this household</Text>
                    </View>
                    <Text style={styles.modernArrow}>›</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={styles.modernSettingItem}
                onPress={() => router.push('/(onboarding)/create-join-household')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.settingIconGradient}
                  >
                    <Text style={styles.settingIcon}>🏠</Text>
                  </LinearGradient>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Join or Create Household</Text>
                  <Text style={styles.settingSubtitle}>Get started with shared tasks and bills</Text>
                </View>
                <Text style={styles.modernArrow}>›</Text>
              </TouchableOpacity>
            )}
          </BlurView>

          {/* Notifications */}
          <BlurView intensity={15} style={styles.modernSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.modernSectionTitle}>🔔 Notifications</Text>
              <Text style={styles.modernSectionSubtitle}>Customize your alerts and reminders</Text>
            </View>

            <View style={styles.modernNotificationsList}>
              <View style={styles.modernNotificationItem}>
                <View style={styles.notificationIconContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.notificationIconGradient}
                  >
                    <Text style={styles.notificationIcon}>📧</Text>
                  </LinearGradient>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Email Notifications</Text>
                  <Text style={styles.notificationSubtitle}>Receive updates via email</Text>
                </View>
                <Switch
                  value={notifications.email}
                  onValueChange={(value) => handleNotificationToggle('email', value)}
                  trackColor={{ false: '#e5e7eb', true: '#667eea' }}
                  thumbColor={notifications.email ? '#fff' : '#f9fafb'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>

              <View style={styles.modernNotificationItem}>
                <View style={styles.notificationIconContainer}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={styles.notificationIconGradient}
                  >
                    <Text style={styles.notificationIcon}>📱</Text>
                  </LinearGradient>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Push Notifications</Text>
                  <Text style={styles.notificationSubtitle}>Get instant alerts on your device</Text>
                </View>
                <Switch
                  value={notifications.push}
                  onValueChange={(value) => handleNotificationToggle('push', value)}
                  trackColor={{ false: '#e5e7eb', true: '#f093fb' }}
                  thumbColor={notifications.push ? '#fff' : '#f9fafb'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>

              <View style={styles.modernNotificationItem}>
                <View style={styles.notificationIconContainer}>
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    style={styles.notificationIconGradient}
                  >
                    <Text style={styles.notificationIcon}>⏰</Text>
                  </LinearGradient>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Task Reminders</Text>
                  <Text style={styles.notificationSubtitle}>Reminders for due tasks</Text>
                </View>
                <Switch
                  value={notifications.taskReminders}
                  onValueChange={(value) => handleNotificationToggle('taskReminders', value)}
                  trackColor={{ false: '#e5e7eb', true: '#4facfe' }}
                  thumbColor={notifications.taskReminders ? '#fff' : '#f9fafb'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>

              <View style={styles.modernNotificationItem}>
                <View style={styles.notificationIconContainer}>
                  <LinearGradient
                    colors={['#43e97b', '#38f9d7']}
                    style={styles.notificationIconGradient}
                  >
                    <Text style={styles.notificationIcon}>💰</Text>
                  </LinearGradient>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Bill Alerts</Text>
                  <Text style={styles.notificationSubtitle}>Notifications for bill payments</Text>
                </View>
                <Switch
                  value={notifications.billAlerts}
                  onValueChange={(value) => handleNotificationToggle('billAlerts', value)}
                  trackColor={{ false: '#e5e7eb', true: '#43e97b' }}
                  thumbColor={notifications.billAlerts ? '#fff' : '#f9fafb'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>
            </View>
          </BlurView>

          {/* Logout Section */}
          <BlurView intensity={15} style={styles.modernSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ee5a52']}
                style={styles.logoutGradient}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </LinearGradient>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  // Modern Design Styles
  backgroundGradient: {
    flex: 1,
  },
  modernHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernBackIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  profileSection: {
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  modernContent: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modernSection: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  sectionHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  modernSectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Quick Actions Styles
  modernQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  modernActionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Settings List Styles
  modernSettingsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dangerItem: {
    borderBottomColor: 'rgba(255, 107, 107, 0.2)',
  },
  settingIconContainer: {
    marginRight: 16,
  },
  settingIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modernArrow: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 'bold',
  },
  dangerText: {
    color: '#ff6b6b',
  },
  planBadgeSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  planBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Household Styles
  currentHouseholdCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  householdGradient: {
    padding: 20,
  },
  householdCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  householdCardIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  householdCardInfo: {
    flex: 1,
  },
  householdCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  householdCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernRoleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 12,
  },
  modernRoleText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  householdCardCode: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Notifications Styles
  modernNotificationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernNotificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationIconContainer: {
    marginRight: 16,
  },
  notificationIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Logout Styles
  logoutButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingArrow: {
    fontSize: 18,
    color: '#ccc',
    marginLeft: 10,
  },
  dangerText: {
    color: '#dc3545',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  // Quick Actions Styles
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  quickActionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  // Enhanced Profile Card Styles
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileContainer: {
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
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profilePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  profileHint: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  profileBadge: {
    backgroundColor: (BRAND_COLORS?.PRIMARY || '#4F46E5') + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS?.PRIMARY || '#4F46E5',
  },
  profileArrow: {
    marginLeft: 12,
  },
  // Enhanced Household Card Styles
  householdCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  householdIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  householdIconText: {
    fontSize: 20,
  },
  householdName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  householdMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  inviteCode: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Enhanced Notification Styles
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 68,
  },
  // Enhanced Subscription Styles
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  subscriptionCardPro: {
    borderColor: BRAND_COLORS?.PRIMARY || '#4F46E5',
    backgroundColor: (BRAND_COLORS?.PRIMARY || '#4F46E5') + '05',
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: (BRAND_COLORS?.PRIMARY || '#4F46E5') + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subscriptionEmoji: {
    fontSize: 24,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  upgradeHint: {
    backgroundColor: (BRAND_COLORS?.ACCENT || '#F59E0B') + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  upgradeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS?.ACCENT || '#F59E0B',
  },
  subscriptionArrow: {
    marginLeft: 12,
  },
  // Enhanced Logout Styles
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutEmoji: {
    fontSize: 24,
  },
  logoutInfo: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  logoutSubtitle: {
    fontSize: 14,
    color: '#991b1b',
  },
  // Enhanced Version Styles
  versionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
})
