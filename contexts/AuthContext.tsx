import { Session, User } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signInWithApple: () => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
            full_name: name || '',
          }
        }
      })

      if (error) {
        return { data, error }
      }

      // If sign up was successful, the database trigger will automatically create the profile
      if (data.user && !error) {
        console.log('User signed up successfully:', data.user.id)
        // Profile creation is handled by database triggers
      }

      return { data, error }
    } catch (error) {
      console.error('SignUp error:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        return { data, error }
      } else {
        // Mobile OAuth flow - for now, show a message that it needs to be configured
        // In a real app, you'd use expo-auth-session or similar
        return {
          data: null,
          error: {
            message: 'Social authentication on mobile requires additional setup. Please use email/password for now.'
          }
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { data: null, error }
    }
  }

  const signInWithApple = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        return { data, error }
      } else {
        // Mobile OAuth flow - for now, show a message that it needs to be configured
        return {
          data: null,
          error: {
            message: 'Social authentication on mobile requires additional setup. Please use email/password for now.'
          }
        }
      }
    } catch (error) {
      console.error('Apple sign in error:', error)
      return { data: null, error }
    }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
