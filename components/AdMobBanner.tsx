import React, { useState } from 'react';
import { StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMOB_CONFIG } from '../lib/admob';

interface AdMobBannerProps {
  style?: ViewStyle;
  unitId?: string;
  size?: BannerAdSize;
}

export default function AdMobBanner({ style, unitId, size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdMobBannerProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  const adUnitId = unitId || ADMOB_CONFIG.BANNER_ID;

  if (Platform.OS === 'web' || adFailed) {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
          style={styles.gradient}
        >
          <View style={styles.adHeader}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>SPONSORLU</Text>
            </View>
          </View>
          <Text style={styles.adText}>🎯 VitaTribe Premium & Fitness İpuçları</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error) => {
          console.log('[AdMob Banner] Yüklenemedi:', error);
          setAdFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    padding: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
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
