import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  features: string[]
  popular?: boolean
  current?: boolean
}

export default function SubscriptionPlansScreen() {
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 10 tasks per month',
        'Up to 5 bills per month',
        'Basic task management',
        'Simple bill splitting',
        'Email notifications',
        'Ads supported',
      ],
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$3',
      period: 'per month',
      features: [
        'Unlimited tasks',
        'Unlimited bills',
        'Advanced task management',
        'Custom bill splitting',
        'Push & email notifications',
        'Task approval system',
        'Random task assignment',
        'Receipt uploads',
        'No ads',
        'Priority support',
      ],
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '$15',
      period: 'one-time payment',
      popular: true,
      features: [
        'Everything in Monthly',
        'One-time payment',
        'Lifetime access',
        'Future feature updates',
        'Premium support',
        'Early access to new features',
      ],
    },
  ]

  useEffect(() => {
    fetchCurrentSubscription()
  }, [])

  const fetchCurrentSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setCurrentPlan(data.plan)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) {
      Alert.alert('Current Plan', 'You are already on this plan')
      return
    }

    if (planId === 'free') {
      Alert.alert(
        'Downgrade to Free',
        'Are you sure you want to downgrade to the free plan? You will lose access to premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Downgrade', onPress: () => updateSubscription(planId) },
        ]
      )
    } else {
      // Navigate to payment screen
      router.push(`/(app)/subscription/payment?plan=${planId}`)
    }
  }

  const updateSubscription = async (planId: string) => {
    if (!user) return

    setLoading(true)
    try {
      const subscriptionData = {
        user_id: user.id,
        plan: planId,
        started_at: new Date().toISOString(),
        expires_at: planId === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData)

      if (error) throw error

      setCurrentPlan(planId)
      Alert.alert('Success', 'Your subscription has been updated')
    } catch (error: any) {
      console.error('Error updating subscription:', error)
      Alert.alert('Error', error.message || 'Failed to update subscription')
    } finally {
      setLoading(false)
    }
  }

  const getPlanButtonText = (planId: string) => {
    if (planId === currentPlan) {
      return 'Current Plan'
    }
    
    switch (planId) {
      case 'free':
        return 'Downgrade'
      case 'monthly':
        return 'Subscribe Monthly'
      case 'lifetime':
        return 'Buy Lifetime'
      default:
        return 'Select Plan'
    }
  }

  const getPlanButtonStyle = (planId: string) => {
    if (planId === currentPlan) {
      return [styles.planButton, styles.currentPlanButton]
    }
    
    if (planId === 'lifetime') {
      return [styles.planButton, styles.popularPlanButton]
    }
    
    return styles.planButton
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Subscription Plans</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Choose Your Plan</Text>
          <Text style={styles.introText}>
            Upgrade to unlock unlimited tasks, bills, and premium features
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.popularPlan,
                plan.id === currentPlan && styles.currentPlan,
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              {plan.id === currentPlan && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={getPlanButtonStyle(plan.id)}
                onPress={() => handleSelectPlan(plan.id)}
                disabled={loading || plan.id === currentPlan}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    plan.id === currentPlan && styles.currentPlanButtonText,
                  ]}
                >
                  {getPlanButtonText(plan.id)}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens to my data if I downgrade?</Text>
            <Text style={styles.faqAnswer}>
              Your data is always safe. If you exceed the free plan limits, you'll just be unable to create new tasks/bills until you upgrade again.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is the lifetime plan really lifetime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! Pay once and use HomeTask forever. You'll also get all future updates and features at no extra cost.
            </Text>
          </View>
        </View>
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
  introSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  currentPlan: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planPricing: {
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
  },
  planPeriod: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: '#28a745',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  planButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularPlanButton: {
    backgroundColor: '#667eea',
  },
  currentPlanButton: {
    backgroundColor: '#6c757d',
  },
  planButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanButtonText: {
    color: '#fff',
  },
  faqSection: {
    marginBottom: 20,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
})
