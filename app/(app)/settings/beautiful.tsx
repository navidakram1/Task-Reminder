import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { APP_THEME } from '@/constants/AppTheme'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function BeautifulSettingsScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()

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
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={APP_THEME.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section with Avatars */}
        <View style={styles.profileSection}>
          {/* Main Avatar */}
          <TouchableOpacity
            style={styles.mainAvatarContainer}
            onPress={() => router.push('/(onboarding)/profile-setup')}
            activeOpacity={0.8}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.mainAvatar} />
            ) : (
              <View style={styles.mainAvatarPlaceholder}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="add" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Quick Action Avatars */}
          <View style={styles.quickAvatars}>
            <QuickAvatar
              icon="document-text"
              label="Activity"
              onPress={() => router.push('/(app)/household/activity')}
            />
            <QuickAvatar
              icon="star"
              label="Rewards"
              onPress={() => router.push('/(app)/social/achievements')}
            />
            <QuickAvatar
              icon="add-circle"
              label="Add"
              onPress={() => Alert.alert('Add', 'Add new member')}
            />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile?.display_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Menu Grid - 3 Columns */}
        <View style={styles.menuGrid}>
          <MenuItem
            icon="home"
            label="Household"
            onPress={() => router.push('/(app)/household/members')}
          />
          <MenuItem
            icon="star"
            label="Watchlist"
            onPress={() => Alert.alert('Watchlist', 'Coming soon')}
          />
          <MenuItem
            icon="settings"
            label="Settings"
            onPress={() => Alert.alert('Settings', 'Coming soon')}
          />
          <MenuItem
            icon="wallet"
            label="Subscription"
            onPress={() => router.push('/(app)/subscription')}
          />
          <MenuItem
            icon="notifications"
            label="Notifications"
            onPress={() => Alert.alert('Notifications', 'Coming soon')}
          />
          <MenuItem
            icon="shield-checkmark"
            label="Security"
            onPress={() => Alert.alert('Security', 'Coming soon')}
          />
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          <SettingItem
            icon="document"
            label="Saved history"
            onPress={() => Alert.alert('History', 'Saved history')}
          />
          <SettingItem
            icon="notifications"
            label="Notifications"
            onPress={() => Alert.alert('Notifications', 'Notification settings')}
          />
          <SettingItem
            icon="lock-closed"
            label="Manage passwords"
            onPress={() => Alert.alert('Passwords', 'Password settings')}
          />
          <SettingItem
            icon="accessibility"
            label="Accessibility"
            onPress={() => Alert.alert('Accessibility', 'Accessibility settings')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  )
}

function QuickAvatar({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.quickAvatarBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickAvatarCircle}>
        <Ionicons name={icon as any} size={20} color={APP_THEME.colors.primary} />
      </View>
      <Text style={styles.quickAvatarLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconBg}>
        <Ionicons name={icon as any} size={20} color={APP_THEME.colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function SettingItem({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.settingIconBg}>
        <Ionicons name={icon as any} size={16} color={APP_THEME.colors.primary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={APP_THEME.colors.textTertiary} />
    </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mainAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: APP_THEME.colors.primary,
  },
  mainAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: APP_THEME.colors.primary,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  quickAvatars: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  quickAvatarBtn: {
    alignItems: 'center',
    gap: 4,
  },
  quickAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_THEME.colors.borderLight,
  },
  quickAvatarLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
  },

  // User Info
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },

  // Menu Grid (3 Columns)
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...APP_THEME.shadows.base,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: APP_THEME.colors.textPrimary,
    textAlign: 'center',
  },

  // Settings List
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    ...APP_THEME.shadows.base,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  settingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_THEME.colors.textPrimary,
    flex: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.colors.error,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    height: 20,
  },
})

