import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

export default function HouseholdMembersScreen() {
  const [members, setMembers] = useState<any[]>([])
  const [household, setHousehold] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchHouseholdMembers()
  }, [])

  const fetchHouseholdMembers = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: userHousehold, error: householdError } = await supabase
        .from('household_members')
        .select(`
          household_id,
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

      if (householdError) {
        console.error('Error fetching user household:', householdError)
        return
      }

      setHousehold({
        ...userHousehold.households,
        userRole: userHousehold.role,
      })

      // Get all household members
      const { data: householdMembers, error: membersError } = await supabase
        .from('household_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles (
            id,
            name,
            email,
            photo_url
          )
        `)
        .eq('household_id', userHousehold.household_id)
        .order('joined_at', { ascending: true })

      if (membersError) {
        console.error('Error fetching members:', membersError)
        return
      }

      setMembers(householdMembers || [])
    } catch (error) {
      console.error('Error in fetchHouseholdMembers:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchHouseholdMembers()
    setRefreshing(false)
  }

  const handleRemoveMember = async (memberId: string, memberName: string, memberRole: string) => {
    if (!household || (household.userRole !== 'admin' && household.userRole !== 'captain')) {
      Alert.alert('Error', 'Only admins and captains can remove members')
      return
    }

    // Captains cannot remove admins
    if (household.userRole === 'captain' && memberRole === 'admin') {
      Alert.alert('Error', 'Captains cannot remove admins')
      return
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('household_members')
                .delete()
                .eq('id', memberId)

              if (error) throw error

              Alert.alert('Success', `${memberName} has been removed from the household`)
              await fetchHouseholdMembers()
            } catch (error) {
              console.error('Error removing member:', error)
              Alert.alert('Error', 'Failed to remove member')
            }
          },
        },
      ]
    )
  }

  const handleChangeRole = async (memberId: string, memberName: string, currentRole: string) => {
    if (!household || (household.userRole !== 'admin' && household.userRole !== 'captain')) {
      Alert.alert('Error', 'Only admins and captains can change member roles')
      return
    }

    // Captains cannot change admin roles or promote to admin
    if (household.userRole === 'captain' && (currentRole === 'admin')) {
      Alert.alert('Error', 'Captains cannot change admin roles')
      return
    }

    let roleOptions = [
      { label: 'Cancel', value: null, style: 'cancel' },
      { label: 'Make Member', value: 'member' },
      { label: 'Make Captain', value: 'captain' },
      { label: 'Make Admin', value: 'admin' },
    ].filter(option => option.value !== currentRole && option.value !== null)

    // Captains cannot promote to admin
    if (household.userRole === 'captain') {
      roleOptions = roleOptions.filter(option => option.value !== 'admin')
    }

    Alert.alert(
      'Change Role',
      `Change ${memberName}'s role from ${currentRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...roleOptions.map(option => ({
          text: option.label,
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('household_members')
                .update({ role: option.value })
                .eq('id', memberId)

              if (error) throw error

              Alert.alert('Success', `${memberName} is now a ${option.value}`)
              await fetchHouseholdMembers()
            } catch (error) {
              console.error('Error updating member role:', error)
              Alert.alert('Error', 'Failed to update member role')
            }
          },
        })),
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading members...</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Household Members</Text>
        <TouchableOpacity onPress={() => router.push('/(onboarding)/invite-members')}>
          <Text style={styles.inviteText}>+ Invite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.householdInfo}>
          <Text style={styles.householdName}>{household.name}</Text>
          <Text style={styles.memberCount}>{members.length} members</Text>
          <Text style={styles.inviteCode}>Invite Code: {household.invite_code}</Text>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Members</Text>
          
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.profiles?.name || member.profiles?.email || 'Unknown User'}
                  </Text>
                  <Text style={styles.memberEmail}>{member.profiles?.email}</Text>
                  <Text style={styles.memberJoined}>
                    Joined {formatDate(member.joined_at)}
                  </Text>
                </View>
                
                <View style={styles.memberRole}>
                  <View
                    style={[
                      styles.roleBadge,
                      member.role === 'admin' && styles.adminBadge,
                      member.role === 'captain' && styles.captainBadge,
                      member.role === 'member' && styles.memberBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        (member.role === 'admin' || member.role === 'captain' || member.role === 'member') && styles.roleTextWhite,
                      ]}
                    >
                      {member.role}
                    </Text>
                  </View>
                </View>
              </View>

              {(household.userRole === 'admin' || household.userRole === 'captain') && member.user_id !== user?.id && (
                <View style={styles.memberActions}>
                  {/* Show change role button if user can change this member's role */}
                  {(household.userRole === 'admin' || (household.userRole === 'captain' && member.role !== 'admin')) && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleChangeRole(member.id, member.profiles?.name, member.role)}
                    >
                      <Text style={styles.actionButtonText}>Change Role</Text>
                    </TouchableOpacity>
                  )}

                  {/* Show remove button if user can remove this member */}
                  {(household.userRole === 'admin' || (household.userRole === 'captain' && member.role !== 'admin')) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => handleRemoveMember(member.id, member.profiles?.name, member.role)}
                    >
                      <Text style={[styles.actionButtonText, styles.removeButtonText]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => router.push('/(onboarding)/invite-members')}
          >
            <Text style={styles.inviteButtonText}>📧 Invite More Members</Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inviteText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  householdInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
  },
  householdName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  membersSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  memberCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberJoined: {
    fontSize: 12,
    color: '#999',
  },
  memberRole: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#667eea',
  },
  captainBadge: {
    backgroundColor: '#ffc107',
  },
  memberBadge: {
    backgroundColor: '#28a745',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  roleTextWhite: {
    color: '#fff',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButtonText: {
    color: '#fff',
  },
  actionsSection: {
    marginTop: 20,
  },
  inviteButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
