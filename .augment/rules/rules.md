---
type: "always_apply"
---

npm install --global eas-cli && npx create-expo-app bills-work && cd bills-work && eas init --id eaa605a2-7512-4041-8cb0-875eee14fbd1
sknavidakram@gmail.com's Project
1thanksA
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0amh0eGxwamNocm9iZnRtbmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODg3NTUsImV4cCI6MjA2ODk2NDc1NX0.nJQUFU7sPIUHRgUsd7Ij9wngew1WraNnPgPCULIO1Y4
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0amh0eGxwamNocm9iZnRtbmVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM4ODc1NSwiZXhwIjoyMDY4OTY0NzU1fQ.yG-Arweeoza1hWn7J-4DmjbBXHS7SMoTGsDEEMwORwo


EXPO_PUBLIC_SUPABASE_URL=https://ftjhtxlpjchrobftmnei.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<prefer publishable key instead of anon key for mobile and desktop apps>


import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  })
        
        HomeTask Reminder App - Complete Feature Set & Design Guide
App Overview
HomeTask is a shared household management app that helps families/roommates track chores, split bills, and manage tasks efficiently. It includes:

Task Reminders (Email + Push Notifications)

Bill Splitting (Splitwise-like functionality)

Random Task Assignment (Fair distribution of chores)

Task Approval System (Verify completed tasks)

Multi-User Collaboration (Join via link, email, or phone)

Subscription Plans (Lifetime $15 / Monthly $3)

Cross-Platform (Mobile + WebApp via Expo & React Native)

Core Features
1. User Authentication & Onboarding
Sign Up / Login (Email, Phone, Google, Apple)

Household Creation (Name, Invite Members)

Join via Link (Shareable invite link)

Profile Setup (Name, Photo, Notification Preferences)

2. Task Management
Create Tasks (Title, Description, Due Date, Assignee)

Recurring Tasks (Daily/Weekly/Monthly)

Random Task Assignment (Auto-distribute chores)

Task Approval (Mark as done → Require verification)

Reminders (Push + Email notifications)

Task History (Completed/Pending tasks)

3. Bill Splitting
Add Bills (Amount, Category, Date, Split Method)

Custom Splits (Equal, Percentage, Custom Shares)

Settle Up (Track who paid & who owes)

Payment History (Past transactions)

4. Subscription & Groups
Free Tier (Limited tasks/bills, ads)

Premium Plans:

Monthly ($3/month): Unlimited tasks, no ads

Lifetime ($15): One-time payment, all features

Group Management (Add/remove members, admin controls)

5. Settings & Notifications
Notification Preferences (Email/Push)

Household Settings (Edit name, leave group)

Subscription Management (Upgrade/Cancel)

App Pages & UI Flow
1. Landing Page (Mobile UI)
![Mockup: Clean, inviting design with:]

Hero Section: "Manage chores & bills together"

CTA Buttons: "Get Started" / "Login"

Feature Highlights: Task reminders, bill splitting, random assignments

Pricing Section: Free vs. Premium plans

2. Onboarding Screens
Welcome → Sign Up → Create/Join Household → Set Up Profile

3. Dashboard (Home Screen)
Upcoming Tasks (Cards with due dates)

Pending Approvals (If any)

Recent Bills (Who owes what)

Quick Actions (+ Add Task, + Add Bill)

4. Task Management Pages
Task List (Filter by: All, Assigned, Completed)

Task Details (Assignee, Due Date, Status, Comments)

Create/Edit Task (Form with fields)

5. Bill Management Pages
Bill List (Unsettled/Settled)

Bill Details (Split breakdown, payment status)

Add/Edit Bill (Amount, split method, notes)

6. Random Task Assignment
"Shuffle Tasks" Button → Auto-assigns chores

Confirmation Screen (Shows new assignments)

7. Approval System
"Mark Done" → Sends for verification

Approval Requests (List of pending approvals)

Approve/Reject Option

8. Subscription Page
Plan Comparison (Free vs. Premium)

Payment Gateway Integration (Stripe/Razorpay)

Confirmation Screen

9. Settings Page
Profile, Notifications, Household, Subscription, Logout

HomeTask – Simple Feature List
Easy Sign Up

Login with email, phone, Google, or Apple.

Invite housemates with a link.

