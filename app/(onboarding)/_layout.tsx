import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 7-Screen Onboarding Flow */}
      <Stack.Screen name="screen-1-welcome" />
      <Stack.Screen name="screen-2-chaos" />
      <Stack.Screen name="screen-3-ai-engine" />
      <Stack.Screen name="screen-4-action" />
      <Stack.Screen name="screen-5-welcome-final" />
      <Stack.Screen name="screen-6-harmony" />
      <Stack.Screen name="screen-7-profile" />
    </Stack>
  )
}
