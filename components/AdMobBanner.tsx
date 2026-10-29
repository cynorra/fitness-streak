import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../lib/admob';

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
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  if (Platform.OS === 'web' || adFailed) {
    return null;
  }

  const adUnitId = unitId || ADMOB_CONFIG.BANNER_ID;

  return (
    <View style={[styles.container, { maxWidth: width }, style]}>
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
          console.log(`[AdMob Banner] (${adUnitId}):`, error?.message || error);
          setAdFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
