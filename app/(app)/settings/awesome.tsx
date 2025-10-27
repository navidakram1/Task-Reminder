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

export default function AwesomeSettingsScreen() {
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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
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
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Quick Icons */}
            <View style={styles.quickIcons}>
              <QuickIconButton
                icon="document-text"
                onPress={() => router.push('/(app)/household/activity')}
              />
              <QuickIconButton
                icon="star"
                onPress={() => router.push('/(app)/social/achievements')}
              />
              <QuickIconButton
                icon="settings"
                onPress={() => Alert.alert('Settings', 'More options')}
              />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfoSection}>
            <Text style={styles.userName}>{profile?.display_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Menu Grid - 2 Columns */}
        <View style={styles.menuGrid}>
          <MenuCard
            icon="home"
            label="Household"
            onPress={() => router.push('/(app)/household/members')}
          />
          <MenuCard
            icon="notifications"
            label="Notifications"
            onPress={() => Alert.alert('Notifications', 'Coming soon')}
          />
          <MenuCard
            icon="wallet"
            label="Subscription"
            onPress={() => router.push('/(app)/subscription')}
          />
          <MenuCard
            icon="shield-checkmark"
            label="Security"
            onPress={() => Alert.alert('Security', 'Coming soon')}
          />
          <MenuCard
            icon="help-circle"
            label="Help"
            onPress={() => router.push('/(app)/support/help-center')}
          />
          <MenuCard
            icon="information-circle"
            label="About"
            onPress={() => Alert.alert('About', 'SplitDuty v1.0.0')}
          />
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          <SettingRow
            icon="mail"
            label="Email"
            onPress={() => Alert.alert('Email', 'Notification settings')}
          />
          <SettingRow
            icon="lock-closed"
            label="Privacy"
            onPress={() => Alert.alert('Privacy', 'Privacy settings')}
          />
          <SettingRow
            icon="document"
            label="Terms"
            onPress={() => Alert.alert('Terms', 'Terms & Privacy')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  )
}

function QuickIconButton({ icon, onPress }: { icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickIconBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={18} color={APP_THEME.colors.primary} />
    </TouchableOpacity>
  )
}

function MenuCard({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconBg}>
        <Ionicons name={icon as any} size={22} color={APP_THEME.colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function SettingRow({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconBg}>
          <Ionicons name={icon as any} size={16} color={APP_THEME.colors.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
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

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...APP_THEME.shadows.base,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  mainAvatarContainer: {
    position: 'relative',
  },
  mainAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: APP_THEME.colors.primary,
  },
  mainAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: APP_THEME.colors.primary,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: APP_THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  quickIcons: {
    flex: 1,
    gap: 10,
  },
  quickIconBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoSection: {
    marginLeft: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: APP_THEME.colors.textSecondary,
  },

  // Menu Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...APP_THEME.shadows.base,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: APP_THEME.colors.textPrimary,
    textAlign: 'center',
  },

  // Settings List
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...APP_THEME.shadows.base,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: APP_THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_THEME.colors.textPrimary,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.colors.error,
    borderRadius: 12,
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

