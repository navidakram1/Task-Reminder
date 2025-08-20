import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../contexts/AuthContext'

export default function Index() {
  const { user, loading } = useAuth()
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem('onboarding_complete')
      setHasSeenOnboarding(onboardingComplete === 'true')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setHasSeenOnboarding(false)
    }
  }

  useEffect(() => {
    if (!loading && hasSeenOnboarding !== null) {
      if (user) {
        // User is authenticated, go to main app
        router.replace('/(app)/dashboard')
      } else if (hasSeenOnboarding) {
        // User has seen onboarding, go to landing page
        router.replace('/(auth)/landing')
      } else {
        // New user, start onboarding
        router.replace('/(onboarding)/intro')
      }
    }
  }, [user, loading, hasSeenOnboarding])

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
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
})
