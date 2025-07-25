import { router, useLocalSearchParams } from 'expo-router'
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

interface ProposalDetails {
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
  votes?: Array<{
    user_id: string
    vote: string
    created_at: string
    user_name: string
  }>
}

export default function ProposalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [proposal, setProposal] = useState<ProposalDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchProposalDetails()
    }
  }, [id])

  const fetchProposalDetails = async () => {
    if (!user || !id) return

    try {
      // Fetch proposal details
      const { data: proposalData, error: proposalError } = await supabase
        .from('household_proposals')
        .select(`
          *,
          profiles!created_by(name)
        `)
        .eq('id', id)
        .single()

      if (proposalError) throw proposalError

      // Fetch all votes for this proposal
      const { data: votesData, error: votesError } = await supabase
        .from('proposal_votes')
        .select(`
          user_id,
          vote,
          created_at,
          profiles(name)
        `)
        .eq('proposal_id', id)
        .order('created_at', { ascending: false })

      if (votesError) throw votesError

      // Find user's vote
      const userVote = votesData?.find(v => v.user_id === user.id)

      setProposal({
        ...proposalData,
        creator_name: proposalData.profiles?.name || 'Unknown',
        user_vote: userVote?.vote,
        votes: votesData?.map(v => ({
          user_id: v.user_id,
          vote: v.vote,
          created_at: v.created_at,
          user_name: v.profiles?.name || 'Unknown'
        })) || []
      })
    } catch (error) {
      console.error('Error fetching proposal details:', error)
      Alert.alert('Error', 'Failed to load proposal details')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchProposalDetails()
    setRefreshing(false)
  }

  const handleVote = async (vote: 'for' | 'against') => {
    if (!proposal) return

    try {
      const { error } = await supabase.rpc('vote_on_proposal', {
        p_proposal_id: proposal.id,
        p_vote: vote
      })

      if (error) throw error

      Alert.alert('Success', `Your vote has been recorded!`)
      await fetchProposalDetails()
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
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
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
        <Text style={styles.loadingText}>Loading proposal...</Text>
      </View>
    )
  }

  if (!proposal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Proposal not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerGradient, { backgroundColor: getStatusColor(proposal.status) }]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Proposal Details</Text>
            </View>
            <View style={styles.placeholder} />
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
        {/* Proposal Header */}
        <View style={styles.proposalHeader}>
          <View style={styles.proposalTitleRow}>
            <Text style={styles.typeIcon}>{getTypeIcon(proposal.type)}</Text>
            <View style={styles.proposalTitleContainer}>
              <Text style={styles.proposalTitle}>{proposal.title}</Text>
              <Text style={styles.proposalMeta}>
                by {proposal.creator_name} • {new Date(proposal.created_at).toLocaleDateString()}
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

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Description</Text>
          <Text style={styles.description}>{proposal.description}</Text>
        </View>

        {/* Voting Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Voting Progress</Text>
          <View style={styles.voteStats}>
            <View style={styles.voteStatItem}>
              <Text style={styles.voteStatNumber}>{proposal.votes_for}</Text>
              <Text style={styles.voteStatLabel}>👍 For ({getVotePercentage(proposal.votes_for, proposal.votes_against).forPercent}%)</Text>
            </View>
            <View style={styles.voteStatItem}>
              <Text style={styles.voteStatNumber}>{proposal.votes_against}</Text>
              <Text style={styles.voteStatLabel}>👎 Against ({getVotePercentage(proposal.votes_for, proposal.votes_against).againstPercent}%)</Text>
            </View>
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
          <Text style={styles.timeRemaining}>
            ⏰ {formatTimeRemaining(proposal.expires_at)}
          </Text>
        </View>

        {/* Voting Buttons */}
        {proposal.status === 'active' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗳️ Cast Your Vote</Text>
            <View style={styles.votingButtons}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  styles.voteForButton,
                  proposal.user_vote === 'for' && styles.votedButton
                ]}
                onPress={() => handleVote('for')}
              >
                <Text style={[
                  styles.voteButtonText,
                  proposal.user_vote === 'for' && styles.votedButtonText
                ]}>
                  👍 {proposal.user_vote === 'for' ? 'You Voted For' : 'Vote For'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  styles.voteAgainstButton,
                  proposal.user_vote === 'against' && styles.votedButton
                ]}
                onPress={() => handleVote('against')}
              >
                <Text style={[
                  styles.voteButtonText,
                  proposal.user_vote === 'against' && styles.votedButtonText
                ]}>
                  👎 {proposal.user_vote === 'against' ? 'You Voted Against' : 'Vote Against'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Vote History */}
        {proposal.votes && proposal.votes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Vote History</Text>
            {proposal.votes.map((vote, index) => (
              <View key={index} style={styles.voteHistoryItem}>
                <Text style={styles.voteHistoryIcon}>
                  {vote.vote === 'for' ? '👍' : '👎'}
                </Text>
                <View style={styles.voteHistoryContent}>
                  <Text style={styles.voteHistoryName}>{vote.user_name}</Text>
                  <Text style={styles.voteHistoryTime}>
                    {new Date(vote.created_at).toLocaleDateString()} at {new Date(vote.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={[
                  styles.voteHistoryBadge,
                  { color: vote.vote === 'for' ? '#10b981' : '#ef4444' }
                ]}>
                  {vote.vote === 'for' ? 'For' : 'Against'}
                </Text>
              </View>
            ))}
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
    backgroundColor: '#f8faff',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  proposalHeader: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  proposalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 16,
    marginTop: 4,
  },
  proposalTitleContainer: {
    flex: 1,
  },
  proposalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 32,
  },
  proposalMeta: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    fontWeight: '500',
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  voteStatItem: {
    alignItems: 'center',
  },
  voteStatNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  voteStatLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeRemaining: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  votedButtonText: {
    color: '#fff',
  },
  voteHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  voteHistoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  voteHistoryContent: {
    flex: 1,
  },
  voteHistoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  voteHistoryTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  voteHistoryBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
})
