import mobileAds, { AdsConsent, InterstitialAd, AdEventType, MaxAdContentRating } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

export const ADMOB_CONFIG = {
  // Always the real AdMob units, in every build type.
  BANNER_ID: (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '').trim() || 'ca-app-pub-4674211063760769/3783071528',
  INTERSTITIAL_ID: (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || '').trim() || 'ca-app-pub-4674211063760769/1969570638',
};

let adsInitialized = false;
let initPromise: Promise<void> | null = null;
const readyListeners = new Set<() => void>();

export function onAdsReady(cb: () => void): () => void {
  if (adsInitialized) {
    cb();
    return () => {};
  }
  readyListeners.add(cb);
  return () => {
    readyListeners.delete(cb);
  };
}

function notifyAdsReady() {
  adsInitialized = true;
  readyListeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
  readyListeners.clear();
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AdMob timeout')), ms)),
  ]);

/**
 * AdMob SDK başlatma
 */
export async function initializeAds() {
  if (Platform.OS === 'web') return;
  if (adsInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await mobileAds()
        .setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.G,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        })
        .catch(() => {});

      try {
        await withTimeout(AdsConsent.gatherConsent(), 5000);
      } catch (_consentErr) {
        // Proceed with SDK initialization even if UMP is not configured or times out
      }

      await withTimeout(mobileAds().initialize(), 8000);
    } catch (error) {
      try {
        await mobileAds().initialize();
      } catch (initError) {
        console.log('[AdMob] Init hatası:', initError);
      }
    } finally {
      notifyAdsReady();
      loadInterstitialAd();
    }
  })();

  return initPromise;
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
      requestNonPersonalizedAdsOnly: false,
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
