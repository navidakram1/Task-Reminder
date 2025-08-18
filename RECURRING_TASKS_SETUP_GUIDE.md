# 🔄 Recurring Tasks System Setup Guide

## Overview

The SplitDuty app now includes a comprehensive recurring tasks system that automatically generates task instances based on daily, weekly, or monthly schedules.

## Features

### ✨ **Automatic Task Generation**
- Creates new task instances based on recurrence patterns
- Supports daily, weekly, and monthly schedules
- Generates tasks automatically when previous instances are completed
- Maintains continuity by creating future instances

### 📊 **Template Management**
- Original recurring tasks become templates when first completed
- Templates don't appear in regular task lists
- Track generation history and statistics
- Manage all recurring tasks from dedicated screen

### 🎯 **Smart Scheduling**
- Calculates next due dates based on completion
- Handles overdue task generation
- Prevents duplicate instances for same dates
- Maintains assignee and task details across instances

## Setup Instructions

### 1. Database Setup

Run the SQL from `database/recurring_tasks_setup.sql` in your Supabase SQL Editor:

```sql
-- This will add:
-- - parent_task_id column for linking instances to templates
-- - last_generated timestamp tracking
-- - is_template flag for recurring task templates
-- - Functions for automatic generation
-- - Triggers for template creation
```

### 2. Deploy Edge Function

```bash
# Deploy the recurring task generation function
supabase functions deploy generate-recurring-tasks
```

### 3. Set Up Automated Generation

#### Option A: Cron Job (Recommended)

Set up a daily cron job to generate pending tasks:

```bash
# Using GitHub Actions, Vercel Cron, or similar
# Call daily at 6 AM:
curl -X POST https://your-project.supabase.co/functions/v1/generate-recurring-tasks \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

#### Option B: pg_cron (If Available)

```sql
-- Set up automatic daily generation at 6 AM
SELECT cron.schedule(
  'generate-recurring-tasks',
  '0 6 * * *',
  'SELECT generate_pending_recurring_tasks();'
);
```

### 4. Add Navigation

Add the recurring tasks screen to your navigation:

```typescript
// In your task navigation
<Stack.Screen 
  name="recurring" 
  options={{ title: "Recurring Tasks" }} 
/>
```

## How It Works

### 1. Creating Recurring Tasks

Users create tasks with recurrence settings:

```typescript
const taskData = {
  title: "Take out trash",
  recurrence: "weekly", // daily, weekly, monthly
  due_date: "2024-01-15",
  assignee_id: "user-id",
  // ... other fields
}
```

### 2. Template Creation

When a recurring task is first completed:
- Original task becomes a template (`is_template = true`)
- Template is marked as completed (hidden from active lists)
- Next instance is automatically generated

### 3. Instance Generation

The system generates new instances:
- When templates are completed
- During daily automated runs
- When manually triggered
- Based on recurrence patterns

### 4. Date Calculation

```sql
-- Daily: Add 1 day
-- Weekly: Add 7 days  
-- Monthly: Add 1 month
SELECT calculate_next_due_date('2024-01-15', 'weekly');
-- Returns: 2024-01-22
```

## User Interface

### Recurring Tasks Screen

Access via: `/(app)/tasks/recurring`

**Features:**
- View all recurring task templates
- See generation statistics
- Manually trigger task generation
- View instance history for each template
- Create new recurring tasks

**Statistics Displayed:**
- Total recurring tasks
- Active instances
- Completed instances  
- Overdue instances

### Task Creation

Enhanced task creation form includes:
- Recurrence selection (None/Daily/Weekly/Monthly)
- Visual preview of recurrence pattern
- Automatic template creation on completion

## Database Functions

### Core Functions

```sql
-- Generate all pending recurring tasks
SELECT generate_pending_recurring_tasks();

-- Generate specific task instance
SELECT generate_recurring_task_instance(task_id, due_date);

-- Calculate next due date
SELECT calculate_next_due_date(last_date, recurrence_type);

-- Get task statistics
SELECT * FROM get_recurring_task_stats(household_id);

-- Get task instances
SELECT * FROM get_recurring_task_instances(parent_task_id);
```

### Automatic Triggers

- **Template Creation**: When recurring task is first completed
- **Instance Generation**: When templates are marked complete
- **Date Calculation**: Automatic next due date computation

## API Usage

### Manual Generation

```typescript
// Generate pending tasks manually
const { data, error } = await supabase.rpc('generate_pending_recurring_tasks')

if (!error) {
  console.log(`Generated ${data} new task instances`)
}
```

### Get Recurring Tasks

```typescript
// Get all recurring task templates
const { data: templates } = await supabase
  .from('tasks')
  .select('*')
  .eq('household_id', householdId)
  .eq('is_template', true)
  .not('recurrence', 'is', null)
```

### Get Task Instances

```typescript
// Get instances of a recurring task
const { data: instances } = await supabase
  .rpc('get_recurring_task_instances', { parent_task_id: templateId })
```

## Monitoring & Maintenance

### Check Generation Status

```sql
-- View recent generation activity
SELECT 
  title,
  recurrence,
  last_generated,
  created_at
FROM tasks 
WHERE is_template = true 
ORDER BY last_generated DESC;
```

### Clean Up Old Instances

```sql
-- Remove completed instances older than 6 months
DELETE FROM tasks 
WHERE parent_task_id IS NOT NULL 
AND status = 'completed' 
AND created_at < NOW() - INTERVAL '6 months';
```

### Performance Optimization

- Indexes on `parent_task_id`, `recurrence`, `is_template`
- Efficient queries using proper filtering
- Batch generation for better performance

## Troubleshooting

### Common Issues

1. **Tasks not generating**: Check cron job setup and function logs
2. **Duplicate instances**: Verify date calculation logic
3. **Missing templates**: Ensure tasks are marked as templates when completed
4. **Performance issues**: Check database indexes and query optimization

### Debug Queries

```sql
-- Check for tasks that should generate instances
SELECT * FROM tasks 
WHERE recurrence IS NOT NULL 
AND is_template = TRUE 
AND (last_generated IS NULL OR last_generated < CURRENT_DATE);

-- View generation statistics
SELECT 
  recurrence,
  COUNT(*) as template_count,
  AVG(EXTRACT(days FROM NOW() - last_generated)) as avg_days_since_generation
FROM tasks 
WHERE is_template = TRUE 
GROUP BY recurrence;
```

## Next Steps

1. Set up automated daily generation
2. Monitor generation logs and performance
3. Add more recurrence patterns (bi-weekly, quarterly)
4. Implement task completion streaks and analytics
5. Add smart assignment rotation for recurring tasks

The recurring tasks system is now ready to automate your household chores! 🔄✨
