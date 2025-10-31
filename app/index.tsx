import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
      console.log('Onboarding complete flag:', onboardingComplete)
      setHasSeenOnboarding(onboardingComplete === 'true')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setHasSeenOnboarding(false)
    }
  }

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_complete')
      setHasSeenOnboarding(false)
      console.log('Onboarding reset')
    } catch (error) {
      console.error('Error resetting onboarding:', error)
    }
  }

  useEffect(() => {
    if (!loading && hasSeenOnboarding !== null) {
      if (user) {
        // User is authenticated, go to main app
        router.replace('/(app)/dashboard')
      } else if (hasSeenOnboarding) {
        // User has seen onboarding, go to login
        router.replace('/(auth)/login')
      } else {
        // New user, start onboarding with screen 1
        router.replace('/(onboarding)/screen-1-welcome')
      }
    }
  }, [user, loading, hasSeenOnboarding])

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        Loading... (user: {user ? 'yes' : 'no'}, onboarding: {hasSeenOnboarding ? 'yes' : 'no'})
      </Text>
      <TouchableOpacity
        style={{ marginTop: 30, padding: 10, backgroundColor: '#667eea', borderRadius: 8 }}
        onPress={resetOnboarding}
      >
        <Text style={{ color: '#fff', fontSize: 12 }}>Reset Onboarding</Text>
      </TouchableOpacity>
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
