import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { View, ActivityIndicator } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';

// Splash ekranının otomatik kapanmasını engelliyoruz
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

    // Yükleme (auth kontrolü) bittiğinde native splash ekranını gizle
    SplashScreen.hideAsync();
  }, [session, loading, segments]);

  if (loading) {
    // Auth kontrolü bitene kadar UI çizmiyoruz, çünkü üstte hala Native Splash Screen duruyor
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="messages" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="log" options={{ presentation: 'modal' }} />
      <Stack.Screen name="history" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
