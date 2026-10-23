import mobileAds, { AdsConsent, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

export const ADMOB_CONFIG = {
  // Kesinlikle sadece sizin resmi AdMob birimleriniz:
  BANNER_ID: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-4674211063760769/3783071528',
  INTERSTITIAL_ID: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-4674211063760769/1969570638',
};

/**
 * AdMob SDK başlatma
 */
export async function initializeAds() {
  if (Platform.OS === 'web') return;

  try {
    const consentInfo = await AdsConsent.gatherConsent();
    if (consentInfo.canRequestAds) {
      await mobileAds().initialize();
    }
  } catch (error) {
    try {
      await mobileAds().initialize();
    } catch (initError) {
      console.log('[AdMob] Init hatası:', initError);
    }
  }

  loadInterstitialAd();
}

let interstitialAd: InterstitialAd | null = null;
let isLoaded = false;

/**
 * Yalnızca resmi geçiş reklamınızı yükler.
 */
export function loadInterstitialAd() {
  if (Platform.OS === 'web') return;
  if (!ADMOB_CONFIG.INTERSTITIAL_ID) return;

  try {
    interstitialAd = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded = false;
      loadInterstitialAd();
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      isLoaded = false;
      console.log('[AdMob Interstitial] Hata:', error?.message || error);
    });

    interstitialAd.load();
  } catch (err) {
    console.log('[AdMob] Interstitial oluşturma hatası:', err);
  }
}

/**
 * Sadece resmi geçiş reklamınızı gösterir.
 */
export function showInterstitialAd() {
  if (Platform.OS === 'web') return;

  try {
    if (interstitialAd && isLoaded) {
      interstitialAd.show();
    } else {
      loadInterstitialAd();
    }
  } catch (error) {
    console.log('[AdMob] Interstitial gösterme hatası:', error);
  }
}
