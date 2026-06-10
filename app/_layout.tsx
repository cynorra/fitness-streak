import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { I18nProvider } from '../lib/i18n/i18n';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
    SplashScreen.hideAsync();
  }, [session, loading, segments]);

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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <I18nProvider>
          <RootLayoutNav />
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
