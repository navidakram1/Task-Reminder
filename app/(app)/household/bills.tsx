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

interface Bill {
  id: string
  title: string
  amount: number
  currency: string
  category: string
  date: string
  paid_by: string
  is_settled: boolean
  profiles: {
    name: string
  }
}

interface DebtSummary {
  user_id: string
  user_name: string
  total_owed: number
  total_owing: number
  net_amount: number
  overdue_amount: number
}

export default function HouseholdBillsScreen() {
  const [bills, setBills] = useState<Bill[]>([])
  const [debtSummary, setDebtSummary] = useState<DebtSummary[]>([])
  const [household, setHousehold] = useState<any>(null)
  const [totalSpending, setTotalSpending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
            admin_id,
            invite_code
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (!householdMember) {
        setLoading(false)
        return
      }

      setHousehold(householdMember.households)

      // Fetch recent bills
      const { data: billsData } = await supabase
        .from('bills')
        .select(`
          *,
          profiles!bills_paid_by_fkey (
            name
          )
        `)
        .eq('household_id', householdMember.household_id)
        .order('date', { ascending: false })
        .limit(20)

      setBills(billsData || [])

      // Calculate total spending this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const total = (billsData || [])
        .filter(bill => new Date(bill.date) >= startOfMonth)
        .reduce((sum, bill) => sum + bill.amount, 0)
      setTotalSpending(total)

      // Fetch debt summary
      const { data: debtData } = await supabase
        .rpc('get_household_debt_summary', {
          p_household_id: householdMember.household_id
        })

      setDebtSummary(debtData || [])

    } catch (error) {
      console.error('Error fetching household bills data:', error)
      Alert.alert('Error', 'Failed to load bills data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Utilities': '⚡',
      'Housing': '🏠',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Healthcare': '🏥',
      'Travel': '✈️'
    }
    return icons[category] || '📋'
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
      {/* Header */}
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
              <Text style={styles.title}>💰 {household?.name} Bills</Text>
              <Text style={styles.subtitle}>Household expenses</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(app)/bills/create')}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
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
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>${totalSpending.toFixed(2)}</Text>
            <Text style={styles.summarySubtext}>Total spending</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Unsettled</Text>
            <Text style={styles.summaryValue}>
              {bills.filter(b => !b.is_settled).length}
            </Text>
            <Text style={styles.summarySubtext}>Bills pending</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(app)/bills/create')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Add Bill</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(app)/bills/settle-up')}
          >
            <Text style={styles.actionIcon}>🤝</Text>
            <Text style={styles.actionText}>Settle Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(app)/bills/analytics')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Debt Summary */}
        {debtSummary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Who Owes What</Text>
            {debtSummary.map((debt) => (
              <View key={debt.user_id} style={styles.debtItem}>
                <View style={styles.debtHeader}>
                  <Text style={styles.debtName}>{debt.user_name}</Text>
                  <Text style={[
                    styles.debtAmount,
                    { color: debt.net_amount >= 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {debt.net_amount >= 0 ? '+' : ''}${Math.abs(debt.net_amount).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.debtDetails}>
                  {debt.net_amount >= 0 
                    ? `Gets back $${debt.total_owing.toFixed(2)}`
                    : `Owes $${debt.total_owed.toFixed(2)}`
                  }
                  {debt.overdue_amount > 0 && (
                    <Text style={{ color: '#ef4444' }}>
                      {' '}• ${debt.overdue_amount.toFixed(2)} overdue
                    </Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Bills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Recent Bills</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/bills')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {bills.length > 0 ? (
            bills.slice(0, 10).map((bill) => (
              <TouchableOpacity
                key={bill.id}
                style={styles.billItem}
                onPress={() => router.push(`/(app)/bills/${bill.id}`)}
              >
                <View style={styles.billLeft}>
                  <Text style={styles.billIcon}>{getCategoryIcon(bill.category)}</Text>
                  <View style={styles.billInfo}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                    <Text style={styles.billMeta}>
                      {bill.profiles?.name} • {formatDate(bill.date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.billRight}>
                  <Text style={styles.billAmount}>
                    ${bill.amount.toFixed(2)}
                  </Text>
                  <View style={[
                    styles.billStatus,
                    { backgroundColor: bill.is_settled ? '#10b981' : '#f59e0b' }
                  ]}>
                    <Text style={styles.billStatusText}>
                      {bill.is_settled ? 'Settled' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💰</Text>
              <Text style={styles.emptyStateTitle}>No Bills Yet</Text>
              <Text style={styles.emptyStateText}>
                Start by adding your first household bill to split expenses with your housemates.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/(app)/bills/create')}
              >
                <Text style={styles.emptyStateButtonText}>Add First Bill</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    marginTop: 12,
  },
  headerContainer: {
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  debtItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  debtDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  billItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  billMeta: {
    fontSize: 14,
    color: '#64748b',
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  billStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  billStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
