import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

interface DebtSummary {
  userId: string
  userName: string
  totalOwed: number
  totalOwing: number
  netAmount: number
}

export default function SettleUpScreen() {
  const [debtSummaries, setDebtSummaries] = useState<DebtSummary[]>([])
  const [unsettledSplits, setUnsettledSplits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchSettlementData()
  }, [])

  const fetchSettlementData = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      // Fetch all unsettled bill splits in the household
      const { data: splits, error } = await supabase
        .from('bill_splits')
        .select(`
          *,
          bills (
            id,
            title,
            household_id,
            paid_by,
            paid_by_user:paid_by (
              id,
              name
            )
          ),
          profiles (
            id,
            name
          )
        `)
        .eq('status', 'owed')
        .eq('bills.household_id', householdMember.household_id)

      if (error) throw error

      setUnsettledSplits(splits || [])
      calculateDebtSummaries(splits || [])
    } catch (error) {
      console.error('Error fetching settlement data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDebtSummaries = (splits: any[]) => {
    const summaryMap = new Map<string, DebtSummary>()

    // Initialize summaries for all users involved
    splits.forEach(split => {
      const userId = split.user_id
      const userName = split.profiles?.name || 'Unknown'
      
      if (!summaryMap.has(userId)) {
        summaryMap.set(userId, {
          userId,
          userName,
          totalOwed: 0,
          totalOwing: 0,
          netAmount: 0,
        })
      }

      // This user owes money
      const summary = summaryMap.get(userId)!
      summary.totalOwing += split.amount

      // The person who paid is owed money
      const paidByUserId = split.bills.paid_by
      const paidByUserName = split.bills.paid_by_user?.name || 'Unknown'
      
      if (!summaryMap.has(paidByUserId)) {
        summaryMap.set(paidByUserId, {
          userId: paidByUserId,
          userName: paidByUserName,
          totalOwed: 0,
          totalOwing: 0,
          netAmount: 0,
        })
      }

      const paidBySummary = summaryMap.get(paidByUserId)!
      paidBySummary.totalOwed += split.amount
    })

    // Calculate net amounts
    const summaries = Array.from(summaryMap.values()).map(summary => ({
      ...summary,
      netAmount: summary.totalOwed - summary.totalOwing,
    }))

    setDebtSummaries(summaries)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchSettlementData()
    setRefreshing(false)
  }

  const handleSettleDebt = async (splitId: string, amount: number, creditorName: string) => {
    Alert.alert(
      'Settle Debt',
      `Mark $${amount.toFixed(2)} as paid to ${creditorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bill_splits')
                .update({
                  status: 'paid',
                  settled_at: new Date().toISOString(),
                })
                .eq('id', splitId)

              if (error) throw error

              Alert.alert('Success', 'Payment marked as settled')
              await fetchSettlementData()
            } catch (error) {
              console.error('Error settling debt:', error)
              Alert.alert('Error', 'Failed to settle payment')
            }
          },
        },
      ]
    )
  }

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toFixed(2)}`
  }

  const getUserSplits = () => {
    return unsettledSplits.filter(split => split.user_id === user?.id)
  }

  const getCreditorSplits = () => {
    return unsettledSplits.filter(split => split.bills.paid_by === user?.id)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settlement data...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settle Up</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {debtSummaries.length > 0 ? (
          <>
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>💰 Balance Summary</Text>
              
              {debtSummaries.map((summary) => (
                <View key={summary.userId} style={styles.summaryCard}>
                  <Text style={styles.summaryName}>{summary.userName}</Text>
                  
                  <View style={styles.summaryAmounts}>
                    {summary.netAmount > 0 ? (
                      <Text style={styles.owedAmount}>
                        Gets back {formatCurrency(summary.netAmount)}
                      </Text>
                    ) : summary.netAmount < 0 ? (
                      <Text style={styles.owingAmount}>
                        Owes {formatCurrency(summary.netAmount)}
                      </Text>
                    ) : (
                      <Text style={styles.evenAmount}>All settled up</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {getUserSplits().length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💸 You Owe</Text>
                
                {getUserSplits().map((split) => (
                  <View key={split.id} style={styles.debtCard}>
                    <View style={styles.debtInfo}>
                      <Text style={styles.billTitle}>{split.bills.title}</Text>
                      <Text style={styles.creditorText}>
                        to {split.bills.paid_by_user?.name}
                      </Text>
                    </View>
                    
                    <View style={styles.debtActions}>
                      <Text style={styles.debtAmount}>
                        {formatCurrency(split.amount)}
                      </Text>
                      <TouchableOpacity
                        style={styles.settleButton}
                        onPress={() => handleSettleDebt(
                          split.id,
                          split.amount,
                          split.bills.paid_by_user?.name
                        )}
                      >
                        <Text style={styles.settleButtonText}>Settle</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {getCreditorSplits().length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Others Owe You</Text>
                
                {getCreditorSplits().map((split) => (
                  <View key={split.id} style={styles.creditCard}>
                    <View style={styles.creditInfo}>
                      <Text style={styles.billTitle}>{split.bills.title}</Text>
                      <Text style={styles.debtorText}>
                        {split.profiles?.name} owes you
                      </Text>
                    </View>
                    
                    <View style={styles.creditActions}>
                      <Text style={styles.creditAmount}>
                        {formatCurrency(split.amount)}
                      </Text>
                      <TouchableOpacity
                        style={styles.markPaidButton}
                        onPress={() => handleSettleDebt(
                          split.id,
                          split.amount,
                          split.profiles?.name
                        )}
                      >
                        <Text style={styles.markPaidButtonText}>Mark Paid</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateTitle}>All Settled Up!</Text>
            <Text style={styles.emptyStateText}>
              No outstanding debts. Everyone is all caught up with their bills.
            </Text>
            
            <TouchableOpacity
              style={styles.addBillButton}
              onPress={() => router.push('/(app)/bills/create')}
            >
              <Text style={styles.addBillButtonText}>Add New Bill</Text>
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
  summarySection: {
    marginBottom: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryAmounts: {
    alignItems: 'flex-end',
  },
  owedAmount: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  owingAmount: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  evenAmount: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  debtCard: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  creditCard: {
    backgroundColor: '#d4edda',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  debtInfo: {
    flex: 1,
  },
  creditInfo: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  creditorText: {
    fontSize: 14,
    color: '#666',
  },
  debtorText: {
    fontSize: 14,
    color: '#666',
  },
  debtActions: {
    alignItems: 'flex-end',
  },
  creditActions: {
    alignItems: 'flex-end',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  creditAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  settleButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  markPaidButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  markPaidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  addBillButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
