import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  name: IconName;
  color?: string;
  /** Tile size in px; glyph scales proportionally. */
  size?: number;
  /** Draw only the glyph, without the 3D frosted glass tile. */
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * 2026+ Frosted Glass & Ambient Neon Icon Tile:
 * - Kaba, düz renkli `color + '22'` kutular yerine çok katmanlı mikro degrade
 * - Ultra ince cam yansıması (specular highlight border: rgba(255,255,255,0.18))
 * - Neon ışıma tabanı (subtle ambient shadow)
 */
export default function AppIcon({
  name,
  color = '#ff7a00',
  size = 42,
  bare = false,
  style,
}: AppIconProps) {
  if (bare) {
    return <Ionicons name={name} size={size} color={color} style={style as any} />;
  }

  const glyphSize = Math.round(size * 0.52);
  const borderRadius = Math.round(size * 0.32);

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Soft Ambient Neon Glow Behind */}
      <View
        style={[
          styles.ambientGlow,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.8) / 2,
            backgroundColor: color,
          },
        ]}
      />

      {/* Frosted Dark Glass Tile */}
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius,
            borderColor: 'rgba(255,255,255,0.12)',
          },
        ]}
      >
        {/* Subtle Tint Glow inside */}
        <LinearGradient
          colors={[color + '33', color + '08']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />

        {/* Vector Glyph */}
        <Ionicons name={name} size={glyphSize} color={color} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    opacity: 0.28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
