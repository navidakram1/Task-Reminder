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

interface Proposal {
  id: string
  title: string
  description: string
  type: string
  created_by: string
  status: string
  votes_for: number
  votes_against: number
  total_members: number
  expires_at: string
  created_at: string
  creator_name?: string
  user_vote?: string
}

export default function ProposalsScreen() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) {
        setLoading(false)
        return
      }

      // Fetch all proposals for the household
      const { data: proposalsData, error } = await supabase
        .from('household_proposals')
        .select('*')
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get creator names
      const creatorIds = [...new Set(proposalsData?.map(p => p.created_by) || [])]
      const { data: creators } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', creatorIds)

      // Get user votes for these proposals
      const proposalIds = proposalsData?.map(p => p.id) || []
      const { data: userVotes } = await supabase
        .from('proposal_votes')
        .select('proposal_id, vote')
        .eq('user_id', user.id)
        .in('proposal_id', proposalIds)

      // Combine data
      const allProposals = (proposalsData || []).map(proposal => {
        const creator = creators?.find(c => c.id === proposal.created_by)
        const userVote = userVotes?.find(v => v.proposal_id === proposal.id)

        return {
          ...proposal,
          creator_name: creator?.name || 'Unknown',
          user_vote: userVote?.vote
        }
      })

      setProposals(allProposals)
    } catch (error) {
      console.error('Error fetching proposals:', error)
      Alert.alert('Error', 'Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchProposals()
    setRefreshing(false)
  }

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('proposal_votes')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('user_id', user?.id)
        .single()

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('proposal_votes')
          .update({ vote })
          .eq('id', existingVote.id)

        if (error) throw error
      } else {
        // Insert new vote
        const { error } = await supabase
          .from('proposal_votes')
          .insert({
            proposal_id: proposalId,
            user_id: user?.id,
            vote
          })

        if (error) throw error
      }

      // Update vote counts
      const { data: votes } = await supabase
        .from('proposal_votes')
        .select('vote')
        .eq('proposal_id', proposalId)

      const votesFor = votes?.filter(v => v.vote === 'for').length || 0
      const votesAgainst = votes?.filter(v => v.vote === 'against').length || 0

      await supabase
        .from('household_proposals')
        .update({
          votes_for: votesFor,
          votes_against: votesAgainst
        })
        .eq('id', proposalId)

      Alert.alert('Success', `Your vote has been recorded!`)
      await fetchProposals()
    } catch (error: any) {
      console.error('Error voting:', error)
      Alert.alert('Error', error.message || 'Failed to record vote')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#667eea'
      case 'passed': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🗳️'
      case 'passed': return '✅'
      case 'rejected': return '❌'
      default: return '📋'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rule_change': return '📜'
      case 'member_removal': return '👤'
      case 'household_setting': return '⚙️'
      default: return '💡'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  const getVotePercentage = (votesFor: number, votesAgainst: number) => {
    const total = votesFor + votesAgainst
    if (total === 0) return { forPercent: 0, againstPercent: 0 }
    
    return {
      forPercent: Math.round((votesFor / total) * 100),
      againstPercent: Math.round((votesAgainst / total) * 100)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading proposals...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>🗳️ Proposals</Text>
              <Text style={styles.subtitle}>
                {proposals.filter(p => p.status === 'active').length} active • {proposals.length} total
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(app)/proposals/create')}
            >
              <Text style={styles.addButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {proposals.length > 0 ? (
          proposals.map((proposal) => (
            <TouchableOpacity
              key={proposal.id}
              style={[
                styles.proposalCard,
                { borderLeftColor: getStatusColor(proposal.status) }
              ]}
              onPress={() => router.push(`/(app)/proposals/${proposal.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.proposalHeader}>
                <View style={styles.proposalTitleRow}>
                  <Text style={styles.typeIcon}>{getTypeIcon(proposal.type)}</Text>
                  <View style={styles.proposalTitleContainer}>
                    <Text style={styles.proposalTitle} numberOfLines={2}>
                      {proposal.title}
                    </Text>
                    <Text style={styles.proposalMeta}>
                      by {proposal.creator_name} • {formatTimeRemaining(proposal.expires_at)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(proposal.status) + '20' }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(proposal.status)}</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(proposal.status) }]}>
                    {proposal.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.proposalDescription} numberOfLines={3}>
                {proposal.description}
              </Text>

              {/* Vote Progress */}
              <View style={styles.voteProgress}>
                <View style={styles.voteStats}>
                  <Text style={styles.voteLabel}>
                    👍 {proposal.votes_for} ({getVotePercentage(proposal.votes_for, proposal.votes_against).forPercent}%)
                  </Text>
                  <Text style={styles.voteLabel}>
                    👎 {proposal.votes_against} ({getVotePercentage(proposal.votes_for, proposal.votes_against).againstPercent}%)
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${getVotePercentage(proposal.votes_for, proposal.votes_against).forPercent}%`,
                        backgroundColor: '#10b981'
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Voting Buttons */}
              {proposal.status === 'active' && (
                <View style={styles.votingButtons}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteForButton,
                      proposal.user_vote === 'for' && styles.votedButton
                    ]}
                    onPress={() => handleVote(proposal.id, 'for')}
                  >
                    <Text style={[
                      styles.voteButtonText,
                      proposal.user_vote === 'for' && styles.votedButtonText
                    ]}>
                      👍 {proposal.user_vote === 'for' ? 'Voted For' : 'Vote For'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.voteAgainstButton,
                      proposal.user_vote === 'against' && styles.votedButton
                    ]}
                    onPress={() => handleVote(proposal.id, 'against')}
                  >
                    <Text style={[
                      styles.voteButtonText,
                      proposal.user_vote === 'against' && styles.votedButtonText
                    ]}>
                      👎 {proposal.user_vote === 'against' ? 'Voted Against' : 'Vote Against'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗳️</Text>
            <Text style={styles.emptyStateTitle}>No Proposals Yet</Text>
            <Text style={styles.emptyStateText}>
              Create the first proposal to start democratic decision-making in your household
            </Text>
            <TouchableOpacity
              style={styles.createProposalButton}
              onPress={() => router.push('/(app)/proposals/create')}
            >
              <Text style={styles.createProposalButtonText}>✨ Create First Proposal</Text>
            </TouchableOpacity>
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  proposalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  proposalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  proposalTitleContainer: {
    flex: 1,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 24,
  },
  proposalMeta: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  proposalDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  voteProgress: {
    marginBottom: 16,
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  voteLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  voteForButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  voteAgainstButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  votedButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  votedButtonText: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createProposalButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createProposalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
