import { Stack } from 'expo-router'

export default function SocialLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="referrals" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="community" />
    </Stack>
  )
}
