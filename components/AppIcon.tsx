import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  name: IconName;
  color?: string;
  /** Tile (background) size in px; the glyph is drawn at ~55% of it. */
  size?: number;
  /** Draw only the glyph, with no tinted rounded tile behind it. */
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Consistent icon: a softly tinted rounded tile with a vector glyph (replaces emoji icons). */
export default function AppIcon({ name, color = '#10b981', size = 40, bare = false, style }: AppIconProps) {
  if (bare) return <Ionicons name={name} size={size} color={color} style={style as any} />;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: color + '22',
          borderWidth: 1,
          borderColor: color + '44',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.55)} color={color} />
    </View>
  );
}
