import React from 'react'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-join-household" />
      <Stack.Screen name="invite-members" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  )
}
