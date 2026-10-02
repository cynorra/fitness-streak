import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { ActivityLocation } from '../lib/useLocationTracking';

interface MapTrackerProps {
  locations: ActivityLocation[];
  isTracking: boolean;
}

const PADDING = 48;

// Draws the recorded route on a plain canvas. A real map tile view (react-native-maps) needs a
// Google Maps API key in the Android manifest and hard-crashes the app without one.
export default function MapTracker({ locations, isTracking }: MapTrackerProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  let points: { x: number; y: number }[] = [];
  if (locations.length > 0 && size.w > 0) {
    const lats = locations.map((l) => l.latitude);
    const lons = locations.map((l) => l.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    // Longitude degrees shrink with latitude; keep the route's aspect ratio correct.
    const lonScale = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    const spanX = Math.max((maxLon - minLon) * lonScale, 1e-5);
    const spanY = Math.max(maxLat - minLat, 1e-5);
    const availW = size.w - PADDING * 2;
    const availH = size.h - PADDING * 2;
    const scale = Math.min(availW / spanX, availH / spanY);
    const offsetX = (size.w - spanX * scale) / 2;
    const offsetY = (size.h - spanY * scale) / 2;
    points = locations.map((l) => ({
      x: offsetX + (l.longitude - minLon) * lonScale * scale,
      y: offsetY + (maxLat - l.latitude) * scale,
    }));
  }

  const last = points[points.length - 1];

  return (
    <View style={styles.container} onLayout={onLayout}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Line key={`h${i}`} x1={0} x2={size.w} y1={(size.h / 8) * i} y2={(size.h / 8) * i} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <Line key={`v${i}`} y1={0} y2={size.h} x1={(size.w / 6) * i} x2={(size.w / 6) * i} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          ))}
          {points.length > 1 && (
            <Polyline
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.length > 0 && <Circle cx={points[0].x} cy={points[0].y} r={7} fill="#3b82f6" stroke="#fff" strokeWidth={2} />}
          {last && points.length > 1 && (
            <Circle cx={last.x} cy={last.y} r={8} fill={isTracking ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth={2} />
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1117',
  },
});
