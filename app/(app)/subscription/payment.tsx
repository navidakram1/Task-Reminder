import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

interface PlanDetails {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: string[]
}

export default function PaymentScreen() {
  const { plan } = useLocalSearchParams()
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'apple' | 'google'>('stripe')
  const { user } = useAuth()

  const plans: Record<string, PlanDetails> = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Subscription',
      price: '$3.00',
      period: 'per month',
      description: 'Unlimited access to all premium features',
      features: [
        'Unlimited tasks and bills',
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
    lifetime: {
      id: 'lifetime',
      name: 'Lifetime Access',
      price: '$15.00',
      period: 'one-time payment',
      description: 'Pay once, use forever with all future updates',
      features: [
        'Everything in Monthly plan',
        'One-time payment',
        'Lifetime access',
        'All future feature updates',
        'Premium support',
        'Early access to new features',
        'No recurring charges',
      ],
    },
  }

  useEffect(() => {
    if (plan && typeof plan === 'string' && plans[plan]) {
      setPlanDetails(plans[plan])
    } else {
      Alert.alert('Error', 'Invalid plan selected')
      router.back()
    }
  }, [plan])

  const handlePayment = async () => {
    if (!planDetails || !user) return

    setProcessing(true)
    try {
      // In a real app, you would integrate with Stripe, Apple Pay, or Google Pay
      // For this demo, we'll simulate a successful payment
      
      Alert.alert(
        'Payment Simulation',
        `This is a demo. In a real app, you would be charged ${planDetails.price} via ${paymentMethod}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Success',
            onPress: async () => {
              await processSuccessfulPayment()
            },
          },
        ]
      )
    } catch (error) {
      console.error('Payment error:', error)
      Alert.alert('Payment Failed', 'Please try again or contact support')
    } finally {
      setProcessing(false)
    }
  }

  const processSuccessfulPayment = async () => {
    if (!planDetails || !user) return

    try {
      // Create subscription record
      const subscriptionData = {
        user_id: user.id,
        plan: planDetails.id,
        started_at: new Date().toISOString(),
        expires_at: planDetails.id === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        payment_id: `demo_payment_${Date.now()}`,
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData)

      if (error) throw error

      Alert.alert(
        'Payment Successful!',
        `Welcome to ${planDetails.name}! You now have access to all premium features.`,
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(app)/dashboard'),
          },
        ]
      )
    } catch (error: any) {
      console.error('Error creating subscription:', error)
      Alert.alert('Error', 'Payment succeeded but failed to activate subscription. Please contact support.')
    }
  }

  if (!planDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.planSummary}>
          <Text style={styles.planName}>{planDetails.name}</Text>
          <Text style={styles.planPrice}>{planDetails.price}</Text>
          <Text style={styles.planPeriod}>{planDetails.period}</Text>
          <Text style={styles.planDescription}>{planDetails.description}</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What you'll get:</Text>
          {planDetails.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              paymentMethod === 'stripe' && styles.selectedPaymentMethod,
            ]}
            onPress={() => setPaymentMethod('stripe')}
          >
            <Text style={styles.paymentMethodText}>💳 Credit/Debit Card</Text>
            <Text style={styles.paymentMethodSubtext}>Powered by Stripe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              paymentMethod === 'apple' && styles.selectedPaymentMethod,
            ]}
            onPress={() => setPaymentMethod('apple')}
          >
            <Text style={styles.paymentMethodText}>🍎 Apple Pay</Text>
            <Text style={styles.paymentMethodSubtext}>Quick and secure</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              paymentMethod === 'google' && styles.selectedPaymentMethod,
            ]}
            onPress={() => setPaymentMethod('google')}
          >
            <Text style={styles.paymentMethodText}>🔍 Google Pay</Text>
            <Text style={styles.paymentMethodSubtext}>Fast checkout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securitySection}>
          <Text style={styles.securityTitle}>🔒 Secure Payment</Text>
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. We never store your payment details.
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            {planDetails.id === 'monthly' && ' You can cancel anytime from your account settings.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, processing && styles.processingButton]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <View style={styles.processingContent}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.payButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>
              Pay {planDetails.price} {paymentMethod === 'stripe' ? 'with Card' : 
                paymentMethod === 'apple' ? 'with Apple Pay' : 'with Google Pay'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>💯 30-Day Money-Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
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
  planSummary: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 25,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 25,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  paymentMethodSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPaymentMethod: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: '#666',
  },
  securitySection: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsSection: {
    marginBottom: 25,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  payButton: {
    backgroundColor: '#667eea',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  processingButton: {
    backgroundColor: '#5a6fd8',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guaranteeSection: {
    backgroundColor: '#d4edda',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
})
