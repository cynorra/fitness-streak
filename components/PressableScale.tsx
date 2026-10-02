import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Stagger index: when set, the element fades/slides in with a delay of index * 50ms. */
  index?: number;
  disabled?: boolean;
}

/** Pressable that springs down on touch and (optionally) animates in on mount. */
export default function PressableScale({ children, onPress, style, index, disabled }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      entering={index !== undefined ? FadeInUp.delay(Math.min(index, 12) * 50).duration(380).springify().damping(16) : undefined}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
