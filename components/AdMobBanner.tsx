import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AdMobBannerProps {
  style?: ViewStyle;
  adUnitID?: string;
}

/**
 * Google AdMob Banner Component
 * Configured for AdMob App ID & Banner Unit ID.
 */
export default function AdMobBanner({ style, adUnitID }: AdMobBannerProps) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.gradient}
      >
        <View style={styles.adHeader}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>SPONSORLU • ADMOB</Text>
          </View>
        </View>
        <Text style={styles.adText}>🎯 Fitness & Sağlıklı Beslenme İpuçları</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gradient: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adBadge: {
    backgroundColor: '#fbbf2420',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  adBadgeText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  adText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
