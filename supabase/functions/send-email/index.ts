import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  type: 'task_reminder' | 'bill_alert' | 'payment_reminder' | 'invitation' | 'spending_summary'
  user_id?: string
  task_id?: string
  bill_id?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, type, user_id, task_id, bill_id }: EmailRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user has email notifications enabled
    if (user_id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user_id)
        .single()

      if (!profile?.notification_preferences?.email) {
        return new Response(
          JSON.stringify({ success: false, message: 'Email notifications disabled for user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Send email using Resend (you can replace with your preferred email service)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SplitDuty <noreply@splitduty.com>',
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${emailResult.message}`)
    }

    // Log the email in the database
    await supabaseClient
      .from('email_logs')
      .insert({
        recipient: to,
        subject: subject,
        type: type,
        user_id: user_id,
        task_id: task_id,
        bill_id: bill_id,
        status: 'sent',
        external_id: emailResult.id,
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: emailResult.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to send email' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To deploy this function:
1. Install Supabase CLI: npm install -g supabase
2. Login: supabase login
3. Link project: supabase link --project-ref YOUR_PROJECT_REF
4. Deploy: supabase functions deploy send-email
5. Set environment variables in Supabase dashboard:
   - RESEND_API_KEY: Your Resend API key
*/
