import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

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

      // Fetch bills with splits
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          paid_by_user:paid_by (
            id,
            name
          ),
          bill_splits (
            id,
            user_id,
            amount,
            status,
            settled_at,
            profiles (
              id,
              name
            )
          )
        `)
        .eq('household_id', householdMember.household_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBills(data || [])
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
      <View style={styles.header}>
        <Text style={styles.title}>Bills</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(app)/bills/create')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
