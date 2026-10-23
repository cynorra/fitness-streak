import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../lib/admob';

interface AdMobBannerProps {
  style?: ViewStyle;
  unitId?: string;
  size?: BannerAdSize;
}

/**
 * 2026+ Universal Adaptive Banner:
 * - ANCHORED_ADAPTIVE_BANNER boyutu küçük ekranlardan büyük tabletlere (Fold, Tablet, vb.)
 *   cihaz genişliğine göre pikseli otomatik hesaplar.
 * - Canlı reklam gelmezse veya onay/bölge gecikmesi olursa TestIds.BANNER devreye girer.
 * - Asla ekran düzenini kaydırmaz, taşma yapmaz (overflow hidden, responsive min-height).
 */
export default function AdMobBanner({
  style,
  unitId,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: AdMobBannerProps) {
  const { width } = useWindowDimensions();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const [useTestFallback, setUseTestFallback] = useState(false);

  // Web'de veya iki deneme de başarısızsa render etme
  if (Platform.OS === 'web' || adFailed) {
    return null;
  }

  const primaryUnitId = unitId || ADMOB_CONFIG.BANNER_ID;
  const activeUnitId = useTestFallback ? TestIds.BANNER : primaryUnitId;

  return (
    <View style={[styles.container, { maxWidth: width }, style]}>
      <BannerAd
        unitId={activeUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error) => {
          console.log(`[AdMob Banner] Yüklenemedi (${activeUnitId}):`, error?.message || error);
          if (!useTestFallback && activeUnitId !== TestIds.BANNER) {
            // Canlı reklam envanteri henüz oluşmadıysa veya cihaz testi engelliyorsa test reklamına geç
            setUseTestFallback(true);
          } else {
            setAdFailed(true);
          }
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
