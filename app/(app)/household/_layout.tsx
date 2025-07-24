import { Stack } from 'expo-router'

export default function HouseholdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="members" />
      <Stack.Screen name="activity" />
    </Stack>
  )
}