Smart Chore Management

Create tasks with due dates & reminders.

Auto-shuffle chores for fairness.

Repeating tasks (daily/weekly/monthly).

Bill Splitting Made Easy

Split bills equally or custom amounts.

Core Pages (Minimum 15-18 Screens)
Authentication Flow (3-4 pages)

Landing Page (Get Started / Login)

Sign Up (Email/Phone/Google/Apple)

Login

Forgot Password (Optional)

Onboarding & Household Setup (3-4 pages)

Welcome Screen

Create/Join Household

Invite Members (Link/Email/Phone)

Profile Setup (Name, Photo, Notifications)

Main App Pages (8-10 pages)

Dashboard (Home Screen) – Upcoming tasks, pending approvals, recent bills

Task List – Filterable (All/Assigned/Completed)

Task Details – Assignee, due date, comments

Create/Edit Task – Form with fields (recurring, random assignment)

Bill List – Unsettled/Settled bills

Bill Details – Split breakdown, payment status

Add/Edit Bill – Amount, split method, receipt upload

Random Task Assignment – Shuffle & confirm new assignments

Approval Requests – List of pending verifications

Settle Up – Track payments & debts

Subscription & Settings (3-4 pages)

Subscription Plans (Free vs. Premium)

Payment Gateway (Stripe/Razorpay)

Settings (Profile, Notifications, Household, Subscription)

Logout Confirmation

Authentication & Onboarding
Sign Up / Login

Email/Phone

Google/Apple SSO

Forgot Password

Household Setup

Create/Join Household

Invite Members (Link/Email/Phone)

Profile Setup (Name, Photo, Notifications)

2. Task Management
Task Creation

Title, Description, Due Date

Assignee (Manual/Random)

Recurring (Daily/Weekly/Monthly)

Task List

Filters: All/Assigned/Completed

Sort by Due Date/Priority

Reminders

Push Notifications

Email Alerts

Task History

Completed/Pending Tasks

Export to CSV

3. Bill Splitting
Add Bill

Amount, Category, Date

Split Methods: Equal/Percentage/Custom

Receipt Upload

Settle Up

Track Payments

"Who Paid" vs. "Who Owes"

Payment History

Past Transactions

Debt Summary

4. Approval System
Mark Task Done

Submit for Verification

Add Completion Proof (Photo)

Approval Requests

Approve/Reject with Comments

Audit Log (Who Approved/Rejected)

5. Notifications
Types

Task Reminders (Due Soon/Overdue)

Bill Payment Alerts

Approval Requests

Channels

In-App Push

Email

6. Subscription & Groups
Plans

Free (Ads, Limited Tasks/Bills)

Premium ($3/month or $15 lifetime)

Group Management

Add/Remove Members

Admin Controls (Edit Household)

7. Settings
User Profile

Edit Name/Photo

Notification Preferences

Household Settings

Rename/Leave Household

Subscription

Upgrade/Downgrade/Cancel

Feature Flow (Key User Journeys)
New User
Sign Up → Create Household → Invite Members → Add Tasks/Bills

Task Completion
Mark Done → Submit for Approval → Approved/Rejected → Logged in History

Bill Settlement
Add Bill → Split Equally → Settle Up → Track Debt

Subscription Upgrade
Free User → View Premium Plans → Pay via Stripe → Unlock Features

Track who paid & who owes.

Payment history for reference.

Task Approval System

Mark tasks as done → Needs verification.

Approve or reject completed chores.

Instant Notifications

Push & email reminders for tasks & bills.

Works Everywhere

Mobile app + web (iOS, Android, browser).

Affordable Plans

Free (limited tasks, ads).

Premium ($3/month or $15 lifetime for unlimited features).

Household Controls

Add/remove members.

Admin controls for group settings. Easy Sign Up

Login with email, phone, Google, or Apple.

Invite housemates with a link.

Smart Chore Management

Create tasks with due dates & reminders.
1. Authentication & Onboarding
Sign Up / Login

Email/Phone

Google/Apple SSO

Forgot Password

Household Setup

Create/Join Household

Invite Members (Link/Email/Phone)

Profile Setup (Name, Photo, Notifications)

2. Task Management
Task Creation

Title, Description, Due Date

Assignee (Manual/Random)

