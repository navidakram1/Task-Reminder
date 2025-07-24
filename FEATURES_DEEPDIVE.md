# HomeTask Reminder App – Deep Features List

## 1. Authentication & Onboarding
### 1.1 Sign Up / Login
- Email/password authentication
- Phone number authentication (OTP)
- Google and Apple SSO
- Forgot password/reset flow
- Secure session management (Supabase Auth)

### 1.2 Household Creation & Joining
- Create new household (name, initial admin)
- Join via invite link or code
- Accept/decline invitations
- Household member roles (admin/member)

### 1.3 Profile Setup
- Set display name
- Upload/change profile photo
- Set notification preferences (push/email)

---

## 2. Task Management
### 2.1 Task CRUD
- Create, edit, delete, and view tasks
- Assign to self or others
- Attach description, due date, priority

### 2.2 Recurring Tasks
- Set recurrence: daily, weekly, monthly
- Auto-generate future tasks
- Edit/cancel recurrence

### 2.3 Random Task Assignment
- Shuffle tasks among members
- Fair distribution logic (Supabase Edge Function)
- Manual override of assignments

### 2.4 Task Approval System
- Mark task as done
- Submit for approval (optionally attach photo proof)
- Approval requests visible to admins/assignees
- Approve/reject with comments
- Audit log of approvals/rejections

### 2.5 Reminders & Notifications
- Push notifications for due/overdue tasks
- Email reminders
- Custom reminder times
- In-app notification center

### 2.6 Task History & Export
- View completed/pending tasks
- Filter by date, assignee, status
- Export task history to CSV

---

## 3. Bill Splitting
### 3.1 Bill CRUD
- Add, edit, delete, and view bills
- Attach title, amount, category, date
- Upload receipt photo

### 3.2 Split Methods
- Equal split
- Percentage split
- Custom shares per member
- Edit splits after creation

### 3.3 Settle Up & Payment Tracking
- Mark bills as paid/settled
- Track who paid and who owes
- Partial payments support
- Payment reminders

### 3.4 Payment History
- View past transactions
- Filter by member, date, status
- Export payment history to CSV

---

## 4. Subscription & Group Management
### 4.1 Plans & Gating
- Free tier: limited tasks/bills, ads
- Premium: unlimited, ad-free
- Lifetime: one-time payment
- Feature gating based on plan

### 4.2 Payments
- Stripe/Razorpay integration
- Handle payment success/failure
- Store payment receipts
- Subscription status in Supabase

### 4.3 Group Management
- Add/remove members
- Admin controls (promote/demote, remove)
- Household settings (rename, delete, leave)
- Invite via link, email, or phone

---

## 5. Notifications
### 5.1 Types
- Task reminders (due soon, overdue)
- Bill payment alerts
- Approval requests
- System messages (invites, plan changes)

### 5.2 Channels
- In-app push notifications (Expo)
- Email notifications (Supabase Edge/3rd-party)
- Notification preferences per user

---

## 6. Settings
### 6.1 Profile
- Edit name, photo
- Change email/phone
- Manage notification preferences

### 6.2 Household
- Rename household
- Leave household
- View members and roles

### 6.3 Subscription
- View/upgrade/downgrade/cancel plan
- View payment history

---

## 7. UI/UX & Navigation
- Responsive design (mobile/web)
- Tab navigation for main sections
- Cards for tasks/bills
- Modals for forms and confirmations
- Toasts/snackbars for feedback
- Loading and error states

---

## 8. Security & Data
- Secure storage of tokens and sensitive data
- Role-based access control (admin/member)
- Data validation on client and server
- Audit logs for critical actions

---

## 9. Integrations
- Supabase Auth, Database, Storage
- Expo Notifications
- Expo Image Picker
- Stripe/Razorpay for payments

---

## 10. Future Enhancements
- Calendar integration (Google/Apple)
- Voice assistant support
- Advanced analytics (task/bill stats)
- Multi-language support
- Dark mode 