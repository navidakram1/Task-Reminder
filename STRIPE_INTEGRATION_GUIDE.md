# 💳 Stripe Payment Integration Guide

## Overview

This guide shows how to integrate Stripe payment processing into the SplitDuty app for handling subscription payments.

## Setup Instructions

### 1. Install Stripe Dependencies

```bash
# Install Stripe React Native SDK
npm install @stripe/stripe-react-native

# Install Stripe server SDK for Edge Functions
# (This will be used in Supabase Edge Functions)
```

### 2. Stripe Dashboard Setup

1. **Create Stripe Account**: Sign up at https://stripe.com
2. **Get API Keys**: 
   - Publishable Key (for client-side)
   - Secret Key (for server-side)
3. **Create Products**:
   - Monthly Subscription ($3/month)
   - Lifetime Access ($15 one-time)
4. **Set up Webhooks**: For subscription status updates

### 3. Environment Variables

Add to your `.env` file:

```env
# Stripe Keys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Webhook Endpoint Secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Supabase Edge Functions

Create Edge Functions for secure payment processing:

#### Create Payment Intent Function

```typescript
// supabase/functions/create-payment-intent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { amount, currency = 'usd', planId } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        planId,
      },
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### Create Subscription Function

```typescript
// supabase/functions/create-subscription/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { customerId, priceId } = await req.json()

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### Webhook Handler Function

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object)
        break
    }

    return new Response(JSON.stringify({ received: true }))
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})

async function handlePaymentSuccess(paymentIntent: any) {
  // Update user subscription in Supabase
  const { planId } = paymentIntent.metadata
  
  await supabase
    .from('subscriptions')
    .insert({
      user_id: paymentIntent.metadata.userId,
      plan: planId,
      status: 'active',
      stripe_payment_intent_id: paymentIntent.id,
    })
}

async function handleSubscriptionPayment(invoice: any) {
  // Handle recurring subscription payments
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'active',
      current_period_end: new Date(invoice.period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', invoice.subscription)
}

async function handleSubscriptionCancellation(subscription: any) {
  // Handle subscription cancellation
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id)
}
```

### 5. Client-Side Integration

#### Stripe Provider Setup

```typescript
// App.tsx or _layout.tsx
import { StripeProvider } from '@stripe/stripe-react-native'

export default function App() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.splitduty" // For Apple Pay
    >
      {/* Your app content */}
    </StripeProvider>
  )
}
```

#### Enhanced Payment Screen

```typescript
// app/(app)/subscription/payment.tsx
import { useStripe } from '@stripe/stripe-react-native'

export default function PaymentScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const handleStripePayment = async (planId: string, amount: number) => {
    try {
      // 1. Create payment intent on server
      const { data } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount, planId, userId: user.id }
      })

      // 2. Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'SplitDuty',
        paymentIntentClientSecret: data.clientSecret,
        defaultBillingDetails: {
          name: user.email,
        },
      })

      if (initError) throw initError

      // 3. Present payment sheet
      const { error: paymentError } = await presentPaymentSheet()

      if (paymentError) {
        Alert.alert('Payment Failed', paymentError.message)
      } else {
        Alert.alert('Success', 'Payment completed successfully!')
        router.back()
      }
    } catch (error) {
      Alert.alert('Error', 'Payment failed. Please try again.')
    }
  }

  // Rest of component...
}
```

### 6. Feature Gating Implementation

```typescript
// lib/subscriptionService.ts
export class SubscriptionService {
  static async checkFeatureAccess(feature: string): Promise<boolean> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription || subscription.plan === 'free') {
      return this.getFreeFeatures().includes(feature)
    }

    return true // Premium users have access to all features
  }

  static getFreeFeatures(): string[] {
    return [
      'basic_tasks',
      'basic_bills',
      'email_notifications',
    ]
  }

  static async checkTaskLimit(): Promise<{ allowed: boolean, count: number, limit: number }> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (subscription?.plan !== 'free') {
      return { allowed: true, count: 0, limit: -1 } // Unlimited
    }

    // Check current month's task count
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', startOfMonth.toISOString())

    return {
      allowed: (count || 0) < 10,
      count: count || 0,
      limit: 10
    }
  }
}
```

### 7. Usage Examples

#### Check Feature Access

```typescript
// Before showing premium feature
const hasAccess = await SubscriptionService.checkFeatureAccess('advanced_analytics')
if (!hasAccess) {
  Alert.alert('Premium Feature', 'Upgrade to access advanced analytics')
  return
}
```

#### Check Task Limits

```typescript
// Before creating new task
const { allowed, count, limit } = await SubscriptionService.checkTaskLimit()
if (!allowed) {
  Alert.alert(
    'Task Limit Reached',
    `You've reached your monthly limit of ${limit} tasks. Upgrade for unlimited tasks.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Upgrade', onPress: () => router.push('/(app)/subscription/plans') }
    ]
  )
  return
}
```

### 8. Testing

#### Test Cards (Stripe Test Mode)

```typescript
// Successful payment
4242424242424242

// Declined payment
4000000000000002

// Requires authentication
4000002500003155
```

### 9. Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Set up production webhook endpoints
- [ ] Configure Apple Pay merchant ID
- [ ] Set up Google Pay merchant account
- [ ] Test all payment flows
- [ ] Set up subscription analytics
- [ ] Configure tax handling (if required)
- [ ] Set up customer support for billing issues

### 10. Security Best Practices

- Never store Stripe secret keys in client code
- Always validate payments on the server
- Use webhooks for reliable payment status updates
- Implement proper error handling
- Log payment events for debugging
- Use HTTPS for all payment-related requests

The Stripe integration is now ready for production use! 💳✨
