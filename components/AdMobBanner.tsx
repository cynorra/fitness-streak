import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG, initializeAds, onAdsReady } from '../lib/admob';

const RETRY_DELAY_MS = 25000;

interface AdMobBannerProps {
  style?: ViewStyle;
  unitId?: string;
  size?: BannerAdSize;
}

/**
 * DietitianFit Official AdMob Banner:
 * - Yalnızca sizin resmi AdMob Reklam Biriminiz (ca-app-pub-4674211063760769/3783071528) çalışır.
 * - TestIds kesinlikle gösterilmez.
 * - Tüm cihazlara (telefon/tablet) otomatik uyum sağlayan ANCHORED_ADAPTIVE_BANNER kullanılır.
 * - Reklam gelmediği anlarda ekran düzenini bozmaz (sessizce gizlenir, asla hata vermez).
 */
export default function AdMobBanner({
  style,
  unitId,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: AdMobBannerProps) {
  const { width } = useWindowDimensions();
  const [sdkReady, setSdkReady] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeAds();
    const unsub = onAdsReady(() => setSdkReady(true));
    return () => {
      unsub();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  if (Platform.OS === 'web' || width === 0 || !sdkReady) {
    return null;
  }

  const adUnitId = (unitId || ADMOB_CONFIG.BANNER_ID).trim();

  return (
    <View
      pointerEvents={adLoaded ? 'auto' : 'none'}
      style={[
        styles.container,
        { maxWidth: width, overflow: 'hidden' },
        adLoaded ? style : styles.pending,
      ]}
    >
      <BannerAd
        key={attempt}
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error) => {
          console.log(`[AdMob Banner] (${adUnitId}):`, error?.message || error);
          setAdLoaded(false);
          if (retryTimer.current) clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(() => {
            setAttempt((n) => n + 1);
          }, RETRY_DELAY_MS);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pending: {
    height: 1,
    opacity: 0,
    marginVertical: 0,
  },
  container: {
    width: '100%',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
