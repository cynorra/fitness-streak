import React from 'react';
import { StyleSheet, View, Image, ImageStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface StreakFitLogoProps {
  size?: number;
  animated?: boolean;
  style?: ImageStyle;
}

/**
 * StreakFit'in asıl kurumsal logosu (assets/icon.png):
 * Koyu zemin üzerinde yanan fütüristik alev S amblemi.
 */
export default function StreakFitLogo({ size = 48, animated = false, style }: StreakFitLogoProps) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.4);

  React.useEffect(() => {
    if (animated) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {animated && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: size * 1.3,
              height: size * 1.3,
              borderRadius: (size * 1.3) / 2,
            },
            glowStyle,
          ]}
        />
      )}
      <Animated.View style={animated ? animStyle : undefined}>
        <Image
          source={require('../assets/icon.png')}
          style={[
            {
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.22),
            },
            style,
          ]}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 122, 0, 0.35)',
    shadowColor: '#ff7a00',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
});
