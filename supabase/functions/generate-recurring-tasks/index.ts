import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecurringTask {
  id: string
  title: string
  description: string
  recurrence: 'daily' | 'weekly' | 'monthly'
  household_id: string
  assignee_id: string | null
  created_by: string
  emoji: string | null
  due_date: string | null
  last_generated: string | null
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

    console.log('Starting recurring task generation...')

    // Get all tasks with recurrence that need new instances
    const { data: recurringTasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .not('recurrence', 'is', null)
      .eq('status', 'completed') // Only generate from completed recurring tasks

    if (fetchError) {
      throw new Error(`Failed to fetch recurring tasks: ${fetchError.message}`)
    }

    console.log(`Found ${recurringTasks?.length || 0} recurring tasks to process`)

    let generatedCount = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    for (const task of recurringTasks || []) {
      try {
        const lastGenerated = task.last_generated ? new Date(task.last_generated) : new Date(task.created_at)
        const nextDueDate = calculateNextDueDate(lastGenerated, task.recurrence)

        // Check if we need to generate a new instance
        if (nextDueDate <= today) {
          // Check if an instance for this date already exists
          const { data: existingTask } = await supabaseClient
            .from('tasks')
            .select('id')
            .eq('parent_task_id', task.id)
            .eq('due_date', nextDueDate.toISOString().split('T')[0])
            .single()

          if (!existingTask) {
            // Generate new task instance
            const newTaskData = {
              title: task.title,
              description: task.description,
              due_date: nextDueDate.toISOString().split('T')[0],
              assignee_id: task.assignee_id,
              household_id: task.household_id,
              created_by: task.created_by,
              emoji: task.emoji,
              status: 'pending',
              parent_task_id: task.id, // Link to original recurring task
              recurrence: null, // New instances are not recurring themselves
            }

            const { error: insertError } = await supabaseClient
              .from('tasks')
              .insert(newTaskData)

            if (insertError) {
              console.error(`Failed to create recurring task instance for ${task.title}:`, insertError)
              continue
            }

            // Update the original task's last_generated timestamp
            await supabaseClient
              .from('tasks')
              .update({ last_generated: nextDueDate.toISOString() })
              .eq('id', task.id)

            generatedCount++
            console.log(`Generated new instance of "${task.title}" for ${nextDueDate.toDateString()}`)
          }
        }
      } catch (error) {
        console.error(`Error processing recurring task ${task.id}:`, error)
        continue
      }
    }

    // Also generate tasks for the next period to ensure continuity
    for (const task of recurringTasks || []) {
      try {
        const lastGenerated = task.last_generated ? new Date(task.last_generated) : new Date(task.created_at)
        const nextDueDate = calculateNextDueDate(lastGenerated, task.recurrence)
        const futureDate = calculateNextDueDate(nextDueDate, task.recurrence)

        // Generate one future instance if it doesn't exist
        if (futureDate > today) {
          const { data: existingTask } = await supabaseClient
            .from('tasks')
            .select('id')
            .eq('parent_task_id', task.id)
            .eq('due_date', futureDate.toISOString().split('T')[0])
            .single()

          if (!existingTask) {
            const newTaskData = {
              title: task.title,
              description: task.description,
              due_date: futureDate.toISOString().split('T')[0],
              assignee_id: task.assignee_id,
              household_id: task.household_id,
              created_by: task.created_by,
              emoji: task.emoji,
              status: 'pending',
              parent_task_id: task.id,
              recurrence: null,
            }

            const { error: insertError } = await supabaseClient
              .from('tasks')
              .insert(newTaskData)

            if (!insertError) {
              generatedCount++
              console.log(`Generated future instance of "${task.title}" for ${futureDate.toDateString()}`)
            }
          }
        }
      } catch (error) {
        console.error(`Error generating future task for ${task.id}:`, error)
        continue
      }
    }

    console.log(`Recurring task generation completed. Generated ${generatedCount} new task instances.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${generatedCount} recurring task instances`,
        generated_count: generatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in recurring task generation:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to generate recurring tasks' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function calculateNextDueDate(lastDate: Date, recurrence: string): Date {
  const nextDate = new Date(lastDate)
  
  switch (recurrence) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    default:
      throw new Error(`Unknown recurrence type: ${recurrence}`)
  }
  
  return nextDate
}

/* To deploy this function:
1. Deploy: supabase functions deploy generate-recurring-tasks
2. Set up a cron job to call this function daily:
   - Use GitHub Actions, Vercel Cron, or similar
   - Call: POST https://your-project.supabase.co/functions/v1/generate-recurring-tasks
3. Or set up pg_cron in Supabase (if available):
   SELECT cron.schedule('generate-recurring-tasks', '0 6 * * *', 'SELECT net.http_post(url:=''https://your-project.supabase.co/functions/v1/generate-recurring-tasks'', headers:=''{"Authorization": "Bearer YOUR_SERVICE_KEY"}''::jsonb) as request_id;');
*/
