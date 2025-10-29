import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Household {
  household_id: string
  household_name: string
  household_type: string
  user_role: string
  invite_code: string
  member_count: number
  is_active: boolean
  joined_at: string
  avatar_url?: string
}

interface HouseholdSwitcherProps {
  currentHousehold?: any
  onHouseholdChange?: (household: any) => void
}

export default function HouseholdSwitcher({ currentHousehold, onHouseholdChange }: HouseholdSwitcherProps) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchHouseholds()
    }
  }, [user])

  const fetchHouseholds = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_user_households', {
          p_user_id: user.id
        })

      if (error) throw error
      setHouseholds(data || [])
    } catch (error) {
      console.error('Error fetching households:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchHousehold = async (household: Household) => {
    if (household.is_active) {
      setShowModal(false)
      return
    }

    setSwitching(true)
    try {
      const { data, error } = await supabase
        .rpc('switch_active_household', {
          p_user_id: user?.id,
          p_household_id: household.household_id
        })

      if (error) throw error

      if (data) {
        setHouseholds(prev => prev.map(h => ({
          ...h,
          is_active: h.household_id === household.household_id
        })))

        if (onHouseholdChange) {
          onHouseholdChange({
            id: household.household_id,
            name: household.household_name,
            type: household.household_type
          })
        }

        setShowModal(false)
        Alert.alert('Success', `Switched to ${household.household_name}`)
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to switch household')
    } finally {
      setSwitching(false)
    }
  }

  const getHouseholdIcon = (type: string) => {
    return type === 'group' ? '👥' : '🏠'
  }

  return (
    <>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.switcherContent}>
          <Text style={styles.switcherText}>
            {currentHousehold?.name || 'Select Household'}
          </Text>
          <Text style={styles.switcherHint}>
            Tap to switch households
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Switch Household</Text>
            <TouchableOpacity onPress={() => {
              setShowModal(false)
              router.push('/(onboarding)/create-join-household')
            }}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {households.map((household) => (
              <TouchableOpacity
                key={household.household_id}
                style={[
                  styles.householdItem,
                  household.is_active && styles.householdItemActive
                ]}
                onPress={() => switchHousehold(household)}
                disabled={switching}
              >
                <View style={styles.householdLeft}>
                  {/* Household Avatar */}
                  <View style={styles.householdAvatar}>
                    {household.avatar_url ? (
                      <Image
                        source={{ uri: household.avatar_url }}
                        style={styles.householdAvatarImage}
                      />
                    ) : (
                      <View style={styles.householdAvatarPlaceholder}>
                        <Text style={styles.householdAvatarIcon}>
                          {getHouseholdIcon(household.household_type)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.householdInfo}>
                    <Text style={[
                      styles.householdName,
                      household.is_active && styles.householdNameActive
                    ]}>
                      {household.household_name}
                    </Text>
                    <Text style={styles.householdMeta}>
                      {household.member_count} member{household.member_count !== 1 ? 's' : ''} • {household.user_role}
                    </Text>
                  </View>
                </View>
                {household.is_active && (
                  <View style={styles.activeIndicatorContainer}>
                    <Text style={styles.activeIndicator}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  switcherButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  switcherContent: {
    flex: 1,
  },
  switcherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  switcherHint: {
    fontSize: 14,
    color: '#64748b',
  },
  switcherArrow: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  addButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
  },
  householdItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  householdItemActive: {
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  householdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  householdAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  householdAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  householdAvatarIcon: {
    fontSize: 24,
  },
  householdIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  householdInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  householdNameActive: {
    color: '#667eea',
  },
  householdMeta: {
    fontSize: 14,
    color: '#64748b',
  },
  activeIndicatorContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeIndicator: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
})
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

  const setAsDefault = async (household: Household) => {
    if (household.is_default) return

    try {
      // Call the database function to set default household
      const { data, error } = await supabase.rpc('set_default_household', {
        household_id: household.id
      })

      if (error) throw error

      if (data) {
        // Update local state
        setHouseholds(prev => prev.map(h => ({
          ...h,
          is_default: h.id === household.id,
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
                    <View style={styles.badgeContainer}>
                      {household.is_default && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                      {household.is_active && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
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

                <View style={styles.householdActions}>
                  {!household.is_active && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => switchHousehold(household)}
                    >
                      <Text style={styles.actionButtonText}>Switch</Text>
                    </TouchableOpacity>
                  )}

                  {!household.is_default && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.defaultButton]}
                      onPress={() => setAsDefault(household)}
                    >
                      <Text style={[styles.actionButtonText, styles.defaultButtonText]}>
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  householdName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
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
  householdActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  defaultButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  defaultButtonText: {
    color: '#667eea',
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