Recurring (Daily/Weekly/Monthly)

Task List

Filters: All/Assigned/Completed

Sort by Due Date/Priority

Reminders

Push Notifications

Email Alerts

Task History

Completed/Pending Tasks

Export to CSV

3. Bill Splitting
Add Bill

Amount, Category, Date

Split Methods: Equal/Percentage/Custom

Receipt Upload

Settle Up

Track Payments

"Who Paid" vs. "Who Owes"

Payment History

Past Transactions

Debt Summary

4. Approval System
Mark Task Done

Submit for Verification

Add Completion Proof (Photo)

Approval Requests

Approve/Reject with Comments

Audit Log (Who Approved/Rejected)

5. Notifications
Types

Task Reminders (Due Soon/Overdue)

Bill Payment Alerts

Approval Requests

Channels

In-App Push

Email

6. Subscription & Groups
Plans

Free (Ads, Limited Tasks/Bills)

Premium ($3/month or $15 lifetime)

Group Management

Add/Remove Members

Admin Controls (Edit Household)

7. Settings
User Profile

Edit Name/Photo

Notification Preferences

Household Settings

Rename/Leave Household

Subscription

Upgrade/Downgrade/Cancel

Feature Flow (Key User Journeys)
New User
Sign Up → Create Household → Invite Members → Add Tasks/Bills

Task Completion
Mark Done → Submit for Approval → Approved/Rejected → Logged in History

Bill Settlement
Add Bill → Split Equally → Settle Up → Track Debt

Subscription Upgrade
Free User → View Premium Plans → Pay via Stripe → Unlock Features

Use supabase. for database,,
Auto-shuffle chores for fairness.

Repeating tasks (daily/weekly/monthly).

Bill Splitting Made Easy

Split bills equally or custom amounts.

Upload receipt photos (keep proof of payments).

Track who paid & who owes.

Payment history for reference.

Task Approval System

Mark tasks as done → Needs verification.

Approve or reject completed chores.

Instant Notifications

Push & email reminders for tasks & bills.

Works Everywhere

Mobile app + web (iOS, Android, browser).

Affordable Plans

Free (limited tasks, ads).

Premium ($3/month or $15 lifetime for unlimited features).

Household Controls

Add/remove members.

Admin controls for group settings.
Fantastic! You’ve provided a comprehensive feature set and design guide for the HomeTask Reminder App. Here’s how we can proceed to turn this into a real, scalable, and maintainable cross-platform app using **Expo (React Native)** for the frontend and **Supabase** for the backend/database.

---

## 1. Project Structure & Tech Stack

**Frontend:**  
- Expo (React Native) for iOS, Android, and Web
- React Navigation for routing
- Redux Toolkit or Zustand for state management (optional, but recommended for complex state)
- Expo Notifications for push notifications
- Expo Image Picker for photo uploads
- Stripe/Razorpay SDK for payments

**Backend:**  
- Supabase (Postgres DB, Auth, Storage, Functions)
- Supabase Edge Functions for custom logic (e.g., random task assignment, approval flows)
- Supabase Storage for receipt/completion proof uploads
- Supabase Auth for email, phone, Google, Apple sign-in

---

## 2. Database Schema (Supabase)

### Users
- id (uuid, PK)
- email, phone, name, photo_url
- notification_preferences (jsonb)
- created_at

### Households
- id (uuid, PK)
- name
- admin_id (FK to users)
- invite_code (unique)
- created_at

### Household_Members
- id (uuid, PK)
- household_id (FK)
- user_id (FK)
- role (admin/member)
- joined_at

### Tasks
- id (uuid, PK)
- household_id (FK)
- title, description, due_date, recurrence
- assignee_id (FK to users, nullable)
- status (pending/completed/awaiting_approval)
- created_by (FK to users)
- created_at

### Task_Approvals
- id (uuid, PK)
- task_id (FK)
- submitted_by (FK to users)
- proof_photo_url (nullable)
- status (pending/approved/rejected)
- reviewed_by (FK to users, nullable)
- reviewed_at
- comments

### Bills
- id (uuid, PK)
- household_id (FK)
- title, amount, category, date
- paid_by (FK to users)
- receipt_url (nullable)
- created_at

