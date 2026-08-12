import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });
  }

  if (Device.isDevice) {
    const perm: any = await Notifications.getPermissionsAsync();
    let finalStatus = perm.status || (perm.granted ? 'granted' : 'denied');

    if (finalStatus !== 'granted') {
      const reqPerm: any = await Notifications.requestPermissionsAsync();
      finalStatus = reqPerm.status || (reqPerm.granted ? 'granted' : 'denied');
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        })
      ).data;

      // Save token to Supabase profiles
      if (token && userId) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId);
      }
    } catch (e) {
      console.log('Error getting push token', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
