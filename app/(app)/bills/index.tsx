import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
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

type FilterType = 'all' | 'unsettled' | 'settled'

export default function BillListScreen() {
  const [bills, setBills] = useState<any[]>([])
  const [filteredBills, setFilteredBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchBills()
  }, [])

  useEffect(() => {
    filterBills()
  }, [bills, filter, searchQuery])

  const fetchBills = async () => {
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

      // Fetch bills
      const { data: billsData, error } = await supabase
        .from('bills')
        .select('*')
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!billsData || billsData.length === 0) {
        setBills([])
        return
      }

      // Get all user IDs from bills
      const userIds = [...new Set(billsData.map(bill => bill.paid_by))]

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds)

      // Fetch bill splits
      const billIds = billsData.map(bill => bill.id)
      const { data: splitsData } = await supabase
        .from('bill_splits')
        .select('*')
        .in('bill_id', billIds)

      // Get split user profiles
      const splitUserIds = [...new Set(splitsData?.map(split => split.user_id) || [])]
      const { data: splitProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', splitUserIds)

      // Combine data
      const enrichedBills = billsData.map(bill => {
        const paidByUser = profiles?.find(p => p.id === bill.paid_by)
        const billSplits = splitsData?.filter(split => split.bill_id === bill.id) || []

        const enrichedSplits = billSplits.map(split => {
          const profile = splitProfiles?.find(p => p.id === split.user_id)
          return {
            ...split,
            profiles: profile
          }
        })

        return {
          ...bill,
          paid_by_user: paidByUser,
          bill_splits: enrichedSplits
        }
      })

      setBills(enrichedBills)
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBills = () => {
    let filtered = bills

    // Apply filter
    switch (filter) {
      case 'unsettled':
        filtered = bills.filter(bill =>
          bill.bill_splits?.some((split: any) => split.status === 'owed')
        )
        break
      case 'settled':
        filtered = bills.filter(bill =>
          bill.bill_splits?.every((split: any) => split.status === 'paid')
        )
        break
      default:
        filtered = bills
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(bill =>
        bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredBills(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBills()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const getBillStatus = (bill: any) => {
    if (!bill.bill_splits || bill.bill_splits.length === 0) {
      return 'No splits'
    }

    const hasUnsettled = bill.bill_splits.some((split: any) => split.status === 'owed')
    return hasUnsettled ? 'Unsettled' : 'Settled'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Settled':
        return '#28a745'
      case 'Unsettled':
        return '#ffc107'
      default:
        return '#6c757d'
    }
  }

  const getUserOwedAmount = (bill: any) => {
    if (!bill.bill_splits) return 0
    
    const userSplit = bill.bill_splits.find((split: any) => 
      split.user_id === user?.id && split.status === 'owed'
    )
    
    return userSplit ? userSplit.amount : 0
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading bills...</Text>
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
              <Text style={styles.title}>💰 Bills & Expenses</Text>
              <Text style={styles.subtitle}>
                {bills.length} bills • {bills.filter(b => b.bill_splits?.some(s => s.status === 'owed')).length} pending
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(app)/bills/create')}
            >
              <Text style={styles.addButtonIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(app)/bills/settle-up')}
        >
          <Text style={styles.quickActionIcon}>🤝</Text>
          <Text style={styles.quickActionText}>Settle Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/(app)/bills/create')}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Add Bill</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bills..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({bills.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'unsettled' && styles.activeFilter]}
          onPress={() => setFilter('unsettled')}
        >
          <Text style={[styles.filterText, filter === 'unsettled' && styles.activeFilterText]}>
            Unsettled ({bills.filter(b => getBillStatus(b) === 'Unsettled').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'settled' && styles.activeFilter]}
          onPress={() => setFilter('settled')}
        >
          <Text style={[styles.filterText, filter === 'settled' && styles.activeFilterText]}>
            Settled ({bills.filter(b => getBillStatus(b) === 'Settled').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.billList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBills.length > 0 ? (
          filteredBills.map((bill) => {
            const status = getBillStatus(bill)
            const userOwed = getUserOwedAmount(bill)
            
            return (
              <TouchableOpacity
                key={bill.id}
                style={styles.billCard}
                onPress={() => router.push(`/(app)/bills/${bill.id}`)}
              >
                <View style={styles.billHeader}>
                  <View style={styles.billInfo}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                    {bill.category && (
                      <Text style={styles.billCategory}>{bill.category}</Text>
                    )}
                  </View>
                  
                  <View style={styles.billAmount}>
                    <Text style={styles.totalAmount}>
                      {formatCurrency(bill.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.billMeta}>
                  <Text style={styles.paidBy}>
                    Paid by {bill.paid_by_user?.name}
                  </Text>
                  <Text style={styles.billDate}>
                    {formatDate(bill.date)}
                  </Text>
                </View>

                {userOwed > 0 && (
                  <View style={styles.userOwedSection}>
                    <Text style={styles.userOwedText}>
                      You owe: {formatCurrency(userOwed)}
                    </Text>
                  </View>
                )}

                {bill.bill_splits && bill.bill_splits.length > 0 && (
                  <View style={styles.splitsPreview}>
                    <Text style={styles.splitsPreviewText}>
                      Split between {bill.bill_splits.length} people
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No bills found</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Add your first bill to start tracking expenses'
                : `No ${filter} bills found`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.createBillButton}
                onPress={() => router.push('/(app)/bills/create')}
              >
                <Text style={styles.createBillButtonText}>Add Bill</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.settleUpButton}
          onPress={() => router.push('/(app)/bills/settle-up')}
        >
          <Text style={styles.settleUpButtonText}>💰 Settle Up</Text>
        </TouchableOpacity>
      </View>
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },

  // Quick Actions Styles
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  quickActionIcon: {
    fontSize: 16,
    color: '#667eea',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilter: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  billList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  billCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  billInfo: {
    flex: 1,
    marginRight: 10,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  billCategory: {
    fontSize: 14,
    color: '#666',
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  billMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paidBy: {
    fontSize: 12,
    color: '#666',
  },
  billDate: {
    fontSize: 12,
    color: '#666',
  },
  userOwedSection: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  userOwedText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    textAlign: 'center',
  },
  splitsPreview: {
    alignItems: 'center',
  },
  splitsPreviewText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 20,
  },
  createBillButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  settleUpButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settleUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
