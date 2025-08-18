# 📧 Email Notification Setup Guide

## Overview

The SplitDuty app now includes a comprehensive email notification system that sends:

- 📋 Task reminders
- 💳 Bill alerts and payment reminders
- 🏠 Household invitations
- 📊 Spending summaries
- ⚠️ Overdue payment notifications

## Setup Instructions

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain or use the sandbox domain for testing
3. Get your API key from the dashboard

### 2. Deploy Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the email function
supabase functions deploy send-email
```

### 3. Set Environment Variables

In your Supabase dashboard, go to Settings > Edge Functions and add:

```
RESEND_API_KEY=your_resend_api_key_here
```

### 4. Create Email Logs Table

Run the SQL from `database/email_logs_table.sql` in your Supabase SQL Editor.

### 5. Test Email Functionality

```typescript
import { emailService } from './lib/emailService'

// Test invitation email
await emailService.sendHouseholdInvitation({
  recipient: 'test@example.com',
  inviterName: 'John Doe',
  householdName: 'The Doe Family',
  inviteCode: 'ABC123'
})
```

## Email Types

### 1. Task Reminders
- Sent when tasks are due or overdue
- Includes task details and due date
- Links back to the app

### 2. Bill Alerts
- Sent when bills are added or due
- Shows amount and due date
- Includes payment link

### 3. Payment Reminders
- Escalating reminders for overdue payments
- Daily for first week, then weekly
- Shows days overdue

### 4. Household Invitations
- Welcome new members
- Includes invite code and app download link
- Explains SplitDuty features

### 5. Spending Summaries
- Weekly/monthly spending reports
- Category breakdowns
- Links to detailed analytics

## Configuration

### User Preferences

Users can control email notifications in Settings:

```typescript
// Update notification preferences
await supabase
  .from('profiles')
  .update({
    notification_preferences: {
      email: true,
      push: true,
      task_reminders: true,
      bill_alerts: true
    }
  })
  .eq('id', userId)
```

### Email Templates

Templates are defined in `lib/emailTemplates.ts` and include:

- Responsive HTML design
- Brand colors and styling
- Deep links back to the app
- Unsubscribe options

## Monitoring

### Email Logs

All sent emails are logged in the `email_logs` table:

```sql
-- View recent emails
SELECT * FROM email_logs 
ORDER BY sent_at DESC 
LIMIT 10;

-- Get email stats for a user
SELECT * FROM get_user_email_stats('user-uuid-here');
```

### Error Handling

- Failed emails are logged with error messages
- Bounced emails are tracked
- Users with disabled notifications are skipped

## Scheduled Notifications

### Daily Reminder Check

Set up a cron job or scheduled function to:

1. Check for overdue tasks
2. Send payment reminders
3. Generate spending summaries

```sql
-- Call this daily
SELECT schedule_payment_reminders();
```

### Weekly/Monthly Summaries

Schedule spending summaries:

```typescript
// Send weekly summary
await emailService.sendSpendingSummary({
  recipient: user.email,
  user_id: user.id,
  userName: user.name,
  period: 'Weekly',
  totalSpent: 250.00,
  topCategories: [
    { category: 'Groceries', amount: 120.00 },
    { category: 'Utilities', amount: 80.00 },
    { category: 'Entertainment', amount: 50.00 }
  ]
})
```

## Testing

### Development Testing

Use Resend's sandbox domain for testing:

```
from: 'SplitDuty <noreply@resend.dev>'
```

### Production Setup

1. Verify your domain with Resend
2. Update the `from` address in the Edge Function
3. Set up proper DNS records
4. Monitor delivery rates

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Resend API key and function logs
2. **Users not receiving emails**: Verify notification preferences
3. **Template issues**: Test HTML rendering in email clients
4. **Rate limits**: Monitor Resend usage and upgrade plan if needed

### Debug Logs

Check Supabase Edge Function logs:

```bash
supabase functions logs send-email
```

## Security

- Email service uses service role key (not exposed to client)
- User preferences are checked before sending
- Rate limiting prevents spam
- Unsubscribe links respect user preferences

## Next Steps

1. Set up automated daily/weekly email schedules
2. Add more email templates for different scenarios
3. Implement email analytics and open tracking
4. Add SMS notifications for critical alerts

The email system is now ready to keep your household connected and informed! 📧✨
