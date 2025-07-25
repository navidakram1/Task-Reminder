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

interface SpendingAnalytics {
  category_name: string
  category_icon: string
  total_amount: number
  transaction_count: number
  avg_amount: number
  percentage_of_total: number
  trend_direction: 'up' | 'down' | 'stable' | 'new'
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

export default function SimpleBillAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<SpendingAnalytics[]>([])
  const [debtSummary, setDebtSummary] = useState<DebtSummary[]>([])
  const [totalSpending, setTotalSpending] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '1y'>('6m')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
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

      const endDate = new Date()
      const startDate = new Date()
      
      switch (selectedPeriod) {
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      // Fetch spending analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_spending_analytics', {
          p_household_id: householdMember.household_id,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0]
        })

      if (analyticsError) throw analyticsError
      setAnalytics(analyticsData || [])

      // Calculate total spending
      const total = (analyticsData || []).reduce((sum, item) => sum + item.total_amount, 0)
      setTotalSpending(total)

      // Fetch debt summary
      const { data: debtData, error: debtError } = await supabase
        .rpc('get_household_debt_summary', {
          p_household_id: householdMember.household_id
        })

      if (debtError) throw debtError
      setDebtSummary(debtData || [])

    } catch (error) {
      console.error('Error fetching analytics:', error)
      Alert.alert('Error', 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      case 'new': return '✨'
      default: return '📊'
    }
  }

  const getColorForIndex = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>📊 Spending Analytics</Text>
            <Text style={styles.subtitle}>Simple Overview</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['3m', '6m', '1y'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriodButton
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.selectedPeriodButtonText
            ]}>
              {period === '3m' ? '3 Months' : period === '6m' ? '6 Months' : '1 Year'}
            </Text>
          </TouchableOpacity>
        ))}
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
            <Text style={styles.summaryLabel}>Total Spending</Text>
            <Text style={styles.summaryValue}>${totalSpending.toFixed(2)}</Text>
            <Text style={styles.summarySubtext}>Last {selectedPeriod}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Categories</Text>
            <Text style={styles.summaryValue}>{analytics.length}</Text>
            <Text style={styles.summarySubtext}>Active categories</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Category Breakdown</Text>
          {analytics.map((item, index) => (
            <View key={item.category_name} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>{item.category_icon}</Text>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{item.category_name}</Text>
                    <Text style={styles.categoryStats}>
                      {item.transaction_count} transactions • Avg ${item.avg_amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryTotal}>${item.total_amount.toFixed(2)}</Text>
                  <View style={styles.categoryTrend}>
                    <Text style={styles.trendIcon}>{getTrendIcon(item.trend_direction)}</Text>
                    <Text style={styles.categoryPercentage}>{item.percentage_of_total.toFixed(1)}%</Text>
                  </View>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${item.percentage_of_total}%`,
                      backgroundColor: getColorForIndex(index)
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Debt Summary */}
        {debtSummary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Debt Summary</Text>
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

        {/* Upgrade Notice */}
        <View style={styles.upgradeNotice}>
          <Text style={styles.upgradeIcon}>📈</Text>
          <Text style={styles.upgradeTitle}>Want Visual Charts?</Text>
          <Text style={styles.upgradeText}>
            Install chart dependencies to see beautiful graphs and charts
          </Text>
          <Text style={styles.upgradeCommand}>
            npm install react-native-chart-kit react-native-svg
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
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
  placeholder: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryItem: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryStats: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
    marginBottom: 8,
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
    flexDirection: 'row',
    gap: 16,
  },
  debtDetail: {
    fontSize: 14,
    color: '#64748b',
  },
  upgradeNotice: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.8,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeCommand: {
    fontSize: 12,
    color: '#667eea',
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
})
