import React, { useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.replace('/(auth)/login')
          return
        }

        if (data.session) {
          // User is authenticated, redirect to main app
          router.replace('/(app)/dashboard')
        } else {
          // No session, redirect to login
          router.replace('/(auth)/login')
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error)
        router.replace('/(auth)/login')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={styles.text}>Completing authentication...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
})
