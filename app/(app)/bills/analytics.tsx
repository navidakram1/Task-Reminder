import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
// Conditional import for charts - will be available after npm install
let LineChart: any, PieChart: any, BarChart: any
try {
  const chartKit = require('react-native-chart-kit')
  LineChart = chartKit.LineChart
  PieChart = chartKit.PieChart
  BarChart = chartKit.BarChart
} catch (error) {
  console.log('Chart kit not installed yet - install with: npm install react-native-chart-kit react-native-svg')
}

interface SpendingAnalytics {
  category_name: string
  category_icon: string
  total_amount: number
  transaction_count: number
  avg_amount: number
  percentage_of_total: number
  trend_direction: 'up' | 'down' | 'stable' | 'new'
}

interface MonthlySpending {
  month: string
  amount: number
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

const screenWidth = Dimensions.get('window').width

export default function BillAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<SpendingAnalytics[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlySpending[]>([])
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

      // Fetch monthly spending data
      const { data: monthlySpendingData } = await supabase
        .from('bills')
        .select('amount, date')
        .eq('household_id', householdMember.household_id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')

      // Group by month
      const monthlyMap: Record<string, number> = {}
      monthlySpendingData?.forEach(bill => {
        const month = new Date(bill.date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        monthlyMap[month] = (monthlyMap[month] || 0) + bill.amount
      })

      const monthlyArray = Object.entries(monthlyMap).map(([month, amount]) => ({
        month,
        amount
      }))
      setMonthlyData(monthlyArray)

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

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      // This would integrate with a service to generate exports
      Alert.alert('Export', `Exporting data as ${format.toUpperCase()}...`)
      // Implementation would depend on chosen export service
    } catch (error) {
      Alert.alert('Error', 'Failed to export data')
    }
  }

  const getPieChartData = () => {
    return analytics.slice(0, 6).map((item, index) => ({
      name: item.category_name,
      population: item.total_amount,
      color: getColorForIndex(index),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }))
  }

  const getLineChartData = () => {
    return {
      labels: monthlyData.slice(-6).map(item => item.month),
      datasets: [{
        data: monthlyData.slice(-6).map(item => item.amount),
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 3
      }]
    }
  }

  const getColorForIndex = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB6C1', '#87CEEB']
    return colors[index % colors.length]
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
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>📊 Spending Analytics</Text>
              <Text style={styles.subtitle}>Insights & Reports</Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => exportData('csv')}
            >
              <Text style={styles.exportText}>📤</Text>
            </TouchableOpacity>
          </View>
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
            <Text style={styles.summaryLabel}>Avg per Month</Text>
            <Text style={styles.summaryValue}>
              ${(totalSpending / (selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12)).toFixed(2)}
            </Text>
            <Text style={styles.summarySubtext}>Monthly average</Text>
          </View>
        </View>

        {/* Spending Trends Chart */}
        {monthlyData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>📈 Spending Trends</Text>
            <LineChart
              data={getLineChartData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#667eea'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Breakdown */}
        {analytics.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>🥧 Category Breakdown</Text>
            <PieChart
              data={getPieChartData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Category Details</Text>
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

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📤 Export Data</Text>
          <View style={styles.exportOptions}>
            <TouchableOpacity
              style={styles.exportOptionButton}
              onPress={() => exportData('csv')}
            >
              <Text style={styles.exportOptionIcon}>📊</Text>
              <Text style={styles.exportOptionText}>Export CSV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exportOptionButton}
              onPress={() => exportData('pdf')}
            >
              <Text style={styles.exportOptionIcon}>📄</Text>
              <Text style={styles.exportOptionText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
