import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  /** Main glow colour (top-left orb). */
  primary?: string;
  /** Secondary glow colour (bottom-right orb). */
  secondary?: string;
};

function Orb({ color, size, style, driftX, driftY, duration }: {
  color: string; size: number; style: any; driftX: number; driftY: number; duration: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, []);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: p.value * driftX }, { translateY: p.value * driftY }, { scale: 1 + p.value * 0.08 }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style, anim]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.32" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

/** Deep dark backdrop with two slowly drifting colour glows. Place as the first child of a screen. */
export default function AmbientBackground({ primary = '#10b981', secondary = '#6366f1' }: Props) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#080b10', '#06080c', '#050607']} style={StyleSheet.absoluteFill} />
      <Orb color={primary} size={width * 1.3} style={{ top: -width * 0.5, left: -width * 0.4 }} driftX={40} driftY={30} duration={7000} />
      <Orb color={secondary} size={width * 1.1} style={{ top: height * 0.55, right: -width * 0.5 }} driftX={-30} driftY={-40} duration={9000} />
    </View>
  );
}
