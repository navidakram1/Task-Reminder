import { Stack } from 'expo-router'
import { APP_THEME } from '../../../constants/AppTheme'

export default function ShoppingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: APP_THEME.colors.primary,
        },
        headerTintColor: APP_THEME.colors.surface,
        headerTitleStyle: {
          fontWeight: APP_THEME.typography.fontWeight.bold,
          fontSize: APP_THEME.typography.fontSize.lg,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Shopping Lists',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Shopping List',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create List',
        }}
      />
    </Stack>
  )
}

