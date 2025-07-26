import { supabase } from '../lib/supabase'

export interface AssignmentMember {
  user_id: string
  name: string
  email: string
  current_tasks_count: number
  completed_tasks_count: number
  total_workload_score: number
  last_assignment_date: string | null
}

export interface AssignmentSettings {
  enabled: boolean
  fairness_algorithm: 'balanced' | 'round_robin' | 'weighted'
  consider_workload: boolean
  consider_recent_assignments: boolean
  min_days_between_assignments: number
  max_consecutive_assignments: number
}

export interface TaskAssignmentRequest {
  task_id?: string
  household_id: string
  task_title: string
  task_category?: string
  effort_score?: number
  exclude_user_ids?: string[]
  prefer_user_ids?: string[]
}

export class RandomAssignmentService {
  
  /**
   * Get assignment settings for a household
   */
  static async getAssignmentSettings(householdId: string): Promise<AssignmentSettings> {
    const { data, error } = await supabase
      .from('random_assignment_settings')
      .select('*')
      .eq('household_id', householdId)
      .single()

    if (error || !data) {
      // Return default settings if none exist
      return {
        enabled: true,
        fairness_algorithm: 'balanced',
        consider_workload: true,
        consider_recent_assignments: true,
        min_days_between_assignments: 1,
        max_consecutive_assignments: 3
      }
    }

    return data
  }

