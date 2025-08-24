import { Stack } from 'expo-router'

export default function SupportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="help-center" />
      <Stack.Screen name="bug-report" />
      <Stack.Screen name="feature-request" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="video-tutorials" />
    </Stack>
  )
}
