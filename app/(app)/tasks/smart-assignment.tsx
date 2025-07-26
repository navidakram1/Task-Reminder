import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { AssignmentMember, AssignmentSettings } from '../../../services/SimpleRandomAssignmentService'

interface WorkloadStats {
  user_id: string
  user_name: string
  current_tasks: number
  completed_tasks: number
  workload_score: number
  balance_ratio: number
}

export default function SmartAssignmentScreen() {
  const [household, setHousehold] = useState<any>(null)
  const [members, setMembers] = useState<AssignmentMember[]>([])
  const [workloadStats, setWorkloadStats] = useState<WorkloadStats[]>([])
  const [settings, setSettings] = useState<AssignmentSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [assignmentResult, setAssignmentResult] = useState<any>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [effortScore, setEffortScore] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchHouseholdData()
  }, [])

  const fetchHouseholdData = async () => {
    if (!user) return

    try {
      // Get user's default household
      const { data: defaultHousehold } = await supabase.rpc('get_default_household')
      
      if (!defaultHousehold || defaultHousehold.length === 0) return
      
      const householdData = {
        id: defaultHousehold[0].household_id,
        name: defaultHousehold[0].household_name
      }
      setHousehold(householdData)

      // Fetch members with workload data
      const membersData = await SimpleRandomAssignmentService.getHouseholdMembersWithWorkload(householdData.id)
      setMembers(membersData)

      // Fetch assignment settings
      const settingsData = await SimpleRandomAssignmentService.getAssignmentSettings(householdData.id)
      setSettings(settingsData)

      // Fetch workload statistics
      await fetchWorkloadStats(householdData.id)
    } catch (error) {
      console.error('Error fetching household data:', error)
    }
  }

  const fetchWorkloadStats = async (householdId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_workload_balance', {
        p_household_id: householdId
      })

      if (error) throw error
      setWorkloadStats(data || [])
    } catch (error) {
      console.error('Error fetching workload stats:', error)
    }
  }

  const handleSmartAssignment = async () => {
    if (!household || members.length === 0) {
      Alert.alert('Error', 'No household members found')
      return
    }

    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title')
      return
    }

    setLoading(true)
    try {
      const result = await SimpleRandomAssignmentService.assignTask({
        household_id: household.id,
        task_title: taskTitle.trim(),
        effort_score: effortScore
      })

      setAssignmentResult(result)
      
      // Refresh workload stats
      await fetchWorkloadStats(household.id)
      
      Alert.alert(
        '🎯 Smart Assignment Complete!',
        `${result.assignment_reason}`,
        [
          { text: 'Assign Another', onPress: () => {
            setTaskTitle('')
            setAssignmentResult(null)
          }},
          { text: 'Create Task', onPress: () => {
            router.push({
              pathname: '/(app)/tasks/create',
              params: {
                title: taskTitle,
                assignee_id: result.assigned_to,
                effort_score: effortScore
              }
            })
          }},
          { text: 'Done', onPress: () => router.back() }
        ]
      )
    } catch (error) {
      console.error('Error with smart assignment:', error)
      Alert.alert('Error', error.message || 'Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<AssignmentSettings>) => {
    if (!household || !settings) return

    try {
      const updatedSettings = { ...settings, ...newSettings }
      
      await supabase
        .from('random_assignment_settings')
        .upsert({
          household_id: household.id,
          ...updatedSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'household_id'
        })

      setSettings(updatedSettings)
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  const getWorkloadColor = (ratio: number) => {
    if (ratio < 0.8) return '#28a745' // Green - low workload
    if (ratio < 1.2) return '#ffc107' // Yellow - balanced
    return '#dc3545' // Red - high workload
  }

  const getWorkloadLabel = (ratio: number) => {
    if (ratio < 0.8) return 'Light Load'
    if (ratio < 1.2) return 'Balanced'
    return 'Heavy Load'
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Smart Assignment</Text>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assignment Result */}
        {assignmentResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>🎯 Assignment Complete!</Text>
            <Text style={styles.resultText}>
              Assigned to: <Text style={styles.resultName}>{assignmentResult.assigned_name}</Text>
            </Text>
            <Text style={styles.resultReason}>{assignmentResult.assignment_reason}</Text>
          </View>
        )}

        {/* Task Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Task Details</Text>
          <TextInput
            style={styles.input}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Enter task title..."
            autoCapitalize="sentences"
          />
          
          <View style={styles.effortContainer}>
            <Text style={styles.label}>Effort Level: {effortScore}</Text>
            <View style={styles.effortButtons}>
              {[1, 2, 3, 4, 5].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.effortButton,
                    effortScore === level && styles.effortButtonActive
                  ]}
                  onPress={() => setEffortScore(level)}
                >
                  <Text style={[
                    styles.effortButtonText,
                    effortScore === level && styles.effortButtonTextActive
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.effortHint}>
              1 = Easy (5 min) • 5 = Very Hard (2+ hours)
            </Text>
          </View>
        </View>

        {/* Assignment Button */}
        <TouchableOpacity
          style={[styles.assignButton, loading && styles.disabledButton]}
          onPress={handleSmartAssignment}
          disabled={loading || !taskTitle.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.assignButtonText}>
              🎯 Smart Assign Task
            </Text>
          )}
        </TouchableOpacity>

        {/* Workload Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚖️ Workload Balance</Text>
          {workloadStats.map((stat) => (
            <View key={stat.user_id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{stat.user_name}</Text>
                <View style={[
                  styles.workloadBadge,
                  { backgroundColor: getWorkloadColor(stat.balance_ratio) }
                ]}>
                  <Text style={styles.workloadBadgeText}>
                    {getWorkloadLabel(stat.balance_ratio)}
                  </Text>
                </View>
              </View>
              <View style={styles.memberStats}>
                <Text style={styles.statText}>
                  Active: {stat.current_tasks} • Completed: {stat.completed_tasks}
                </Text>
                <Text style={styles.statText}>
                  Workload Score: {stat.workload_score} (×{stat.balance_ratio})
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Settings Panel */}
        {showSettings && settings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Assignment Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Smart Assignment</Text>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Consider Workload Balance</Text>
              <Switch
                value={settings.consider_workload}
                onValueChange={(value) => updateSettings({ consider_workload: value })}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Consider Recent Assignments</Text>
              <Switch
                value={settings.consider_recent_assignments}
                onValueChange={(value) => updateSettings({ consider_recent_assignments: value })}
              />
            </View>

            <View style={styles.algorithmContainer}>
              <Text style={styles.settingLabel}>Fairness Algorithm</Text>
              <View style={styles.algorithmButtons}>
                {(['balanced', 'round_robin', 'weighted'] as const).map(algorithm => (
                  <TouchableOpacity
                    key={algorithm}
                    style={[
                      styles.algorithmButton,
                      settings.fairness_algorithm === algorithm && styles.algorithmButtonActive
                    ]}
                    onPress={() => updateSettings({ fairness_algorithm: algorithm })}
                  >
                    <Text style={[
                      styles.algorithmButtonText,
                      settings.fairness_algorithm === algorithm && styles.algorithmButtonTextActive
                    ]}>
                      {algorithm.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backText: {
    fontSize: 16,
    color: '#667eea',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingsText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 5,
  },
  resultName: {
    fontWeight: '600',
  },
  resultReason: {
    fontSize: 12,
    color: '#155724',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  effortContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  effortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  effortButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  effortButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  effortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  effortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  effortHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  assignButton: {
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  memberCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  workloadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workloadBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  memberStats: {
    marginTop: 5,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  algorithmContainer: {
    marginTop: 15,
  },
  algorithmButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  algorithmButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  algorithmButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  algorithmButtonText: {
    fontSize: 10,
    color: '#666',
  },
  algorithmButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
})
