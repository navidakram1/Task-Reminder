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
import { BRAND_COLORS, BRAND_NAME } from '../../../constants/Brand'
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
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.headerContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.title}>⚙️ Settings</Text>
              <Text style={styles.subtitle}>Manage your {BRAND_NAME || 'SplitDuty'} experience</Text>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {household ? '1' : '0'}
                  </Text>
                  <Text style={styles.statLabel}>Household</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {subscription?.plan === 'free' ? 'Free' : 'Pro'}
                  </Text>
                  <Text style={styles.statLabel}>Plan</Text>
                </View>
              </View>
            </Animated.View>
            <View style={styles.placeholder} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionPrimary]}
              onPress={() => router.push('/(app)/household/activity')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>📋</Text>
              </View>
              <Text style={styles.quickActionText}>Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionSecondary]}
              onPress={() => router.push('/(app)/household/members')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>👥</Text>
              </View>
              <Text style={styles.quickActionText}>Members</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionTertiary]}
              onPress={() => router.push('/(onboarding)/invite-members')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>📧</Text>
              </View>
              <Text style={styles.quickActionText}>Invite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickActionQuaternary]}
              onPress={() => router.push('/(app)/subscription/plans')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Text style={styles.quickActionIcon}>⭐</Text>
              </View>
              <Text style={styles.quickActionText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Profile Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>👤 Profile</Text>

          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/(onboarding)/profile-setup')}
            activeOpacity={0.8}
          >
            <View style={styles.profileContainer}>
              {profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profilePlaceholderText}>
                    {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.name || 'Set your name'}
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>
                    {subscription?.plan === 'free' ? '🆓 Free User' : '⭐ Pro User'}
                  </Text>
                </View>
                <Text style={styles.profileHint}>Tap to edit profile</Text>
              </View>
            </View>
            <View style={styles.profileArrow}>
              <View style={styles.arrowContainer}>
                <Text style={styles.settingArrow}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Household Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Household</Text>

          {/* HouseholdSwitcher temporarily disabled */}

          {household ? (
            <>
              <View style={styles.householdCard}>
                <View style={styles.householdHeader}>
                  <View style={styles.householdIcon}>
                    <Text style={styles.householdIconText}>🏠</Text>
                  </View>
                  <View style={styles.householdInfo}>
                    <Text style={styles.householdName}>{household.name}</Text>
                    <View style={styles.householdMeta}>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                          {household.userRole?.charAt(0).toUpperCase() + household.userRole?.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.inviteCode}>Code: {household.invite_code}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => router.push('/(app)/settings/default-household')}
                activeOpacity={0.8}
              >
                <View style={styles.settingIconContainer}>
                  <Text style={styles.settingIcon}>🏠</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Default Household</Text>
                  <Text style={styles.settingSubtitle}>Choose which household loads on startup</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.settingArrow}>›</Text>
                </View>
              </TouchableOpacity>

              {(household.userRole === 'admin' || household.userRole === 'captain') && (
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => router.push('/(app)/household/members')}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Manage Members</Text>
                    <Text style={styles.settingSubtitle}>
                      {household.userRole === 'admin'
                        ? 'View and manage household members'
                        : 'View and manage members (except admins)'}
                    </Text>
                  </View>
                  <Text style={styles.settingArrow}>›</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => router.push('/(onboarding)/invite-members')}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Invite Members</Text>
                  <Text style={styles.settingSubtitle}>Add more people to your household</Text>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingRow} onPress={handleLeaveHousehold}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, styles.dangerText]}>Leave Household</Text>
                  <Text style={styles.settingSubtitle}>Remove yourself from this household</Text>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/(onboarding)/create-join-household')}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Join or Create Household</Text>
                <Text style={styles.settingSubtitle}>Get started with shared tasks and bills</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Enhanced Notifications Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>

          <View style={styles.notificationCard}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>📧</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive updates via email</Text>
              </View>
              <Switch
                value={notifications.email}
                onValueChange={(value) => handleNotificationToggle('email', value)}
                trackColor={{ false: '#e5e7eb', true: BRAND_COLORS?.PRIMARY || '#4F46E5' }}
                thumbColor={notifications.email ? '#fff' : '#f9fafb'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>

            <View style={styles.notificationDivider} />

            <View style={styles.notificationRow}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>📱</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Get instant alerts on your device</Text>
              </View>
              <Switch
                value={notifications.push}
                onValueChange={(value) => handleNotificationToggle('push', value)}
                trackColor={{ false: '#e5e7eb', true: BRAND_COLORS?.PRIMARY || '#4F46E5' }}
                thumbColor={notifications.push ? '#fff' : '#f9fafb'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>

            <View style={styles.notificationDivider} />

            <View style={styles.notificationRow}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>⏰</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Task Reminders</Text>
                <Text style={styles.settingSubtitle}>Reminders for due tasks</Text>
              </View>
              <Switch
                value={notifications.taskReminders}
                onValueChange={(value) => handleNotificationToggle('taskReminders', value)}
                trackColor={{ false: '#e5e7eb', true: BRAND_COLORS?.SECONDARY || '#06B6D4' }}
                thumbColor={notifications.taskReminders ? '#fff' : '#f9fafb'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>

            <View style={styles.notificationDivider} />

            <View style={styles.notificationRow}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>💰</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Bill Alerts</Text>
                <Text style={styles.settingSubtitle}>Notifications for bill payments</Text>
              </View>
              <Switch
                value={notifications.billAlerts}
                onValueChange={(value) => handleNotificationToggle('billAlerts', value)}
                trackColor={{ false: '#e5e7eb', true: BRAND_COLORS?.ACCENT || '#F59E0B' }}
                thumbColor={notifications.billAlerts ? '#fff' : '#f9fafb'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Subscription Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>💎 Subscription</Text>

          <TouchableOpacity
            style={[
              styles.subscriptionCard,
              subscription?.plan !== 'free' && styles.subscriptionCardPro
            ]}
            onPress={() => router.push('/(app)/subscription/plans')}
            activeOpacity={0.8}
          >
            <View style={styles.subscriptionContent}>
              <View style={styles.subscriptionIcon}>
                <Text style={styles.subscriptionEmoji}>
                  {subscription?.plan === 'free' ? '🆓' : '⭐'}
                </Text>
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTitle}>
                  {subscription?.plan === 'free' ? 'Free Plan' : 'SplitDuty Pro'}
                </Text>
                <Text style={styles.subscriptionSubtitle}>
                  {getSubscriptionStatus()}
                </Text>
                {subscription?.plan === 'free' && (
                  <View style={styles.upgradeHint}>
                    <Text style={styles.upgradeText}>Tap to upgrade</Text>
                  </View>
                )}
              </View>
              <View style={styles.subscriptionArrow}>
                <Text style={styles.settingArrow}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Support</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Help & FAQ</Text>
              <Text style={styles.settingSubtitle}>Get answers to common questions</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Contact Support</Text>
              <Text style={styles.settingSubtitle}>Get help from our team</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingSubtitle}>How we protect your data</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Terms of Service</Text>
              <Text style={styles.settingSubtitle}>Our terms and conditions</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Sign Out Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutIcon}>
                <Text style={styles.logoutEmoji}>🚪</Text>
              </View>
              <View style={styles.logoutInfo}>
                <Text style={styles.logoutTitle}>Sign Out</Text>
                <Text style={styles.logoutSubtitle}>Sign out of your {BRAND_NAME || 'SplitDuty'} account</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Version Section */}
        <Animated.View
          style={[
            styles.versionSection,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <View style={styles.versionCard}>
            <Text style={styles.versionText}>{BRAND_NAME || 'SplitDuty'} v1.0.0</Text>
            <Text style={styles.versionSubtext}>Share Life, Split Smart</Text>
          </View>
        </Animated.View>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    backgroundColor: BRAND_COLORS?.PRIMARY || '#4F46E5',
  },
  backText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND_COLORS?.PRIMARY || '#4F46E5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS?.PRIMARY || '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
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
