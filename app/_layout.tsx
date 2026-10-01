import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { I18nProvider } from '../lib/i18n/i18n';
import { View, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, syncNotificationSchedules } from '../lib/notifications';
import { initializeAds } from '../lib/admob';
import OfflineBanner from '../components/OfflineBanner';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, profile, loading, profileLoadFailed } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = (segments[0] as string) === '(auth)';
    const isOnboarding = (segments[0] as string) === 'onboarding';

    if (!session && !inAuthGroup && !isOnboarding) {
      router.replace('/(auth)/login');
    } else if (session && !(profileLoadFailed && !profile)) {
      if (!profile?.onboarding_completed && !isOnboarding) {
        router.replace('/onboarding' as any);
      } else if (profile?.onboarding_completed && (inAuthGroup || isOnboarding)) {
        router.replace('/(tabs)');
      }
    }
    
    SplashScreen.hideAsync();
  }, [session, loading, segments, profile?.onboarding_completed]);

  // Register push + rebuild reminders once per login/role change (not on every navigation).
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId || !profile) return;
    registerForPushNotificationsAsync(userId).catch((e) => console.log('[Push] register failed:', e));
    syncNotificationSchedules().catch((e) => console.log('[Push] sync failed:', e));
  }, [userId, !!profile, profile?.role]);

  // Rebuild reminders whenever the app returns to the foreground (resets win-back timers, picks up day change).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && userId) syncNotificationSchedules().catch(() => {});
    });
    return () => sub.remove();
  }, [userId]);

  // Notification that cold-started the app.
  const handledLaunch = useRef(false);
  useEffect(() => {
    if (loading || !session || handledLaunch.current) return;
    handledLaunch.current = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        const screen = response?.notification.request.content.data?.screen;
        if (screen) setTimeout(() => router.push(`/${screen}` as any), 400);
      })
      .catch(() => {});
  }, [loading, session]);

  useEffect(() => {
    initializeAds().catch((e) => console.log('[AdMob] init failed:', e));
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen) {
        router.push(`/${data.screen}` as any);
      }
    });

    return () => subscription.remove();
  }, []);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth ekranları: alttan yukarı slide */}
      <Stack.Screen
        name="(auth)"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 350,
        }}
      />

      {/* Ana tab ekranı: fade geçiş */}
      <Stack.Screen
        name="(tabs)"
        options={{
          animation: 'fade',
          animationDuration: 300,
        }}
      />

      {/* Mesajlar: sağdan sola */}
      <Stack.Screen
        name="messages"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* Chat: sağdan sola */}
      <Stack.Screen
        name="chat/[id]"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* Antrenman logu: modal (alttan yukarı) */}
      <Stack.Screen
        name="log"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 380,
        }}
      />

      {/* Geçmiş: alttan yukarı */}
      <Stack.Screen
        name="history"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 350,
        }}
      />

      {/* Tracker: sağdan sola */}
      <Stack.Screen
        name="tracker"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* Su Takibi: alttan yukarı */}
      <Stack.Screen
        name="water"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 350,
        }}
      />

      {/* Oruç Takibi: sağdan sola */}
      <Stack.Screen
        name="fasting"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* Streak Mağazası: modal */}
      <Stack.Screen
        name="store"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 380,
        }}
      />

      {/* Analiz & Grafikler: sağdan sola */}
      <Stack.Screen
        name="analytics"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* Blog & İçerikler: sağdan sola */}
      <Stack.Screen
        name="blog"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />

      {/* Bildirim & Hatırlatıcı Ayarları: sağdan sola */}
      <Stack.Screen
        name="notification-settings"
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <I18nProvider>
          <RootLayoutNav />
          <OfflineBanner />
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
