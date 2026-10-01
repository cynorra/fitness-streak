import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../lib/i18n/i18n';

const TABS = [
  { name: 'index',         icon: '🌱', label: 'Streak' },
  { name: 'workouts',      icon: '🔥', label: 'Keşfet' },
  { name: 'feed',          icon: '👥', label: 'Akış' },
  { name: 'notifications', icon: '🔔', label: 'Bildirimler' },
  { name: 'friends',       icon: '🤝', label: 'Arkadaşlar' },
  { name: 'profile',       icon: '👤', label: 'Profil' },
];

function TabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: typeof TABS[0];
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const { t, locale } = useTranslation();
  const labelOpacity = useSharedValue(isActive ? 1 : 0.5);
  const dotScale = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    labelOpacity.value = withTiming(isActive ? 1 : 0.5, { duration: 200 });
    dotScale.value = withSpring(isActive ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [isActive]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const handlePress = useCallback(() => {
    // Bounce animasyonu
    scale.value = withSpring(0.8, { damping: 6, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable style={styles.tabItem} onPress={handlePress}>
      <Animated.Text style={[styles.icon, iconStyle, isActive && styles.iconActive]}>
        {tab.icon}
      </Animated.Text>
      <Animated.Text style={[styles.label, labelStyle, isActive && styles.labelActive]}>
        {t(`tabs.${tab.name}`)}
      </Animated.Text>
      {/* Active dot indicator */}
      <Animated.View style={[styles.activeDot, dotStyle]} />
    </Pressable>
  );
}

export default function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;
          const isActive = state.index === index;

          return (
            <TabButton
              key={route.key}
              tab={tab}
              isActive={isActive}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: '#10b981',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
  },
});
