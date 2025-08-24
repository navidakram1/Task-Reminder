import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';

// Custom Tab Icon Component with modern design
const TabIcon = ({ emoji, color, focused }: { emoji: string; color: string; focused: boolean }) => (
  <View style={{
    alignItems: 'center',
    justifyContent: 'center',
    width: focused ? 50 : 40,
    height: focused ? 50 : 40,
    borderRadius: focused ? 25 : 20,
    backgroundColor: focused ? color : 'transparent',
    shadowColor: focused ? color : 'transparent',
    shadowOffset: {
      width: 0,
      height: focused ? 4 : 0,
    },
    shadowOpacity: focused ? 0.3 : 0,
    shadowRadius: focused ? 8 : 0,
    elevation: focused ? 8 : 0,
    transform: [{ scale: focused ? 1.1 : 1 }],
  }}>
    <Text style={{
      fontSize: focused ? 24 : 20,
      color: focused ? '#ffffff' : '#8e8e93',
    }}>
      {emoji}
    </Text>
  </View>
)

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          elevation: 30,
          shadowColor: '#667eea',
          shadowOffset: {
            width: 0,
            height: -8,
          },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingHorizontal: 20,
          height: Platform.OS === 'ios' ? 95 : 75,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: 'blur(20px)',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          paddingHorizontal: 4,
          borderRadius: 20,
          marginHorizontal: 2,
        },
        tabBarBackground: () => (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            shadowColor: '#667eea',
            shadowOffset: {
              width: 0,
              height: -8,
            },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 30,
          }} />
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="🏠" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="✅" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="💰" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="👍" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon emoji="👤" color={color} focused={focused} />
          ),
        }}
      />
      {/* Hidden Routes - Accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="proposals"
        options={{
          href: null, // Hide from tab bar
        }}
      />
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
    </Tabs>
  )
}
