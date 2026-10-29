import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../lib/i18n/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index',    icon: 'flame-outline',     iconActive: 'flame' },
  { name: 'workouts', icon: 'compass-outline',   iconActive: 'compass' },
  { name: 'dietitians', icon: 'nutrition-outline', iconActive: 'nutrition' },
  { name: 'feed',     icon: 'newspaper-outline', iconActive: 'newspaper' },
  { name: 'friends',  icon: 'people-outline',    iconActive: 'people' },
  { name: 'profile',  icon: 'person-outline',    iconActive: 'person' },
];

const BAR_PADDING = 6;

const BRAND_ICON_SIZE = 26;

function TabButton({ tab, isActive, onPress }: { tab: typeof TABS[0]; isActive: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const lift = useSharedValue(isActive ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    lift.value = withSpring(isActive ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [isActive]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * lift.value }, { scale: press.value * (1 + 0.12 * lift.value) }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + 0.55 * lift.value,
    transform: [{ translateY: -2 * lift.value }],
  }));

  const handlePress = useCallback(() => {
    press.value = withSpring(0.8, { damping: 6, stiffness: 320 }, () => {
      press.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable style={styles.tabItem} onPress={handlePress}>
      <Animated.View style={iconStyle}>
        {tab.name === 'index' ? (
          <Image
            source={require('../assets/icon.png')}
            style={[styles.brandIcon, { opacity: isActive ? 1 : 0.6 }]}
          />
        ) : (
          <Ionicons
            name={isActive ? tab.iconActive : tab.icon}
            size={22}
            color={isActive ? '#10b981' : '#64748b'}
          />
        )}
      </Animated.View>
      <Animated.Text numberOfLines={1} style={[styles.label, labelStyle, isActive && styles.labelActive]}>
        {t(`tabs.${tab.name}`)}
      </Animated.Text>
    </Pressable>
  );
}

export default function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const x = useSharedValue(0);

  const visible = state.routes.filter((r) => TABS.some((t) => t.name === r.name));
  const tabWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / visible.length : 0;
  const activeIndex = Math.max(
    0,
    visible.findIndex((r) => r.key === state.routes[state.index]?.key)
  );

  useEffect(() => {
    if (tabWidth > 0) x.value = withSpring(BAR_PADDING + activeIndex * tabWidth, { damping: 17, stiffness: 190, mass: 0.9 });
  }, [activeIndex, tabWidth]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.bar} onLayout={onLayout}>
        <LinearGradient
          colors={['#161b24', '#0c0f14']}
          style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
        />
        {tabWidth > 0 && (
          <Animated.View style={[styles.pill, { width: tabWidth }, pillStyle]}>
            <LinearGradient
              colors={['rgba(16,185,129,0.30)', 'rgba(16,185,129,0.08)']}
              style={styles.pillFill}
            />
          </Animated.View>
        )}
        <View style={styles.row}>
          {visible.map((route) => {
            const tab = TABS.find((t) => t.name === route.name)!;
            const isActive = state.routes[state.index]?.key === route.key;
            return (
              <TabButton
                key={route.key}
                tab={tab}
                isActive={isActive}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandIcon: { width: BRAND_ICON_SIZE, height: BRAND_ICON_SIZE, borderRadius: 7 },
  outer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: '#050607',
  },
  bar: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: BAR_PADDING,
    shadowColor: '#10b981',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: 0,
  },
  pillFill: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.35)',
    backgroundColor: 'rgba(255,122,0,0.08)',
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8 },
  label: { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 0.3 },
  labelActive: { color: '#10b981', fontWeight: '900' },
});