  /**
   * Get household members with their workload data
   */
  static async getHouseholdMembersWithWorkload(householdId: string): Promise<AssignmentMember[]> {
    try {
      // First get household members
      const { data: members, error: membersError } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', householdId)

      if (membersError) throw membersError
      if (!members || members.length === 0) return []

      // Get workload data for each member
      const { data: workloadData, error: workloadError } = await supabase
        .from('member_workload')
        .select('*')
        .eq('household_id', householdId)

      if (workloadError) console.warn('Error fetching workload data:', workloadError)

      // Get user details from auth.users via RPC or direct query
      const memberDetails = await Promise.all(
        members.map(async (member) => {
          try {
            // Try to get user details from Supabase auth
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.user_id)

            const workload = workloadData?.find(w => w.user_id === member.user_id)

            return {
              user_id: member.user_id,
              name: userData.user?.user_metadata?.name ||
                    userData.user?.user_metadata?.full_name ||
                    userData.user?.email?.split('@')[0] || 'Unknown',
              email: userData.user?.email || '',
              current_tasks_count: workload?.current_tasks_count || 0,
              completed_tasks_count: workload?.completed_tasks_count || 0,
              total_workload_score: workload?.total_workload_score || 0,
              last_assignment_date: workload?.last_assignment_date || null
            }
          } catch (error) {
            console.warn(`Error fetching user details for ${member.user_id}:`, error)
            const workload = workloadData?.find(w => w.user_id === member.user_id)
            return {
              user_id: member.user_id,
              name: 'Unknown User',
              email: '',
              current_tasks_count: workload?.current_tasks_count || 0,
              completed_tasks_count: workload?.completed_tasks_count || 0,
              total_workload_score: workload?.total_workload_score || 0,
              last_assignment_date: workload?.last_assignment_date || null
            }
          }
        })
      )

      return memberDetails
    } catch (error) {
      console.error('Error in getHouseholdMembersWithWorkload:', error)
      return []
    }
  }

  /**
   * Calculate assignment scores for each member
   */
  static calculateAssignmentScores(
    members: AssignmentMember[],
    settings: AssignmentSettings,
    taskEffortScore: number = 1,
    excludeUserIds: string[] = [],
    preferUserIds: string[] = []
  ): { user_id: string; score: number; name: string }[] {
    const now = new Date()
    
    return members
      .filter(member => !excludeUserIds.includes(member.user_id))
      .map(member => {
        let score = 100 // Base score

        // Workload balancing
        if (settings.consider_workload) {
          const avgWorkload = members.reduce((sum, m) => sum + m.total_workload_score, 0) / members.length
          const workloadDiff = member.total_workload_score - avgWorkload
          score -= workloadDiff * 10 // Penalize high workload
          
          // Consider current active tasks
          score -= member.current_tasks_count * 15
        }

        // Recent assignment consideration
        if (settings.consider_recent_assignments && member.last_assignment_date) {
          const daysSinceLastAssignment = Math.floor(
            (now.getTime() - new Date(member.last_assignment_date).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysSinceLastAssignment < settings.min_days_between_assignments) {
            score -= 50 // Heavy penalty for recent assignments
          } else {
            score += Math.min(daysSinceLastAssignment * 5, 30) // Bonus for longer gaps
          }
        }

        // Preference bonus
        if (preferUserIds.includes(member.user_id)) {
          score += 25
        }

        // Completion rate bonus (reward reliable members)
        const totalTasks = member.current_tasks_count + member.completed_tasks_count
        if (totalTasks > 0) {
          const completionRate = member.completed_tasks_count / totalTasks
          score += completionRate * 20
        }

        // Random factor to prevent predictability
        score += Math.random() * 10

        return {
          user_id: member.user_id,
          score: Math.max(0, score), // Ensure non-negative
          name: member.name
        }
      })
      .sort((a, b) => b.score - a.score) // Sort by highest score first
  }

  /**
   * Assign a task using the random assignment algorithm
   */
  static async assignTask(request: TaskAssignmentRequest): Promise<{
    assigned_to: string
    assigned_name: string
    assignment_reason: string
    all_scores: { user_id: string; score: number; name: string }[]
  }> {
    const settings = await this.getAssignmentSettings(request.household_id)
    
    if (!settings.enabled) {
      throw new Error('Random assignment is disabled for this household')
    }

    const members = await this.getHouseholdMembersWithWorkload(request.household_id)
    
    if (members.length === 0) {
      throw new Error('No household members found')
    }

    const scores = this.calculateAssignmentScores(
      members,
      settings,
      request.effort_score || 1,
      request.exclude_user_ids || [],
      request.prefer_user_ids || []
    )

    if (scores.length === 0) {
      throw new Error('No eligible members for assignment')
    }

    let selectedMember: { user_id: string; score: number; name: string }

    switch (settings.fairness_algorithm) {
      case 'round_robin':
        // Select the member with the least recent assignment
        selectedMember = scores.reduce((prev, current) => {
          const prevMember = members.find(m => m.user_id === prev.user_id)!
          const currentMember = members.find(m => m.user_id === current.user_id)!
          
          if (!prevMember.last_assignment_date) return prev
          if (!currentMember.last_assignment_date) return current
          
          return new Date(prevMember.last_assignment_date) < new Date(currentMember.last_assignment_date) 
            ? prev : current
        })
        break

      case 'weighted':
        // Weighted random selection based on scores
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
        let random = Math.random() * totalScore
        
        selectedMember = scores[0] // fallback
        for (const score of scores) {
          random -= score.score
          if (random <= 0) {
            selectedMember = score
            break
          }
        }
        break

      case 'balanced':
      default:
        // Select the highest scoring member
        selectedMember = scores[0]
        break
    }

    // Record the assignment
    await this.recordAssignment(
      request.task_id,
      request.household_id,
      selectedMember.user_id,
      'random',
      request.effort_score || 1
    )

    return {
      assigned_to: selectedMember.user_id,
      assigned_name: selectedMember.name,
      assignment_reason: this.generateAssignmentReason(selectedMember, scores, settings),
      all_scores: scores
    }
  }

  /**
   * Record an assignment in the database
   */
  static async recordAssignment(
    taskId: string | undefined,
    householdId: string,
    assignedTo: string,
    method: string = 'random',
    workloadScore: number = 1
  ): Promise<void> {
    // Record in assignment history
    if (taskId) {
      await supabase
        .from('assignment_history')
        .insert({
          task_id: taskId,
          household_id: householdId,
          assigned_to: assignedTo,
          assignment_method: method,
          workload_score: workloadScore
        })
    }

    // Update member workload
    await supabase
      .from('member_workload')
      .upsert({
        household_id: householdId,
        user_id: assignedTo,
        last_assignment_date: new Date().toISOString()
      }, {
        onConflict: 'household_id,user_id'
      })

    // Increment current tasks count
    await supabase.rpc('increment_member_workload', {
      p_household_id: householdId,
      p_user_id: assignedTo,
      p_workload_increment: workloadScore
    })
  }

  /**
   * Generate a human-readable reason for the assignment
   */
  static generateAssignmentReason(
    selected: { user_id: string; score: number; name: string },
    allScores: { user_id: string; score: number; name: string }[],
    settings: AssignmentSettings
  ): string {
    const reasons = []

    if (selected.score === Math.max(...allScores.map(s => s.score))) {
      reasons.push('highest fairness score')
    }

    if (settings.consider_workload) {
      reasons.push('balanced workload distribution')
    }

    if (settings.consider_recent_assignments) {
      reasons.push('time since last assignment')
    }

    return `Assigned to ${selected.name} based on ${reasons.join(', ')}`
  }

  /**
   * Get assignment statistics for a household
   */
  static async getAssignmentStats(householdId: string, days: number = 30): Promise<any> {
    const { data, error } = await supabase
      .from('assignment_history')
      .select(`
        assigned_to,
        assignment_method,
        workload_score,
        assigned_at,
        users!inner (user_metadata)
      `)
      .eq('household_id', householdId)
      .gte('assigned_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) throw error

    return data
  }
}
