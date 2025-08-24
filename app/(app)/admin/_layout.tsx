import { Stack } from 'expo-router'

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="analytics" />
      <Stack.Screen name="user-management" />
      <Stack.Screen name="revenue-tracking" />
      <Stack.Screen name="retention-analysis" />
    </Stack>
  )
}
