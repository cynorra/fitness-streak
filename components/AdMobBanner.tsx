import React, { useState } from 'react';
import { StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMOB_CONFIG } from '../lib/admob';
import { useTranslation } from '../lib/i18n/i18n';

interface AdMobBannerProps {
  style?: ViewStyle;
  unitId?: string;
  size?: BannerAdSize;
}

export default function AdMobBanner({ style, unitId, size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdMobBannerProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const { t, locale } = useTranslation();
  const [adFailed, setAdFailed] = useState(false);

  const adUnitId = unitId || ADMOB_CONFIG.BANNER_ID;

  // No placeholder "ad" when a real ad is unavailable (offline / no fill): fake ad-like boxes violate AdMob policy.
  if (Platform.OS === 'web' || adFailed) {
    return null;
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
