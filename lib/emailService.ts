import { supabase } from './supabase'
import { emailTemplates } from './emailTemplates'

export interface EmailNotificationData {
  type: 'task_reminder' | 'bill_alert' | 'payment_reminder' | 'invitation' | 'spending_summary'
  recipient: string
  user_id?: string
  task_id?: string
  bill_id?: string
  data: any
}

class EmailService {
  private async sendEmail(to: string, subject: string, html: string, type: string, user_id?: string, task_id?: string, bill_id?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html,
          type,
          user_id,
          task_id,
          bill_id
        }
      })

      if (error) {
        console.error('Email sending error:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Email service error:', error)
      return { success: false, error }
    }
  }

  async sendTaskReminder(taskData: {
    recipient: string
    user_id: string
    task_id: string
    taskTitle: string
    dueDate: string
    assigneeName: string
  }) {
    const template = emailTemplates.taskReminder(
      taskData.taskTitle,
      taskData.dueDate,
      taskData.assigneeName
    )

    return this.sendEmail(
      taskData.recipient,
      template.subject,
      template.html,
      'task_reminder',
      taskData.user_id,
      taskData.task_id
    )
  }

  async sendBillAlert(billData: {
    recipient: string
    user_id: string
    bill_id: string
    billTitle: string
    amount: number
    dueDate: string
    userName: string
  }) {
    const template = emailTemplates.billAlert(
      billData.billTitle,
      billData.amount,
      billData.dueDate,
      billData.userName
    )

    return this.sendEmail(
      billData.recipient,
      template.subject,
      template.html,
      'bill_alert',
      billData.user_id,
      billData.bill_id
    )
  }

  async sendHouseholdInvitation(inviteData: {
    recipient: string
    inviterName: string
    householdName: string
    inviteCode: string
  }) {
    const template = emailTemplates.householdInvitation(
      inviteData.inviterName,
      inviteData.householdName,
      inviteData.inviteCode
    )

    return this.sendEmail(
      inviteData.recipient,
      template.subject,
      template.html,
      'invitation'
    )
  }

  async sendSpendingSummary(summaryData: {
    recipient: string
    user_id: string
    userName: string
    period: string
    totalSpent: number
    topCategories: Array<{category: string, amount: number}>
  }) {
    const template = emailTemplates.spendingSummary(
      summaryData.userName,
      summaryData.period,
      summaryData.totalSpent,
      summaryData.topCategories
    )

    return this.sendEmail(
      summaryData.recipient,
      template.subject,
      template.html,
      'spending_summary',
      summaryData.user_id
    )
  }

  async sendPaymentReminder(reminderData: {
    recipient: string
    user_id: string
    bill_id: string
    billTitle: string
    amount: number
    daysOverdue: number
    userName: string
  }) {
    const subject = `Payment Reminder: ${reminderData.billTitle} - ${reminderData.daysOverdue} days overdue`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .urgent-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
          .amount { font-size: 24px; font-weight: bold; color: #EF4444; }
          .overdue { background: #FEE2E2; color: #991B1B; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; }
          .button { display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Urgent Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${reminderData.userName}!</h2>
            <p>You have an overdue payment that needs immediate attention:</p>
            
            <div class="urgent-card">
              <h3>🧾 ${reminderData.billTitle}</h3>
              <p class="amount">$${reminderData.amount.toFixed(2)}</p>
              <div class="overdue">⏰ ${reminderData.daysOverdue} days overdue</div>
              <p>Please settle this payment as soon as possible to keep your household finances on track.</p>
            </div>
            
            <a href="splitduty://bills" class="button">Pay Now</a>
            
            <p>Your household is counting on you! 🏠</p>
          </div>
          <div class="footer">
            <p>This reminder was sent by SplitDuty. You can manage your notification preferences in the app settings.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail(
      reminderData.recipient,
      subject,
      html,
      'payment_reminder',
      reminderData.user_id,
      reminderData.bill_id
    )
  }

  // Batch email sending for household notifications
  async sendHouseholdNotification(notification: EmailNotificationData) {
    switch (notification.type) {
      case 'task_reminder':
        return this.sendTaskReminder(notification.data)
      case 'bill_alert':
        return this.sendBillAlert(notification.data)
      case 'payment_reminder':
        return this.sendPaymentReminder(notification.data)
      case 'invitation':
        return this.sendHouseholdInvitation(notification.data)
      case 'spending_summary':
        return this.sendSpendingSummary(notification.data)
      default:
        throw new Error(`Unknown notification type: ${notification.type}`)
    }
  }
}

export const emailService = new EmailService()
export default emailService
