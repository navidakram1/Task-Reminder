import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Household {
  id: string
  name: string
  invite_code: string
  role: string
  member_count: number
  is_active: boolean
}

interface HouseholdSwitcherProps {
  currentHousehold?: any
  onHouseholdChange?: (household: any) => void
}

export default function HouseholdSwitcher({ currentHousehold, onHouseholdChange }: HouseholdSwitcherProps) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchUserHouseholds()
  }, [])

  const fetchUserHouseholds = async () => {
    if (!user) return

    try {
      // Get all households user is a member of
      const { data: householdMembers, error } = await supabase
        .from('household_members')
        .select(`
          role,
          households (
            id,
            name,
            invite_code
          )
        `)
        .eq('user_id', user.id)

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
            is_active: currentHousehold?.id === member.households.id,
          }
        })
      )

      setHouseholds(householdsWithCounts)
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  const switchHousehold = async (household: Household) => {
    if (household.is_active) {
      setShowModal(false)
      return
    }

    setLoading(true)
    try {
      // Call the database function to switch active household
      const { data, error } = await supabase.rpc('switch_active_household', {
        new_household_id: household.id
      })

      if (error) throw error

      if (data) {
        // Update local state
        setHouseholds(prev => prev.map(h => ({
          ...h,
          is_active: h.id === household.id
        })))

        // Notify parent component
        if (onHouseholdChange) {
          onHouseholdChange({
            id: household.id,
            name: household.name,
            invite_code: household.invite_code,
            userRole: household.role,
          })
        }

        Alert.alert('Success', `Switched to ${household.name}`)
        setShowModal(false)
      } else {
        Alert.alert('Error', 'Failed to switch household')
      }
    } catch (error) {
      console.error('Error switching household:', error)
      Alert.alert('Error', 'Failed to switch household')
    } finally {
      setLoading(false)
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

  if (households.length <= 1) {
    return null // Don't show switcher if user only has one household
  }

  return (
    <>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.switcherContent}>
          <Text style={styles.switcherText}>
            {currentHousehold?.name || 'Select Household'}
          </Text>
          <Text style={styles.switcherHint}>
            {households.length} households • Tap to switch
          </Text>
        </View>
        <Text style={styles.switcherArrow}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Switch Household</Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/create-join-household')}>
              <Text style={styles.addText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {households.map((household) => (
              <TouchableOpacity
                key={household.id}
                style={[
                  styles.householdOption,
                  household.is_active && styles.activeHousehold
                ]}
                onPress={() => switchHousehold(household)}
                disabled={loading}
              >
                <View style={styles.householdInfo}>
                  <View style={styles.householdHeader}>
                    <Text style={styles.householdName}>{household.name}</Text>
                    {household.is_active && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
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
                    <Text style={styles.inviteCode}>
                      Code: {household.invite_code}
                    </Text>
                  </View>
                </View>

                {!household.is_active && (
                  <Text style={styles.switchText}>Switch</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.createHouseholdButton}
              onPress={() => {
                setShowModal(false)
                router.push('/(onboarding)/create-join-household')
              }}
            >
              <Text style={styles.createHouseholdIcon}>+</Text>
              <View style={styles.createHouseholdInfo}>
                <Text style={styles.createHouseholdTitle}>Create New Household</Text>
                <Text style={styles.createHouseholdSubtitle}>Start a new shared space</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  switcherButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  switcherContent: {
    flex: 1,
  },
  switcherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  switcherHint: {
    fontSize: 12,
    color: '#666',
  },
  switcherArrow: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
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
  cancelText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  householdOption: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeHousehold: {
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
  activeBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  householdMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  inviteCode: {
    fontSize: 12,
    color: '#666',
  },
  switchText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  createHouseholdButton: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  createHouseholdIcon: {
    fontSize: 24,
    color: '#667eea',
    marginRight: 16,
    fontWeight: 'bold',
  },
  createHouseholdInfo: {
    flex: 1,
  },
  createHouseholdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  createHouseholdSubtitle: {
    fontSize: 14,
    color: '#666',
  },
})
