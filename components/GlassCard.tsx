import React from 'react';
import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: readonly [string, string, ...string[]];
  borderColor?: string;
  onPress?: () => void;
  interactive?: boolean;
}

export default function GlassCard({
  children,
  style,
  gradientColors = ['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.02)'],
  borderColor = 'rgba(255, 255, 255, 0.12)',
  onPress,
  interactive = false,
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (interactive || onPress) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (interactive || onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const Container = onPress || interactive ? Animated.createAnimatedComponent(Pressable) : Animated.View;

  return (
    <Container
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress ? handlePress : undefined}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.glass, { borderColor }]}
      >
        {children}
      </LinearGradient>
    </Container>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
});
