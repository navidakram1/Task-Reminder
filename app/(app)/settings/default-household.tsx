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

interface Household {
  id: string
  name: string
  invite_code: string
  role: string
  member_count: number
  is_default: boolean
  joined_at: string
}

export default function DefaultHouseholdScreen() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchHouseholds()
  }, [])

  const fetchHouseholds = async () => {
    if (!user) return

    try {
      // Get user's profile to check default household
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_household_id')
        .eq('id', user.id)
        .single()

      // Get all households user is a member of
      const { data: householdMembers, error } = await supabase
        .from('household_members')
        .select(`
          role,
          joined_at,
          households (
            id,
            name,
            invite_code
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) throw error

      // Get member counts for each household
      const householdsWithCounts = await Promise.all(
        (householdMembers || []).map(async (member: any) => {
          const { count } = await supabase
            .from('household_members')
            .select('*', { count: 'exact', head: true })
            .eq('household_id', member.households.id)

          return {
            id: member.households.id,
            name: member.households.name,
            invite_code: member.households.invite_code,
            role: member.role,
            member_count: count || 0,
            is_default: profile?.default_household_id === member.households.id,
            joined_at: member.joined_at,
          }
        })
      )

      setHouseholds(householdsWithCounts)
    } catch (error) {
      console.error('Error fetching households:', error)
      Alert.alert('Error', 'Failed to load households')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchHouseholds()
    setRefreshing(false)
  }

  const setAsDefault = async (household: Household) => {
    if (household.is_default) return

    try {
      const { data, error } = await supabase.rpc('set_default_household', {
        household_id: household.id
      })

      if (error) throw error

      if (data) {
        // Update local state
        setHouseholds(prev => prev.map(h => ({
          ...h,
          is_default: h.id === household.id
        })))

        Alert.alert('Success', `${household.name} is now your default household`)
      } else {
        Alert.alert('Error', 'Failed to set default household')
      }
    } catch (error) {
      console.error('Error setting default household:', error)
      Alert.alert('Error', 'Failed to set default household')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return '#667eea'
      case 'captain': return '#ffc107'
      case 'member': return '#28a745'
      default: return '#6c757d'
    }
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
        <Text style={styles.loadingText}>Loading households...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Default Household</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🏠 Choose Your Default</Text>
          <Text style={styles.infoDescription}>
            Your default household will load automatically when you open the app. 
            You can still switch between households anytime.
          </Text>
        </View>

        <View style={styles.householdsSection}>
          <Text style={styles.sectionTitle}>Your Households</Text>
          
          {households.map((household) => (
            <TouchableOpacity
              key={household.id}
              style={[
                styles.householdCard,
                household.is_default && styles.defaultHouseholdCard
              ]}
              onPress={() => setAsDefault(household)}
              disabled={household.is_default}
            >
              <View style={styles.householdInfo}>
                <View style={styles.householdHeader}>
                  <Text style={styles.householdName}>{household.name}</Text>
                  {household.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.householdMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleBadgeColor(household.role) }
                    ]}
                  >
                    <Text style={styles.roleText}>
                      {household.role.charAt(0).toUpperCase() + household.role.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.memberCount}>
                    {household.member_count} members
                  </Text>
                  <Text style={styles.joinedDate}>
                    Joined {formatDate(household.joined_at)}
                  </Text>
                </View>
                
                <Text style={styles.inviteCode}>
                  Code: {household.invite_code}
                </Text>
              </View>

              <View style={styles.actionContainer}>
                {household.is_default ? (
                  <View style={styles.currentDefault}>
                    <Text style={styles.currentDefaultText}>✓</Text>
                  </View>
                ) : (
                  <Text style={styles.setDefaultText}>Set Default</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {households.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏠</Text>
            <Text style={styles.emptyStateTitle}>No Households</Text>
            <Text style={styles.emptyStateText}>
              You're not a member of any households yet.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(onboarding)/create-join-household')}
            >
              <Text style={styles.createButtonText}>Create or Join Household</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#f8faff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  householdsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  householdCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  defaultHouseholdCard: {
    borderColor: '#667eea',
    backgroundColor: '#f8faff',
  },
  householdInfo: {
    flex: 1,
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  householdName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  defaultBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  householdMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  joinedDate: {
    fontSize: 12,
    color: '#666',
  },
  inviteCode: {
    fontSize: 12,
    color: '#999',
  },
  actionContainer: {
    marginLeft: 12,
  },
  currentDefault: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDefaultText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  setDefaultText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
})
