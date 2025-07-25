import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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
  type?: 'activity' | 'proposal'
}

interface Proposal {
  id: string
  title: string
  description: string
  type: 'rule_change' | 'member_removal' | 'household_setting' | 'general'
  created_by: string
  created_by_name: string
  status: 'active' | 'passed' | 'rejected'
  votes_for: number
  votes_against: number
  total_members: number
  expires_at: string
  created_at: string
  user_vote?: string
}

export default function HouseholdActivityScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [combinedFeed, setCombinedFeed] = useState<(ActivityItem | Proposal)[]>([])
  const [household, setHousehold] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'activity' | 'proposals'>('all')
  const { user } = useAuth()

  useEffect(() => {
    fetchActivity()
    fetchProposals()
  }, [])

  useEffect(() => {
    // Combine activities and proposals into a single feed
    const combined: (ActivityItem | Proposal)[] = []

    // Add activities
    activities.forEach(activity => {
      combined.push({ ...activity, type: 'activity' })
    })

    // Add proposals as feed items
    proposals.forEach(proposal => {
      combined.push({
        ...proposal,
        type: 'proposal',
        activity_type: 'proposal_created',
        user_name: proposal.created_by_name,
        description: `created proposal "${proposal.title}"`
      })
    })

    // Sort by creation date
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setCombinedFeed(combined)
  }, [activities, proposals])

  const fetchActivity = async () => {
    if (!user) return

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
            invite_code
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (!householdMember) {
        router.push('/(onboarding)/create-join-household')
        return
      }

      setHousehold({
        ...householdMember.households,
        userRole: householdMember.role,
      })

      // Fetch recent activities (simulated from various tables)
      const householdId = householdMember.household_id
      const activities: ActivityItem[] = []

      // Get recent tasks
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          created_by,
          profiles!tasks_created_by_fkey (name)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(10)

      recentTasks?.forEach(task => {
        activities.push({
          id: `task_${task.id}`,
          type: 'task_created',
          user_name: task.profiles?.name || 'Someone',
          user_id: task.created_by,
          description: `created task "${task.title}"`,
          created_at: task.created_at,
          metadata: { task_id: task.id, task_title: task.title }
        })
      })

      // Get recent bills
      const { data: recentBills } = await supabase
        .from('bills')
        .select(`
          id,
          title,
          amount,
          created_at,
          paid_by,
          profiles!bills_paid_by_fkey (name)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(10)

      recentBills?.forEach(bill => {
        activities.push({
          id: `bill_${bill.id}`,
          type: 'bill_added',
          user_name: bill.profiles?.name || 'Someone',
          user_id: bill.paid_by,
          description: `added bill "${bill.title}" for $${bill.amount}`,
          created_at: bill.created_at,
          metadata: { bill_id: bill.id, bill_title: bill.title, amount: bill.amount }
        })
      })

      // Get recent member joins
      const { data: recentMembers } = await supabase
        .from('household_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          profiles!household_members_user_id_fkey (name)
        `)
        .eq('household_id', householdId)
        .order('joined_at', { ascending: false })
        .limit(10)

      recentMembers?.forEach(member => {
        activities.push({
          id: `member_${member.id}`,
          type: 'member_joined',
          user_name: member.profiles?.name || 'Someone',
          user_id: member.user_id,
          description: `joined as ${member.role}`,
          created_at: member.joined_at,
          metadata: { role: member.role }
        })
      })

      // Sort all activities by date
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setActivities(activities.slice(0, 20)) // Show latest 20 activities
    } catch (error) {
      console.error('Error fetching activity:', error)
      Alert.alert('Error', 'Failed to load activity feed')
    } finally {
      setLoading(false)
    }
  }

  const fetchProposals = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      // Fetch proposals
      const { data: proposalsData, error } = await supabase
        .from('household_proposals')
        .select('*')
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Get creator names for proposals
      const creatorIds = [...new Set(proposalsData?.map(p => p.created_by) || [])]
      const { data: creators } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', creatorIds)

      // Get user votes for proposals
      const proposalIds = proposalsData?.map(p => p.id) || []
      const { data: userVotes } = await supabase
        .from('proposal_votes')
        .select('proposal_id, vote')
        .eq('user_id', user.id)
        .in('proposal_id', proposalIds)

      const formattedProposals = (proposalsData || []).map(p => {
        const creator = creators?.find(c => c.id === p.created_by)
        const userVote = userVotes?.find(v => v.proposal_id === p.id)

        return {
          ...p,
          created_by_name: creator?.name || 'Unknown',
          user_vote: userVote?.vote
        }
      })

      setProposals(formattedProposals)
    } catch (error) {
      console.error('Error fetching proposals:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchActivity(), fetchProposals()])
    setRefreshing(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const getActivityIcon = (type: string, proposalType?: string) => {
    switch (type) {
      case 'task_created': return '📋'
      case 'task_completed': return '✅'
      case 'task_approved': return '👍'
      case 'bill_added': return '💰'
      case 'member_joined': return '👋'
      case 'role_changed': return '⭐'
      case 'proposal_created':
        switch (proposalType) {
          case 'rule_change': return '📜'
          case 'member_removal': return '👤'
          case 'household_setting': return '⚙️'
          default: return '🗳️'
        }
      case 'proposal_passed': return '✅'
      case 'proposal_rejected': return '❌'
      default: return '📝'
    }
  }

  const getActivityColor = (type: string, status?: string) => {
    switch (type) {
      case 'task_created': return '#667eea'
      case 'task_completed': return '#28a745'
      case 'task_approved': return '#28a745'
      case 'bill_added': return '#ffc107'
      case 'member_joined': return '#17a2b8'
      case 'role_changed': return '#6f42c1'
      case 'proposal_created':
        switch (status) {
          case 'passed': return '#28a745'
          case 'rejected': return '#dc3545'
          default: return '#667eea'
        }
      case 'proposal_passed': return '#28a745'
      case 'proposal_rejected': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getFilteredFeed = () => {
    switch (activeTab) {
      case 'activity':
        return activities
      case 'proposals':
        return proposals
      default:
        return combinedFeed
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading activity...</Text>
      </View>
    )
  }

  if (!household) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No household found</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(onboarding)/create-join-household')}
        >
          <Text style={styles.createButtonText}>Create or Join Household</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
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
              <Text style={styles.title}>🏠 {household.name}</Text>
              <Text style={styles.subtitle}>Activity & Proposals</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => router.push('/(app)/household/bills')}
              >
                <Text style={styles.headerActionIcon}>💰</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createProposalButton}
                onPress={() => router.push('/(app)/proposals/create')}
              >
                <Text style={styles.createProposalIcon}>🗳️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContainer}
        >
          {[
            { key: 'all', label: 'All', icon: '📋', count: combinedFeed.length },
            { key: 'activity', label: 'Activity', icon: '⚡', count: activities.length },
            { key: 'proposals', label: 'Proposals', icon: '🗳️', count: proposals.length }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.tabBadge,
                activeTab === tab.key && styles.activeTabBadge
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  activeTab === tab.key && styles.activeTabBadgeText
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {getFilteredFeed().length > 0 ? (
          getFilteredFeed().map((item) => {
            const isProposal = 'status' in item

            if (isProposal) {
              const proposal = item as Proposal
              return (
                <TouchableOpacity
                  key={`proposal_${proposal.id}`}
                  style={styles.proposalCard}
                  onPress={() => router.push(`/(app)/proposals/${proposal.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.proposalHeader}>
                    <View style={styles.proposalIconContainer}>
                      <Text style={styles.proposalIcon}>
                        {getActivityIcon('proposal_created', proposal.type)}
                      </Text>
                    </View>
                    <View style={styles.proposalContent}>
                      <View style={styles.proposalTitleRow}>
                        <Text style={styles.proposalTitle} numberOfLines={2}>
                          {proposal.title}
                        </Text>
                        <View style={[
                          styles.proposalStatusBadge,
                          { backgroundColor: getActivityColor('proposal_created', proposal.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.proposalStatusText,
                            { color: getActivityColor('proposal_created', proposal.status) }
                          ]}>
                            {proposal.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.proposalMeta}>
                        by {proposal.created_by_name} • {formatTime(proposal.created_at)}
                      </Text>
                      <Text style={styles.proposalDescription} numberOfLines={2}>
                        {proposal.description}
                      </Text>
                      <View style={styles.proposalVoteInfo}>
                        <Text style={styles.voteCount}>
                          👍 {proposal.votes_for} • 👎 {proposal.votes_against}
                        </Text>
                        {proposal.user_vote && (
                          <Text style={styles.userVoteIndicator}>
                            You voted {proposal.user_vote === 'for' ? '👍' : '👎'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            } else {
              const activity = item as ActivityItem
              return (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: getActivityColor(activity.activity_type) }
                      ]}
                    >
                      <Text style={styles.activityIconText}>
                        {getActivityIcon(activity.activity_type)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityText}>
                        <Text style={styles.userName}>{activity.user_name}</Text>
                        {' '}
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                      </Text>
                      <Text style={styles.activityTime}>{formatTime(activity.created_at)}</Text>
                    </View>
                  </View>
                </View>
              )
            }
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>
              {activeTab === 'proposals' ? '🗳️' : '📝'}
            </Text>
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'proposals' ? 'No proposals yet' : 'No activity yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'proposals'
                ? 'Create the first proposal to start democratic decision-making!'
                : 'Start creating tasks and adding bills to see activity here!'
              }
            </Text>
            {activeTab === 'proposals' && (
              <TouchableOpacity
                style={styles.createFirstProposalButton}
                onPress={() => router.push('/(app)/proposals/create')}
              >
                <Text style={styles.createFirstProposalText}>✨ Create First Proposal</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faff',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8faff',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Enhanced Header Styles
  headerContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    backgroundColor: '#667eea',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerActionIcon: {
    fontSize: 20,
  },
  createProposalButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  createProposalIcon: {
    fontSize: 24,
  },

  // Tab Styles
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  activeTabBadgeText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Activity Item Styles
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityLeft: {
    marginRight: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    marginRight: 8,
  },
  userName: {
    fontWeight: '700',
    color: '#1e293b',
  },
  activityDescription: {
    color: '#64748b',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },

  // Proposal Card Styles
  proposalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  proposalIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  proposalIcon: {
    fontSize: 24,
  },
  proposalContent: {
    flex: 1,
  },
  proposalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  proposalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proposalStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  proposalMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  proposalDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
  },
  proposalVoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  userVoteIndicator: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '700',
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createFirstProposalButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createFirstProposalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
