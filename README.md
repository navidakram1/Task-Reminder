# HomeTask Reminder App

A cross-platform household management app to track chores, split bills, and manage tasks efficiently for families and roommates.

---

## 🚀 Overview
HomeTask helps households manage chores, split bills, and collaborate with features like reminders, random task assignment, approvals, and more.

---

## ✨ Features
- Task Reminders (Email + Push)
- Bill Splitting (Splitwise-like)
- Random Task Assignment
- Task Approval System
- Multi-User Collaboration
- Subscription Plans (Free, Monthly, Lifetime)
- Cross-Platform (Mobile + Web)

---

## 🛠️ Tech Stack
- **Frontend:** Expo (React Native), React Navigation, Expo Notifications, Expo Image Picker
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Payments:** Stripe/Razorpay

---

## 📁 Project Structure
```
app/
├── (auth)/                 # Authentication screens
│   ├── landing.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── (onboarding)/          # Onboarding flow
│   ├── welcome.tsx
│   ├── create-join-household.tsx
│   ├── invite-members.tsx
│   └── profile-setup.tsx
├── (app)/                 # Main app screens
│   ├── dashboard.tsx      # Home dashboard
│   ├── tasks/            # Task management
│   ├── bills/            # Bill splitting
│   ├── approvals/        # Task approvals
│   ├── settings/         # App settings
│   └── subscription/     # Subscription plans
├── _layout.tsx           # Root layout
└── index.tsx            # Entry point

contexts/
├── AuthContext.tsx       # Authentication context

lib/
├── supabase.ts          # Supabase client & types

supabase/
└── schema.sql           # Database schema
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install additional Expo packages**
   ```bash
   npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-notifications expo-image-picker expo-camera expo-media-library @react-native-picker/picker expo-linear-gradient
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - Enable authentication providers (Email, Google, Apple) in Auth settings
   - Create storage buckets for receipts and profile photos

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

### Database Setup

The app uses Supabase with the following main tables:
- `profiles` - User profiles and preferences
- `households` - Household information
- `household_members` - User-household relationships
- `tasks` - Task management
- `task_approvals` - Task completion approvals
- `bills` - Bill information
- `bill_splits` - Bill split details
- `subscriptions` - User subscription data

Run the SQL schema from `supabase/schema.sql` in your Supabase project to set up all tables with proper Row Level Security policies.

---

## 🤝 Contributing
- Fork the repo
- Create a feature branch
- Submit a pull request

---

## 📄 License
MIT 