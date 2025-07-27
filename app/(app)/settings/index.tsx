import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

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
  const { user, signOut } = useAuth()

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
            <View style={styles.headerContent}>
              <Text style={styles.title}>⚙️ Settings</Text>
              <Text style={styles.subtitle}>Manage your account and preferences</Text>
            </View>
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
        <View style={styles.section}>
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
                <Text style={styles.profileHint}>Tap to edit profile</Text>
              </View>
            </View>
            <View style={styles.profileArrow}>
              <View style={styles.arrowContainer}>
                <Text style={styles.settingArrow}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

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

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingSubtitle}>Receive updates via email</Text>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value) => handleNotificationToggle('email', value)}
              trackColor={{ false: '#ddd', true: '#667eea' }}
              thumbColor={notifications.email ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>Get instant alerts on your device</Text>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value) => handleNotificationToggle('push', value)}
              trackColor={{ false: '#ddd', true: '#667eea' }}
              thumbColor={notifications.push ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Task Reminders</Text>
              <Text style={styles.settingSubtitle}>Reminders for due tasks</Text>
            </View>
            <Switch
              value={notifications.taskReminders}
              onValueChange={(value) => handleNotificationToggle('taskReminders', value)}
              trackColor={{ false: '#ddd', true: '#667eea' }}
              thumbColor={notifications.taskReminders ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Bill Alerts</Text>
              <Text style={styles.settingSubtitle}>Notifications for bill payments</Text>
            </View>
            <Switch
              value={notifications.billAlerts}
              onValueChange={(value) => handleNotificationToggle('billAlerts', value)}
              trackColor={{ false: '#ddd', true: '#667eea' }}
              thumbColor={notifications.billAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Subscription</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/(app)/subscription/plans')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Current Plan</Text>
              <Text style={styles.settingSubtitle}>{getSubscriptionStatus()}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

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

        {/* Sign Out Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Sign Out</Text>
              <Text style={styles.settingSubtitle}>Sign out of your account</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionSection}>
          <Text style={styles.versionText}>SplitDuty v1.0.0</Text>
        </View>
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
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
})
