import { supabase } from './supabase'
import { Alert } from 'react-native'

export interface SubscriptionStatus {
  plan: 'free' | 'monthly' | 'lifetime'
  status: 'active' | 'cancelled' | 'expired'
  current_period_end?: string
  features: string[]
}

export interface FeatureLimit {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

export class SubscriptionService {
  private static cache: Map<string, { data: SubscriptionStatus, timestamp: number }> = new Map()
  private static CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get current user's subscription status
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Check cache first
    const cached = this.cache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let status: SubscriptionStatus

      if (error || !subscription) {
        // No active subscription - free tier
        status = {
          plan: 'free',
          status: 'active',
          features: this.getFreeFeatures()
        }
      } else {
        // Active subscription
        status = {
          plan: subscription.plan,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          features: this.getPlanFeatures(subscription.plan)
        }
      }

      // Cache the result
      this.cache.set(userId, { data: status, timestamp: Date.now() })
      return status

    } catch (error) {
      console.error('Error fetching subscription status:', error)
      // Return free tier on error
      return {
        plan: 'free',
        status: 'active',
        features: this.getFreeFeatures()
      }
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId)
    return status.features.includes(feature)
  }

  /**
   * Check task creation limits for current month
   */
  static async checkTaskLimit(userId: string): Promise<FeatureLimit> {
    const status = await this.getSubscriptionStatus(userId)

    // Premium users have unlimited tasks
    if (status.plan !== 'free') {
      return {
        allowed: true,
        current: 0,
        limit: -1, // Unlimited
      }
    }

    // Check current month's task count for free users
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    try {
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startOfMonth.toISOString())

      if (error) throw error

      const currentCount = count || 0
      const limit = 10

      return {
        allowed: currentCount < limit,
        current: currentCount,
        limit,
        message: currentCount >= limit 
          ? `You've reached your monthly limit of ${limit} tasks. Upgrade for unlimited tasks.`
          : `${currentCount}/${limit} tasks used this month`
      }
    } catch (error) {
      console.error('Error checking task limit:', error)
      return {
        allowed: false,
        current: 0,
        limit: 10,
        message: 'Unable to check task limit'
      }
    }
  }

  /**
   * Check bill creation limits for current month
   */
  static async checkBillLimit(userId: string): Promise<FeatureLimit> {
    const status = await this.getSubscriptionStatus(userId)

    // Premium users have unlimited bills
    if (status.plan !== 'free') {
      return {
        allowed: true,
        current: 0,
        limit: -1, // Unlimited
      }
    }

    // Check current month's bill count for free users
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    try {
      const { count, error } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('paid_by', userId)
        .gte('created_at', startOfMonth.toISOString())

      if (error) throw error

      const currentCount = count || 0
      const limit = 5

      return {
        allowed: currentCount < limit,
        current: currentCount,
        limit,
        message: currentCount >= limit 
          ? `You've reached your monthly limit of ${limit} bills. Upgrade for unlimited bills.`
          : `${currentCount}/${limit} bills used this month`
      }
    } catch (error) {
      console.error('Error checking bill limit:', error)
      return {
        allowed: false,
        current: 0,
        limit: 5,
        message: 'Unable to check bill limit'
      }
    }
  }

  /**
   * Show upgrade prompt when feature is not available
   */
  static showUpgradePrompt(feature: string, onUpgrade?: () => void) {
    const featureNames = {
      'unlimited_tasks': 'unlimited tasks',
      'unlimited_bills': 'unlimited bills',
      'advanced_analytics': 'advanced analytics',
      'custom_categories': 'custom categories',
      'receipt_uploads': 'receipt uploads',
      'task_approval': 'task approval system',
      'random_assignment': 'random task assignment',
      'push_notifications': 'push notifications',
      'priority_support': 'priority support',
    }

    const featureName = featureNames[feature as keyof typeof featureNames] || feature

    Alert.alert(
      'Premium Feature',
      `${featureName} is available with a premium subscription. Upgrade to unlock this feature and many more!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          onPress: onUpgrade || (() => {
            // Default navigation to subscription plans
            // This would need to be implemented based on your navigation setup
            console.log('Navigate to subscription plans')
          })
        }
      ]
    )
  }

  /**
   * Get features available for free tier
   */
  private static getFreeFeatures(): string[] {
    return [
      'basic_tasks',
      'basic_bills',
      'email_notifications',
      'basic_splitting',
      'household_management',
    ]
  }

  /**
   * Get features available for each plan
   */
  private static getPlanFeatures(plan: string): string[] {
    const baseFeatures = this.getFreeFeatures()

    switch (plan) {
      case 'monthly':
      case 'lifetime':
        return [
          ...baseFeatures,
          'unlimited_tasks',
          'unlimited_bills',
          'advanced_analytics',
          'custom_categories',
          'receipt_uploads',
          'task_approval',
          'random_assignment',
          'push_notifications',
          'priority_support',
          'no_ads',
        ]
      default:
        return baseFeatures
    }
  }

  /**
   * Clear subscription cache (call after subscription changes)
   */
  static clearCache(userId?: string) {
    if (userId) {
      this.cache.delete(userId)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Check if user should see ads
   */
  static async shouldShowAds(userId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId)
    return status.plan === 'free'
  }

  /**
   * Get subscription display info for UI
   */
  static async getSubscriptionDisplayInfo(userId: string) {
    const status = await this.getSubscriptionStatus(userId)
    
    const planNames = {
      free: 'Free',
      monthly: 'Monthly Pro',
      lifetime: 'Lifetime Pro'
    }

    const planColors = {
      free: '#6b7280',
      monthly: '#3b82f6',
      lifetime: '#f59e0b'
    }

    const planIcons = {
      free: '🆓',
      monthly: '⭐',
      lifetime: '👑'
    }

    return {
      name: planNames[status.plan],
      color: planColors[status.plan],
      icon: planIcons[status.plan],
      status: status.status,
      expiresAt: status.current_period_end,
      isPremium: status.plan !== 'free'
    }
  }
}

// Export convenience functions
export const hasFeatureAccess = SubscriptionService.hasFeatureAccess
export const checkTaskLimit = SubscriptionService.checkTaskLimit
export const checkBillLimit = SubscriptionService.checkBillLimit
export const showUpgradePrompt = SubscriptionService.showUpgradePrompt
export const shouldShowAds = SubscriptionService.shouldShowAds
