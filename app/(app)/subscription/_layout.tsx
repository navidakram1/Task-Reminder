import React from 'react'
import { Stack } from 'expo-router'

export default function SubscriptionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="plans" />
      <Stack.Screen name="payment" />
    </Stack>
  )
}
