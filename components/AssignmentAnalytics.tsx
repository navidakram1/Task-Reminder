import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { supabase } from '../lib/supabase'

interface AssignmentStat {
  user_id: string
  user_name: string
  total_assignments: number
  random_assignments: number
  manual_assignments: number
  avg_workload_score: number
  last_assignment_date: string
}

interface WorkloadBalance {
  user_id: string
  user_name: string
  current_tasks: number
  completed_tasks: number
  workload_score: number
  balance_ratio: number
}

interface AssignmentAnalyticsProps {
  householdId: string
  days?: number
}

export default function AssignmentAnalytics({ householdId, days = 30 }: AssignmentAnalyticsProps) {
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStat[]>([])
  const [workloadBalance, setWorkloadBalance] = useState<WorkloadBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(days)

  useEffect(() => {
    fetchAnalytics()
  }, [householdId, selectedPeriod])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch assignment statistics
      const { data: statsData, error: statsError } = await supabase.rpc('get_assignment_statistics', {
        p_household_id: householdId,
        p_days: selectedPeriod
      })

      if (statsError) throw statsError
      setAssignmentStats(statsData || [])

      // Fetch workload balance
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_workload_balance', {
        p_household_id: householdId
      })

      if (balanceError) throw balanceError
      setWorkloadBalance(balanceData || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBalanceColor = (ratio: number) => {
    if (ratio < 0.8) return '#28a745' // Green - underloaded
    if (ratio < 1.2) return '#ffc107' // Yellow - balanced
    return '#dc3545' // Red - overloaded
  }

  const getBalanceLabel = (ratio: number) => {
    if (ratio < 0.8) return 'Light Load'
    if (ratio < 1.2) return 'Balanced'
    return 'Heavy Load'
  }

  const calculateFairnessScore = () => {
    if (workloadBalance.length === 0) return 100

    const ratios = workloadBalance.map(w => w.balance_ratio)
    const variance = ratios.reduce((sum, ratio) => {
      const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
      return sum + Math.pow(ratio - avg, 2)
    }, 0) / ratios.length

    // Convert variance to fairness score (lower variance = higher fairness)
    return Math.max(0, Math.min(100, 100 - (variance * 50)))
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  const fairnessScore = calculateFairnessScore()

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {[7, 30, 90].map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fairness Score */}
      <View style={styles.fairnessCard}>
        <Text style={styles.fairnessTitle}>⚖️ Fairness Score</Text>
        <View style={styles.fairnessScoreContainer}>
          <Text style={[
            styles.fairnessScore,
            { color: fairnessScore > 80 ? '#28a745' : fairnessScore > 60 ? '#ffc107' : '#dc3545' }
          ]}>
            {Math.round(fairnessScore)}%
          </Text>
          <Text style={styles.fairnessLabel}>
            {fairnessScore > 80 ? 'Excellent' : fairnessScore > 60 ? 'Good' : 'Needs Improvement'}
          </Text>
        </View>
      </View>

      {/* Assignment Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Assignment Statistics ({selectedPeriod} days)</Text>
        {assignmentStats.length === 0 ? (
          <Text style={styles.emptyText}>No assignments in this period</Text>
        ) : (
          assignmentStats.map(stat => (
            <View key={stat.user_id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statName}>{stat.user_name}</Text>
                <Text style={styles.statTotal}>{stat.total_assignments} tasks</Text>
              </View>
              <View style={styles.statDetails}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>🎯 Smart Assigned:</Text>
                  <Text style={styles.statValue}>{stat.random_assignments}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>👤 Manual Assigned:</Text>
                  <Text style={styles.statValue}>{stat.manual_assignments}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>📈 Avg Effort:</Text>
                  <Text style={styles.statValue}>{stat.avg_workload_score.toFixed(1)}</Text>
                </View>
                {stat.last_assignment_date && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>🕒 Last Assigned:</Text>
                    <Text style={styles.statValue}>
                      {new Date(stat.last_assignment_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Current Workload Balance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚖️ Current Workload Balance</Text>
        {workloadBalance.map(balance => (
          <View key={balance.user_id} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceName}>{balance.user_name}</Text>
              <View style={[
                styles.balanceBadge,
                { backgroundColor: getBalanceColor(balance.balance_ratio) }
              ]}>
                <Text style={styles.balanceBadgeText}>
                  {getBalanceLabel(balance.balance_ratio)}
                </Text>
              </View>
            </View>
            <View style={styles.balanceDetails}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Active Tasks:</Text>
                <Text style={styles.balanceValue}>{balance.current_tasks}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Completed:</Text>
                <Text style={styles.balanceValue}>{balance.completed_tasks}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Workload Score:</Text>
                <Text style={styles.balanceValue}>{balance.workload_score}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance Ratio:</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: getBalanceColor(balance.balance_ratio) }
                ]}>
                  {balance.balance_ratio.toFixed(2)}x
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        <View style={styles.recommendationCard}>
          {fairnessScore < 60 && (
            <Text style={styles.recommendationText}>
              • Consider using Smart Assignment more often to improve fairness
            </Text>
          )}
          {workloadBalance.some(w => w.balance_ratio > 1.5) && (
            <Text style={styles.recommendationText}>
              • Some members are overloaded - redistribute tasks
            </Text>
          )}
          {workloadBalance.some(w => w.balance_ratio < 0.5) && (
            <Text style={styles.recommendationText}>
              • Some members could take on more tasks
            </Text>
          )}
          {assignmentStats.length > 0 && assignmentStats.every(s => s.random_assignments === 0) && (
            <Text style={styles.recommendationText}>
              • Try using Smart Assignment for better workload distribution
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  fairnessCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  fairnessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  fairnessScoreContainer: {
    alignItems: 'center',
  },
  fairnessScore: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  fairnessLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  statDetails: {
    gap: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  balanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  balanceDetails: {
    gap: 5,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  recommendationCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  recommendationText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 5,
    lineHeight: 16,
  },
})
