import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ftjhtxlpjchrobftmnei.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0amh0eGxwamNocm9iZnRtbmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODg3NTUsImV4cCI6MjA2ODk2NDc1NX0.nJQUFU7sPIUHRgUsd7Ij9wngew1WraNnPgPCULIO1Y4'

// Web-compatible storage
const isWeb = typeof window !== 'undefined' && Platform.OS === 'web'

const storage = isWeb ? {
  getItem: (key: string) => {
    try {
      return Promise.resolve(window.localStorage.getItem(key))
    } catch {
      return Promise.resolve(null)
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value)
      return Promise.resolve()
    } catch {
      return Promise.resolve()
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key)
      return Promise.resolve()
    } catch {
      return Promise.resolve()
    }
  },
} : AsyncStorage

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
    flowType: isWeb ? 'pkce' : 'implicit',
  },
})

// Database Types
export interface User {
  id: string
  email?: string
  phone?: string
  name?: string
  photo_url?: string
  notification_preferences?: any
  created_at: string
}

export interface Household {
  id: string
  name: string
  admin_id: string
  invite_code: string
  created_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export interface Task {
  id: string
  household_id: string
  title: string
  description?: string
  due_date?: string
  recurrence?: 'daily' | 'weekly' | 'monthly' | null
  assignee_id?: string
  status: 'pending' | 'completed' | 'awaiting_approval'
  created_by: string
  created_at: string
}

export interface TaskApproval {
  id: string
  task_id: string
  submitted_by: string
  proof_photo_url?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  comments?: string
}

export interface Bill {
  id: string
  household_id: string
  title: string
  amount: number
  category?: string
  date: string
  paid_by: string
  receipt_url?: string
  created_at: string
}

export interface BillSplit {
  id: string
  bill_id: string
  user_id: string
  amount: number
  status: 'owed' | 'paid'
  settled_at?: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'monthly' | 'lifetime'
  started_at: string
  expires_at?: string
  payment_id?: string
}
