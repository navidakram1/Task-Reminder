export interface EmailTemplate {
  subject: string
  html: string
}

export const emailTemplates = {
  taskReminder: (taskTitle: string, dueDate: string, assigneeName: string): EmailTemplate => ({
    subject: `Task Reminder: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 SplitDuty Task Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${assigneeName}!</h2>
            <p>You have a task that needs your attention:</p>
            
            <div class="task-card">
              <h3>📋 ${taskTitle}</h3>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p>Don't forget to complete this task and mark it as done in the app!</p>
            </div>
            
            <a href="splitduty://tasks" class="button">Open SplitDuty App</a>
            
            <p>Keep your household running smoothly! 🏡</p>
          </div>
          <div class="footer">
            <p>This email was sent by SplitDuty. You can manage your notification preferences in the app settings.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  billAlert: (billTitle: string, amount: number, dueDate: string, userName: string): EmailTemplate => ({
    subject: `Bill Alert: ${billTitle} - $${amount}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .bill-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; }
          .amount { font-size: 24px; font-weight: bold; color: #DC2626; }
          .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 SplitDuty Bill Alert</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>You have a bill payment due:</p>
            
            <div class="bill-card">
              <h3>🧾 ${billTitle}</h3>
              <p class="amount">$${amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p>Please settle your portion of this bill to keep your household finances on track.</p>
            </div>
            
            <a href="splitduty://bills" class="button">View Bill Details</a>
            
            <p>Stay on top of your shared expenses! 💰</p>
          </div>
          <div class="footer">
            <p>This email was sent by SplitDuty. You can manage your notification preferences in the app settings.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  householdInvitation: (inviterName: string, householdName: string, inviteCode: string): EmailTemplate => ({
    subject: `You're invited to join ${householdName} on SplitDuty!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Household Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .invite-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; text-align: center; }
          .invite-code { font-size: 24px; font-weight: bold; color: #10B981; background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Welcome to SplitDuty!</h1>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${householdName}</strong> on SplitDuty.</p>
            
            <div class="invite-card">
              <h3>🎉 Join Your Household</h3>
              <p>Use this invite code to join:</p>
              <div class="invite-code">${inviteCode}</div>
              <p>Download the SplitDuty app and enter this code to get started!</p>
            </div>
            
            <a href="https://splitduty.com/download" class="button">Download SplitDuty</a>
            
            <h3>What is SplitDuty?</h3>
            <p>SplitDuty helps households manage shared tasks and expenses:</p>
            <ul>
              <li>📋 Track and assign household chores</li>
              <li>💰 Split bills and track expenses</li>
              <li>🔔 Get reminders for tasks and payments</li>
              <li>📊 See household analytics and insights</li>
            </ul>
            
            <p>Join your household today and make managing shared responsibilities easier!</p>
          </div>
          <div class="footer">
            <p>This invitation was sent through SplitDuty. If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  spendingSummary: (userName: string, period: string, totalSpent: number, topCategories: Array<{category: string, amount: number}>): EmailTemplate => ({
    subject: `Your ${period} Spending Summary - $${totalSpent.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spending Summary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C3AED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .summary-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7C3AED; }
          .total-amount { font-size: 32px; font-weight: bold; color: #7C3AED; text-align: center; margin: 20px 0; }
          .category-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your ${period} Spending Summary</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>Here's your household spending summary for this ${period.toLowerCase()}:</p>
            
            <div class="summary-card">
              <h3>💰 Total Household Spending</h3>
              <div class="total-amount">$${totalSpent.toFixed(2)}</div>
              
              <h4>Top Spending Categories:</h4>
              ${topCategories.map(cat => `
                <div class="category-item">
                  <span>${cat.category}</span>
                  <strong>$${cat.amount.toFixed(2)}</strong>
                </div>
              `).join('')}
            </div>
            
            <a href="splitduty://bills/analytics" class="button">View Detailed Analytics</a>
            
            <p>Keep track of your spending patterns and make informed financial decisions! 📈</p>
          </div>
          <div class="footer">
            <p>This summary was generated by SplitDuty. You can manage your notification preferences in the app settings.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

export default emailTemplates
