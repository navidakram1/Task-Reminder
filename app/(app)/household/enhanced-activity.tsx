import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface ActivityItem {
  id: string
  user_id: string
  activity_type: string
  description: string
  metadata?: any
  created_at: string
  user_name?: string
}

interface Proposal {
  id: string
  title: string
  description: string
  type: 'rule_change' | 'member_removal' | 'household_setting' | 'other'
  created_by: string
  created_by_name: string
  status: 'active' | 'passed' | 'rejected'
  votes_for: number
  votes_against: number
  total_members: number
  expires_at: string
  created_at: string
}

export default function EnhancedActivityScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [household, setHousehold] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'activity' | 'proposals' | 'settings'>('activity')
  const [showCreateProposal, setShowCreateProposal] = useState(false)
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'other' as const
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          households (
            id,
            name,
            admin_id,
            invite_code
          )
        `)
        .eq('user_id', user?.id)
        .single()

      if (!householdMember) return

      setHousehold(householdMember.households)

      // Fetch activity feed
      const { data: activityData } = await supabase
        .from('household_activity')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })
        .limit(50)

      setActivities(activityData?.map(item => ({
        ...item,
        user_name: item.profiles?.name || 'Unknown User'
      })) || [])

      // Fetch proposals (mock data for now since table might not exist)
      try {
        const { data: proposalsData } = await supabase
          .from('household_proposals')
          .select(`
            *,
            created_by_profile:created_by (
              name
            )
          `)
          .eq('household_id', householdMember.household_id)
          .order('created_at', { ascending: false })

        setProposals(proposalsData?.map(item => ({
          ...item,
          created_by_name: item.created_by_profile?.name || 'Unknown User'
        })) || [])
      } catch (error) {
        // Table might not exist yet, use mock data
        setProposals([])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const createProposal = async () => {
    if (!newProposal.title.trim() || !newProposal.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      // Mock proposal creation for now
      Alert.alert('Success', 'Proposal feature coming soon! This will allow household members to vote on changes.')
      setShowCreateProposal(false)
      setNewProposal({ title: '', description: '', type: 'other' })
    } catch (error) {
      console.error('Error creating proposal:', error)
      Alert.alert('Error', 'Failed to create proposal')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created': return '📋'
      case 'task_completed': return '✅'
      case 'task_transfer_requested': return '🔄'
      case 'task_transfer_accepted': return '✅'
      case 'task_transfer_rejected': return '❌'
      case 'bill_created': return '💰'
      case 'bill_paid': return '💳'
      case 'member_joined': return '👋'
      case 'member_left': return '👋'
      case 'proposal_created': return '🗳️'
      case 'proposal_voted': return '✋'
      default: return '📝'
    }
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
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏠 {household?.name || 'Household'}</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/household/members')}>
          <Text style={styles.membersText}>👥 Members</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            📋 Activity
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'proposals' && styles.activeTab]}
          onPress={() => setActiveTab('proposals')}
        >
          <Text style={[styles.tabText, activeTab === 'proposals' && styles.activeTabText]}>
            🗳️ Proposals
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            ⚙️ Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'activity' && (
        <ScrollView
          style={styles.tabContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activities.length > 0 ? (
            activities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{getActivityIcon(activity.activity_type)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityUser}>{activity.user_name}</Text>
                    <Text style={styles.activityTime}>{formatDate(activity.created_at)}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateTitle}>No Activity Yet</Text>
              <Text style={styles.emptyStateText}>
                Household activity will appear here as members complete tasks and interact.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'proposals' && (
        <ScrollView
          style={styles.tabContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <TouchableOpacity
            style={styles.createProposalButton}
            onPress={() => setShowCreateProposal(true)}
          >
            <Text style={styles.createProposalButtonText}>🗳️ Create New Proposal</Text>
          </TouchableOpacity>

          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗳️</Text>
            <Text style={styles.emptyStateTitle}>Voting System Coming Soon!</Text>
            <Text style={styles.emptyStateText}>
              Soon you'll be able to create proposals and vote on household decisions like:
              {'\n\n'}• Changing household rules
              {'\n'}• Adding or removing members
              {'\n'}• Updating household settings
              {'\n'}• Making group decisions
            </Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'settings' && (
        <ScrollView style={styles.tabContent}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>🏠 Household Settings</Text>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsItemText}>📝 Edit Household Name</Text>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsItemText}>🔗 Invite Code</Text>
              <Text style={styles.settingsItemValue}>{household?.invite_code}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsItemText}>👥 Manage Members</Text>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>⚙️ App Settings</Text>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsItemText}>🔔 Notifications</Text>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem}>
              <Text style={styles.settingsItemText}>🎨 Theme</Text>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>🚨 Danger Zone</Text>
            
            <TouchableOpacity style={[styles.settingsItem, styles.dangerItem]}>
              <Text style={[styles.settingsItemText, styles.dangerText]}>🚪 Leave Household</Text>
              <Text style={styles.settingsItemArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Create Proposal Modal */}
      <Modal
        visible={showCreateProposal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateProposal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Proposal</Text>
            <TouchableOpacity onPress={createProposal}>
              <Text style={styles.modalCreate}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={newProposal.title}
              onChangeText={(text) => setNewProposal(prev => ({ ...prev, title: text }))}
              placeholder="What would you like to propose?"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newProposal.description}
              onChangeText={(text) => setNewProposal(prev => ({ ...prev, description: text }))}
              placeholder="Provide details about your proposal..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeButtons}>
              {[
                { key: 'rule_change', label: '📋 Rule Change' },
                { key: 'household_setting', label: '⚙️ Setting' },
                { key: 'member_removal', label: '👥 Member' },
                { key: 'other', label: '📝 Other' }
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    newProposal.type === type.key && styles.activeTypeButton
                  ]}
                  onPress={() => setNewProposal(prev => ({ ...prev, type: type.key as any }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newProposal.type === type.key && styles.activeTypeButtonText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    backgroundColor: '#f8faff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0fe',
  },
  backText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  membersText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#667eea',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityUser: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  createProposalButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createProposalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingsItemValue: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  settingsItemArrow: {
    fontSize: 16,
    color: '#999',
  },
  dangerItem: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  dangerText: {
    color: '#dc3545',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCancel: {
    fontSize: 16,
    color: '#999',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCreate: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeTypeButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
})
