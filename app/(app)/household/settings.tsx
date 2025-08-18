import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface HouseholdSettings {
  id: string
  name: string
  description: string | null
  type: 'household' | 'group'
  settings: {
    allowMemberInvites: boolean
    requireTaskApproval: boolean
    autoAssignTasks: boolean
    billReminderDays: number
    taskReminderHours: number
    allowAnonymousVoting: boolean
    requireProposalApproval: boolean
  }
  admin_id: string
  invite_code: string
}

export default function HouseholdSettingsScreen() {
  const [household, setHousehold] = useState<HouseholdSettings | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchHouseholdSettings()
  }, [])

  const fetchHouseholdSettings = async () => {
    try {
      // Get user's household and role
      const { data: householdMember } = await supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          households (
            id,
            name,
            description,
            type,
            settings,
            admin_id,
            invite_code
          )
        `)
        .eq('user_id', user?.id)
        .single()

      if (!householdMember) {
        Alert.alert('Error', 'No household found')
        return
      }

      setUserRole(householdMember.role)
      
      // Set default settings if none exist
      const defaultSettings = {
        allowMemberInvites: true,
        requireTaskApproval: false,
        autoAssignTasks: false,
        billReminderDays: 3,
        taskReminderHours: 24,
        allowAnonymousVoting: false,
        requireProposalApproval: true,
      }

      setHousehold({
        ...householdMember.households,
        settings: householdMember.households.settings || defaultSettings,
      })
    } catch (error) {
      console.error('Error fetching household settings:', error)
      Alert.alert('Error', 'Failed to load household settings')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchHouseholdSettings()
  }

  const updateHouseholdInfo = async (field: string, value: string) => {
    if (userRole !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can modify household information')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('households')
        .update({ [field]: value })
        .eq('id', household?.id)

      if (error) throw error

      setHousehold(prev => prev ? { ...prev, [field]: value } : null)
      Alert.alert('Success', 'Household information updated')
    } catch (error) {
      console.error('Error updating household:', error)
      Alert.alert('Error', 'Failed to update household information')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = async (settingKey: string, value: any) => {
    if (userRole !== 'admin' && userRole !== 'captain') {
      Alert.alert('Permission Denied', 'Only admins and captains can modify settings')
      return
    }

    try {
      setSaving(true)
      const newSettings = { ...household?.settings, [settingKey]: value }
      
      const { error } = await supabase
        .from('households')
        .update({ settings: newSettings })
        .eq('id', household?.id)

      if (error) throw error

      setHousehold(prev => prev ? { ...prev, settings: newSettings } : null)
    } catch (error) {
      console.error('Error updating setting:', error)
      Alert.alert('Error', 'Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  const regenerateInviteCode = async () => {
    if (userRole !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can regenerate invite codes')
      return
    }

    Alert.alert(
      'Regenerate Invite Code',
      'This will invalidate the current invite code. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)
              const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
              
              const { error } = await supabase
                .from('households')
                .update({ invite_code: newCode })
                .eq('id', household?.id)

              if (error) throw error

              setHousehold(prev => prev ? { ...prev, invite_code: newCode } : null)
              Alert.alert('Success', `New invite code: ${newCode}`)
            } catch (error) {
              console.error('Error regenerating invite code:', error)
              Alert.alert('Error', 'Failed to regenerate invite code')
            } finally {
              setSaving(false)
            }
          }
        }
      ]
    )
  }

  const deleteHousehold = async () => {
    if (userRole !== 'admin') {
      Alert.alert('Permission Denied', 'Only admins can delete households')
      return
    }

    Alert.alert(
      'Delete Household',
      'This action cannot be undone. All tasks, bills, and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)
              const { error } = await supabase
                .from('households')
                .delete()
                .eq('id', household?.id)

              if (error) throw error

              Alert.alert('Household Deleted', 'The household has been permanently deleted')
              router.replace('/(onboarding)/create-join-household')
            } catch (error) {
              console.error('Error deleting household:', error)
              Alert.alert('Error', 'Failed to delete household')
            } finally {
              setSaving(false)
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    )
  }

  if (!household) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No household found</Text>
      </View>
    )
  }

  const canModifyInfo = userRole === 'admin'
  const canModifySettings = userRole === 'admin' || userRole === 'captain'

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Household Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Household Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Household Information</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Name</Text>
          <TextInput
            style={[styles.textInput, !canModifyInfo && styles.disabledInput]}
            value={household.name}
            onChangeText={(value) => canModifyInfo && updateHouseholdInfo('name', value)}
            editable={canModifyInfo}
            placeholder="Household name"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, !canModifyInfo && styles.disabledInput]}
            value={household.description || ''}
            onChangeText={(value) => canModifyInfo && updateHouseholdInfo('description', value)}
            editable={canModifyInfo}
            placeholder="Optional description"
            multiline
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Invite Code</Text>
          <View style={styles.inviteCodeRow}>
            <Text style={styles.inviteCode}>{household.invite_code}</Text>
            {canModifyInfo && (
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={regenerateInviteCode}
                disabled={saving}
              >
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Task Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Task Settings</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Require Task Approval</Text>
            <Text style={styles.switchDescription}>Tasks must be approved when marked complete</Text>
          </View>
          <Switch
            value={household.settings.requireTaskApproval}
            onValueChange={(value) => canModifySettings && updateSetting('requireTaskApproval', value)}
            disabled={!canModifySettings}
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor={household.settings.requireTaskApproval ? '#fff' : '#f9fafb'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto-assign Tasks</Text>
            <Text style={styles.switchDescription}>Automatically assign tasks to members fairly</Text>
          </View>
          <Switch
            value={household.settings.autoAssignTasks}
            onValueChange={(value) => canModifySettings && updateSetting('autoAssignTasks', value)}
            disabled={!canModifySettings}
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor={household.settings.autoAssignTasks ? '#fff' : '#f9fafb'}
          />
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notification Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Task Reminder (hours before due)</Text>
          <TextInput
            style={[styles.numberInput, !canModifySettings && styles.disabledInput]}
            value={household.settings.taskReminderHours.toString()}
            onChangeText={(value) => canModifySettings && updateSetting('taskReminderHours', parseInt(value) || 24)}
            editable={canModifySettings}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Bill Reminder (days before due)</Text>
          <TextInput
            style={[styles.numberInput, !canModifySettings && styles.disabledInput]}
            value={household.settings.billReminderDays.toString()}
            onChangeText={(value) => canModifySettings && updateSetting('billReminderDays', parseInt(value) || 3)}
            editable={canModifySettings}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Member Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Member Settings</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Allow Member Invites</Text>
            <Text style={styles.switchDescription}>Members can invite new people to the household</Text>
          </View>
          <Switch
            value={household.settings.allowMemberInvites}
            onValueChange={(value) => canModifySettings && updateSetting('allowMemberInvites', value)}
            disabled={!canModifySettings}
            trackColor={{ false: '#e5e7eb', true: '#667eea' }}
            thumbColor={household.settings.allowMemberInvites ? '#fff' : '#f9fafb'}
          />
        </View>
      </View>

      {/* Danger Zone */}
      {userRole === 'admin' && (
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={deleteHousehold}
            disabled={saving}
          >
            <Text style={styles.dangerButtonText}>Delete Household</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Your role: {userRole}</Text>
        <Text style={styles.footerText}>
          {canModifySettings ? 'You can modify settings' : 'Settings are read-only for your role'}
        </Text>
      </View>
    </ScrollView>
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
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backText: {
    fontSize: 16,
    color: '#667eea',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  settingRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  numberInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    width: 80,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
    flex: 1,
  },
  regenerateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dangerSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 20,
    borderTopWidth: 2,
    borderTopColor: '#dc3545',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
})
