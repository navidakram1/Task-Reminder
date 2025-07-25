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
    Modal
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface OptimizedSettlement {
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  from_user_name?: string
  to_user_name?: string
}

interface DebtSummary {
  user_id: string
  user_name: string
  total_owed: number
  total_owing: number
  net_amount: number
  partially_paid: number
  overdue_amount: number
}

interface PaymentMethod {
  type: 'venmo' | 'paypal' | 'zelle' | 'bank_transfer' | 'cash'
  identifier: string
  display_name: string
}

export default function OptimizedSettleScreen() {
  const [settlements, setSettlements] = useState<OptimizedSettlement[]>([])
  const [debtSummary, setDebtSummary] = useState<DebtSummary[]>([])
  const [originalTransactions, setOriginalTransactions] = useState(0)
  const [optimizedTransactions, setOptimizedTransactions] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<OptimizedSettlement | null>(null)
  const [paymentMethods] = useState<PaymentMethod[]>([
    { type: 'venmo', identifier: '@username', display_name: 'Venmo' },
    { type: 'paypal', identifier: 'email@example.com', display_name: 'PayPal' },
    { type: 'zelle', identifier: 'phone/email', display_name: 'Zelle' },
    { type: 'bank_transfer', identifier: 'Account details', display_name: 'Bank Transfer' },
    { type: 'cash', identifier: 'In person', display_name: 'Cash' }
  ])
  
  const { user } = useAuth()

  useEffect(() => {
    fetchOptimizedSettlements()
  }, [])

  const fetchOptimizedSettlements = async () => {
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

      // Get debt summary first
      const { data: debtData, error: debtError } = await supabase
        .rpc('get_household_debt_summary', {
          p_household_id: householdMember.household_id
        })

      if (debtError) throw debtError
      setDebtSummary(debtData || [])

      // Calculate original number of transactions (all non-zero debts)
      const originalCount = (debtData || []).filter(d => Math.abs(d.net_amount) > 0.01).length
      setOriginalTransactions(originalCount)

      // Calculate total debt in the system
      const totalSystemDebt = (debtData || [])
        .filter(d => d.net_amount < 0)
        .reduce((sum, d) => sum + Math.abs(d.net_amount), 0)
      setTotalDebt(totalSystemDebt)

      // Get optimized settlements
      const { data: settlementsData, error: settlementsError } = await supabase
        .rpc('optimize_settlements', {
          p_household_id: householdMember.household_id
        })

      if (settlementsError) throw settlementsError

      // Enrich settlements with user names
      if (settlementsData && settlementsData.length > 0) {
        const userIds = [
          ...new Set([
            ...settlementsData.map(s => s.from_user_id),
            ...settlementsData.map(s => s.to_user_id)
          ])
        ]

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)

        const enrichedSettlements = settlementsData.map(settlement => {
          const fromUser = profiles?.find(p => p.id === settlement.from_user_id)
          const toUser = profiles?.find(p => p.id === settlement.to_user_id)
          
          return {
            ...settlement,
            from_user_name: fromUser?.name || 'Unknown',
            to_user_name: toUser?.name || 'Unknown'
          }
        })

        setSettlements(enrichedSettlements)
        setOptimizedTransactions(enrichedSettlements.length)
      } else {
        setSettlements([])
        setOptimizedTransactions(0)
      }

    } catch (error) {
      console.error('Error fetching optimized settlements:', error)
      Alert.alert('Error', 'Failed to load settlement optimization')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchOptimizedSettlements()
    setRefreshing(false)
  }

  const handleSettlePayment = (settlement: OptimizedSettlement) => {
    setSelectedSettlement(settlement)
    setShowPaymentModal(true)
  }

  const confirmPayment = async (paymentMethod: PaymentMethod) => {
    if (!selectedSettlement) return

    try {
      // Find all bill splits that need to be settled for this payment
      const { data: splits } = await supabase
        .from('bill_splits')
        .select('id, amount, bill_id')
        .eq('user_id', selectedSettlement.from_user_id)
        .eq('status', 'owed')
        .order('created_at')

      if (!splits || splits.length === 0) {
        Alert.alert('Error', 'No outstanding debts found')
        return
      }

      let remainingAmount = selectedSettlement.amount
      const splitsToUpdate = []

      // Allocate payment across splits
      for (const split of splits) {
        if (remainingAmount <= 0) break

        const paymentForThisSplit = Math.min(remainingAmount, split.amount)
        splitsToUpdate.push({
          id: split.id,
          payment_amount: paymentForThisSplit,
          new_status: paymentForThisSplit >= split.amount ? 'paid' : 'partially_paid'
        })
        remainingAmount -= paymentForThisSplit
      }

      // Update splits
      for (const splitUpdate of splitsToUpdate) {
        await supabase
          .from('bill_splits')
          .update({
            paid_amount: splitUpdate.payment_amount,
            status: splitUpdate.new_status,
            payment_method: paymentMethod.type,
            settled_at: splitUpdate.new_status === 'paid' ? new Date().toISOString() : null
          })
          .eq('id', splitUpdate.id)
      }

      // Create payment confirmation
      await supabase
        .from('payment_confirmations')
        .insert({
          split_id: splitsToUpdate[0].id, // Reference first split
          amount: selectedSettlement.amount,
          payment_method: paymentMethod.type,
          confirmed_by: user?.id,
          notes: `Optimized settlement: ${selectedSettlement.from_user_name} → ${selectedSettlement.to_user_name}`
        })

      // Send notification to recipient
      await supabase
        .from('bill_notifications')
        .insert({
          user_id: selectedSettlement.to_user_id,
          type: 'payment_received',
          title: 'Payment Received',
          message: `${selectedSettlement.from_user_name} paid you $${selectedSettlement.amount.toFixed(2)} via ${paymentMethod.display_name}`,
          scheduled_for: new Date().toISOString()
        })

      setShowPaymentModal(false)
      setSelectedSettlement(null)
      
      Alert.alert(
        'Payment Confirmed',
        `Payment of $${selectedSettlement.amount.toFixed(2)} has been recorded`,
        [{ text: 'OK', onPress: () => fetchOptimizedSettlements() }]
      )

    } catch (error: any) {
      console.error('Error confirming payment:', error)
      Alert.alert('Error', error.message || 'Failed to confirm payment')
    }
  }

  const getSavingsPercentage = () => {
    if (originalTransactions === 0) return 0
    return Math.round(((originalTransactions - optimizedTransactions) / originalTransactions) * 100)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Optimizing settlements...</Text>
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
              <Text style={styles.title}>🔄 Smart Settle Up</Text>
              <Text style={styles.subtitle}>Optimized debt settlement</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>
      </View>

      {/* Optimization Summary */}
      <View style={styles.optimizationSummary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Original Transactions</Text>
          <Text style={styles.summaryValue}>{originalTransactions}</Text>
        </View>
        
        <Text style={styles.arrowIcon}>→</Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Optimized</Text>
          <Text style={styles.summaryValue}>{optimizedTransactions}</Text>
        </View>
        
        <View style={styles.savingsCard}>
          <Text style={styles.savingsLabel}>Savings</Text>
          <Text style={styles.savingsValue}>{getSavingsPercentage()}%</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Total Debt Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Total Outstanding Debt</Text>
          <View style={styles.totalDebtCard}>
            <Text style={styles.totalDebtAmount}>${totalDebt.toFixed(2)}</Text>
            <Text style={styles.totalDebtLabel}>needs to be settled</Text>
          </View>
        </View>

        {/* Optimized Settlements */}
        {settlements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Optimized Settlements</Text>
            <Text style={styles.sectionSubtitle}>
              Settle all debts with just {optimizedTransactions} transaction{optimizedTransactions !== 1 ? 's' : ''}
            </Text>
            
            {settlements.map((settlement, index) => (
              <View key={index} style={styles.settlementCard}>
                <View style={styles.settlementHeader}>
                  <View style={styles.settlementUsers}>
                    <Text style={styles.fromUser}>{settlement.from_user_name}</Text>
                    <Text style={styles.settlementArrow}>→</Text>
                    <Text style={styles.toUser}>{settlement.to_user_name}</Text>
                  </View>
                  <Text style={styles.settlementAmount}>
                    ${settlement.amount.toFixed(2)}
                  </Text>
                </View>
                
                {settlement.from_user_id === user?.id && (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handleSettlePayment(settlement)}
                  >
                    <Text style={styles.payButtonText}>💳 Pay Now</Text>
                  </TouchableOpacity>
                )}
                
                {settlement.to_user_id === user?.id && (
                  <View style={styles.receiveIndicator}>
                    <Text style={styles.receiveText}>💰 You will receive this payment</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎉</Text>
            <Text style={styles.emptyStateTitle}>All Settled Up!</Text>
            <Text style={styles.emptyStateText}>
              No outstanding debts to settle. Everyone is even!
            </Text>
          </View>
        )}

        {/* Debt Summary */}
        {debtSummary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Current Balances</Text>
            {debtSummary.map((debt) => (
              <View key={debt.user_id} style={styles.debtItem}>
                <View style={styles.debtHeader}>
                  <Text style={styles.debtName}>{debt.user_name}</Text>
                  <Text style={[
                    styles.debtAmount,
                    { color: debt.net_amount >= 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {debt.net_amount >= 0 ? '+' : ''}${debt.net_amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.debtDetails}>
                  <Text style={styles.debtDetail}>Owes: ${debt.total_owed.toFixed(2)}</Text>
                  <Text style={styles.debtDetail}>Owed: ${debt.total_owing.toFixed(2)}</Text>
                  {debt.overdue_amount > 0 && (
                    <Text style={[styles.debtDetail, { color: '#ef4444' }]}>
                      Overdue: ${debt.overdue_amount.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <View style={styles.placeholder} />
          </View>
          
          {selectedSettlement && (
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentSummaryText}>
                Pay {selectedSettlement.to_user_name} ${selectedSettlement.amount.toFixed(2)}
              </Text>
            </View>
          )}
          
          <ScrollView style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.type}
                style={styles.paymentMethodButton}
                onPress={() => confirmPayment(method)}
              >
                <Text style={styles.paymentMethodName}>{method.display_name}</Text>
                <Text style={styles.paymentMethodIdentifier}>{method.identifier}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}
