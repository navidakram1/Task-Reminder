import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  planId: string
  userId: string
  amount: number
  currency?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { planId, userId, amount, currency = 'usd' }: PaymentRequest = await req.json()

    // Validate required fields
    if (!planId || !userId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planId, userId, amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate plan exists and get details
    const planDetails = getPlanDetails(planId)
    if (!planDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate amount matches plan price
    if (amount !== planDetails.amount) {
      return new Response(
        JSON.stringify({ error: 'Amount does not match plan price' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user details
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For demo purposes, we'll simulate Stripe integration
    // In production, you would use the actual Stripe SDK:
    /*
    import Stripe from 'https://esm.sh/stripe@14.21.0'
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        planId,
        userId,
        userEmail: user.email,
      },
      description: `${planDetails.name} - ${user.email}`,
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    */

    // Demo simulation
    const mockPaymentIntent = {
      id: `pi_demo_${Date.now()}`,
      client_secret: `pi_demo_${Date.now()}_secret_demo`,
      amount: amount * 100,
      currency,
      status: 'requires_payment_method',
      metadata: {
        planId,
        userId,
        userEmail: user.email,
      }
    }

    // Log the payment intent creation
    console.log('Payment intent created:', {
      planId,
      userId,
      amount,
      userEmail: user.email,
      paymentIntentId: mockPaymentIntent.id
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        demo: true,
        message: 'This is a demo payment intent. In production, this would be a real Stripe payment intent.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getPlanDetails(planId: string) {
  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Subscription',
      amount: 3,
      currency: 'usd',
      interval: 'month',
    },
    lifetime: {
      id: 'lifetime',
      name: 'Lifetime Access',
      amount: 15,
      currency: 'usd',
      interval: 'one_time',
    }
  }

  return plans[planId as keyof typeof plans] || null
}

/* 
To deploy this function:
1. Deploy: supabase functions deploy create-payment-intent
2. Set environment variables in Supabase dashboard:
   - STRIPE_SECRET_KEY (your Stripe secret key)
3. Test with:
   curl -X POST https://your-project.supabase.co/functions/v1/create-payment-intent \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"planId":"monthly","userId":"user-id","amount":3}'
*/
