import { TestIds, InterstitialAd, AdRequest, BannerAdSize } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// AdMob Unit IDs (Geliştirme / Test ID'leri - Canlıya alırken kendi AdMob ID'lerinizle değiştirin)
export const ADMOB_CONFIG = {
  // Test IDs
  BANNER_ID: __DEV__ || Platform.OS !== 'android'
    ? TestIds.BANNER 
    : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TestIds.BANNER),
  
  INTERSTITIAL_ID: __DEV__ || Platform.OS !== 'android'
    ? TestIds.INTERSTITIAL 
    : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL),

  REWARDED_ID: __DEV__ || Platform.OS !== 'android'
    ? TestIds.REWARDED 
    : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || TestIds.REWARDED),
};

// Interstitial Ad Helper
let interstitialAd: InterstitialAd | null = null;

export function loadInterstitialAd() {
  try {
    interstitialAd = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialAd.load();
  } catch (error) {
    console.log('[AdMob] Interstitial yükleme hatası:', error);
  }
}

export function showInterstitialAd() {
  try {
    if (interstitialAd && interstitialAd.loaded) {
      interstitialAd.show();
      loadInterstitialAd(); // Gösterdikten sonra yenisini yükle
    } else {
      console.log('[AdMob] Interstitial reklam henüz hazır değil.');
      loadInterstitialAd();
    }
  } catch (error) {
    console.log('[AdMob] Interstitial gösterme hatası:', error);
  }
}
