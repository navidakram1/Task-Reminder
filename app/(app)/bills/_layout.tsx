import { Stack } from 'expo-router'

export default function BillsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="enhanced-create" />
      <Stack.Screen name="settle-up" />
      <Stack.Screen name="optimized-settle" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="simple-analytics" />
    </Stack>
  )
}
