import React from 'react'
import { Stack } from 'expo-router'

export default function BillsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="settle-up" />
    </Stack>
  )
}
