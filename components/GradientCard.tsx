import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Accent colour used for the glowing hairline border and shadow. */
  accent?: string;
  radius?: number;
  padding?: number;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Premium surface: subtle gradient fill, gradient hairline border and a soft coloured glow. */
export default function GradientCard({ children, style, accent = '#10b981', radius = 24, padding = 20, contentStyle }: Props) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          shadowColor: accent,
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[accent + '66', 'rgba(255,255,255,0.06)', accent + '1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius, padding: 1 }}
      >
        <LinearGradient
          colors={['#161b24', '#0e1218']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: radius - 1, padding }, contentStyle]}
        >
          {children}
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

export const cardSurface = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
});
