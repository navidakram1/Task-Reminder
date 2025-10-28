import { Stack } from 'expo-router'

export default function TasksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="random-assignment" />
      <Stack.Screen name="smart-assignment" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
