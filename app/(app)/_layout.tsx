import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/navigation/CustomTabBar';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Review',
        }}
      />
      <Tabs.Screen
        name="proposals"
        options={{
          title: 'Proposals',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      {/* Hidden Routes - Accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="subscription"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="household"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          href: null, // Hide from tab bar - can be accessed via navigation
        }}
      />
    </Tabs>
  )
}
