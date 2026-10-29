import { Tabs } from 'expo-router';
import AnimatedTabBar from '../../components/AnimatedTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'shift' }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="dietitians" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
