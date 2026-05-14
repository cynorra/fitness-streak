import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#ff6b35',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Streak',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🔥</Text>,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Akış',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Logla',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Arkadaşlar',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🤝</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
