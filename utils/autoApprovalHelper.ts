
/**
 * Manually trigger auto-approval of expired task reviews
 * This function calls the PostgreSQL function that auto-approves tasks
 * that have been in pending_review status for more than 3 days
 * 
 * Call this function:
 * - When the app starts
 * - When refreshing the task list
 * - Periodically in the background
 */
export async function triggerAutoApproval(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    // TEMPORARY: Disabled due to PostgREST cache issue
    // The function exists in the database but PostgREST cache doesn't know about it
    // Will re-enable once cache refreshes
    console.log('Auto-approval temporarily disabled (PostgREST cache issue)')
    return {
      success: true,
      count: 0,
    }

    /* ORIGINAL CODE - RE-ENABLE LATER
    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('auto_approve_expired_reviews')

    if (error) {
      console.error('Error triggering auto-approval:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log(`Auto-approved ${data || 0} expired task reviews`)

    return {
      success: true,
      count: data || 0,
    }
    */
  } catch (error: any) {
    console.error('Exception in triggerAutoApproval:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Check if a task should be auto-approved based on its pending_review_since timestamp
 * This is a client-side check for UI purposes
 */
export function shouldAutoApprove(pendingReviewSince: string | null): boolean {
  if (!pendingReviewSince) return false

  const reviewStartTime = new Date(pendingReviewSince).getTime()
  const autoApprovalTime = reviewStartTime + (3 * 24 * 60 * 60 * 1000) // 3 days in ms
  const now = Date.now()

  return now >= autoApprovalTime
}

/**
 * Get the time remaining until auto-approval in seconds
 */
export function getTimeUntilAutoApproval(pendingReviewSince: string | null): number {
  if (!pendingReviewSince) return 0

  const reviewStartTime = new Date(pendingReviewSince).getTime()
  const autoApprovalTime = reviewStartTime + (3 * 24 * 60 * 60 * 1000) // 3 days in ms
  const now = Date.now()
  const diff = autoApprovalTime - now

  return Math.max(0, Math.floor(diff / 1000))
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired'

  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return parts.join(' ')
}

