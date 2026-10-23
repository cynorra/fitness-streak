import mobileAds, { AdsConsent, TestIds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

export const ADMOB_CONFIG = {
  BANNER_ID: __DEV__
    ? TestIds.BANNER
    : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-4674211063760769/3783071528'),

  INTERSTITIAL_ID: __DEV__
    ? TestIds.INTERSTITIAL
    : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-4674211063760769/1969570638'),
};

/**
 * Tüm cihazlarda ve işletim sistemi sürümlerinde güvenli başlatma:
 * - UMP rıza diyaloğu (GDPR/KVKK)
 * - Arka planda sessizce SDK başlatma
 */
export async function initializeAds() {
  if (Platform.OS === 'web') return;

  try {
    const consentInfo = await AdsConsent.gatherConsent();
    if (consentInfo.canRequestAds) {
      await mobileAds().initialize();
    }
  } catch (error) {
    console.log('[AdMob] Consent akışı pas geçildi / fallback initialize:', error);
    try {
      await mobileAds().initialize();
    } catch (initError) {
      console.log('[AdMob] Initialize hatası:', initError);
    }
  }

  // Uygulama açılışında interstitial'ı önceden belleğe hazırla
  loadInterstitialAd();
}

let interstitialAd: InterstitialAd | null = null;
let isLoaded = false;
let isFallbackActive = false;

/**
 * Geçiş reklamını (Interstitial) yükler.
 * Canlı reklam hata verirse TestIds.INTERSTITIAL'a geçer (cihazda reklamın çıkmama şansını sıfıra indirir).
 */
export function loadInterstitialAd() {
  if (Platform.OS === 'web') return;

  const activeId = isFallbackActive
    ? TestIds.INTERSTITIAL
    : (ADMOB_CONFIG.INTERSTITIAL_ID || TestIds.INTERSTITIAL);

  try {
    interstitialAd = InterstitialAd.createForAdRequest(activeId, {
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
      console.log(`[AdMob Interstitial] Hata (${activeId}):`, error?.message || error);
      if (!isFallbackActive && activeId !== TestIds.INTERSTITIAL) {
        isFallbackActive = true;
        loadInterstitialAd();
      }
    });

    interstitialAd.load();
  } catch (err) {
    console.log('[AdMob] Interstitial create hatası:', err);
  }
}

/**
 * Antrenman bitişinde veya kritik aksiyonlarda geçiş reklamını güvenle gösterir.
 */
export function showInterstitialAd() {
  if (Platform.OS === 'web') return;

  try {
    if (interstitialAd && isLoaded) {
      interstitialAd.show();
    } else {
      console.log('[AdMob] Interstitial henüz yüklenmedi, yeniden yükleme tetiklendi.');
      loadInterstitialAd();
    }
  } catch (error) {
    console.log('[AdMob] Interstitial gösterim hatası:', error);
  }
}
