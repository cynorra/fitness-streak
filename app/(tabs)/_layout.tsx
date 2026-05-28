import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Streak',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🌱</Text>,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Keşfet',
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
        name="notifications"
        options={{
          title: 'Bildirimler',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🔔</Text>,
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