### Bill_Splits
- id (uuid, PK)
- bill_id (FK)
- user_id (FK)
- amount
- status (owed/paid)
- settled_at

### Subscriptions
- id (uuid, PK)
- user_id (FK)
- plan (free/monthly/lifetime)
- started_at
- expires_at
- payment_id (from Stripe/Razorpay)

---

## 3. App Navigation & Screen List

### Authentication & Onboarding
- Landing Page (Get Started / Login)
- Sign Up (Email/Phone/Google/Apple)
- Login
- Forgot Password
- Welcome
- Create/Join Household
- Invite Members
- Profile Setup

### Main App
- Dashboard (Upcoming Tasks, Pending Approvals, Recent Bills)
- Task List (All/Assigned/Completed)
- Task Details
- Create/Edit Task
- Bill List (Unsettled/Settled)
- Bill Details
- Add/Edit Bill
- Random Task Assignment (Shuffle)
- Approval Requests
- Settle Up
- Subscription Plans
- Payment Gateway
- Settings (Profile, Notifications, Household, Subscription)
- Logout Confirmation

---

## 4. Key Flows (User Journeys)

**New User:**  
Sign Up → Create Household → Invite Members → Add Tasks/Bills

**Task Completion:**  
Mark Done → Submit for Approval (with optional photo) → Approve/Reject → Log in History

**Bill Settlement:**  
Add Bill → Split → Settle Up → Track Debt

**Subscription Upgrade:**  
View Plans → Pay via Stripe/Razorpay → Unlock Features

---

## 5. Feature Implementation Notes

- **Push Notifications:** Use Expo Notifications + Supabase triggers for reminders.
- **Email Notifications:** Use Supabase Edge Functions or 3rd-party (e.g., Resend, SendGrid).
- **Random Task Assignment:** Edge Function to shuffle and assign tasks fairly.
- **Recurring Tasks:** Store recurrence pattern, auto-generate new tasks via scheduled function.
- **Photo Uploads:** Use Expo Image Picker, upload to Supabase Storage.
- **Invite via Link:** Generate unique invite_code per household, allow join via link.
- **Subscription:** Integrate Stripe/Razorpay, store status in Supabase, gate premium features.
- **Audit Logs:** Store approval/rejection actions in Task_Approvals.

---

## 6. UI/UX Design Principles

- Clean, modern, and friendly UI (Material Design or similar)
- Use cards for tasks/bills
- Clear CTAs (Add Task, Add Bill, Shuffle, Settle Up)
- Easy navigation (tab bar for main sections)
- Responsive for mobile & web

---

## 7. Next Steps

1. **Initialize Expo Project**  
   `npx create-expo-app HomeTaskReminder`

2. **Set Up Supabase Project**  
   - Create tables as per schema above
   - Enable Auth providers (email, phone, Google, Apple)
   - Set up Storage buckets

3. **Set Up Navigation & Basic Screens**  
   - Implement navigation structure (React Navigation)
   - Scaffold all screens (even if empty)

4. **Implement Auth & Onboarding Flow**  
   - Connect to Supabase Auth
   - Build sign up/login, household creation, invite, profile setup

5. **Build Core Features**  
   - Task management (CRUD, reminders, random assignment)
   - Bill splitting (CRUD, custom splits, settle up)
   - Approval system (mark done, submit proof, approve/reject)
   - Notifications (push/email)
   - Subscription (plan selection, payment, gating features)
   - Settings (profile, household, notifications)

6. **Polish UI & Add Animations**

7. **Testing & QA**

---

## 8. Example Folder Structure

```
/HomeTaskReminder
  /src
    /components
    /screens
    /navigation
    /hooks
    /utils
    /services
    /assets
  App.js
  app.json
  package.json
  /supabase
    supabaseClient.js
    /functions
```

---

## 9. Design System

- Use a consistent color palette (primary, secondary, accent)
- Typography: Large headers, readable body text
- Spacing: Generous padding/margins for touch targets
- Icons: Material Icons or similar
- Feedback: Toasts/snackbars for actions

---

## 10. What Would You Like to Do Next?

- **Kick off the Expo project?**
- **Set up Supabase schema?**
- **Start with Auth flow?**
- **Design UI wireframes?**
- **Something else?**

Let me know your preferred starting point, and I’ll guide (or generate code) step by step!