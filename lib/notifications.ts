import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface NotificationSettings {
  streakEnabled: boolean;
  streakHour: number;
  streakMinute: number;
  waterEnabled: boolean;
  motivationEnabled: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  streakEnabled: true,
  streakHour: 20,
  streakMinute: 0,
  waterEnabled: true,
  motivationEnabled: true,
};

const SETTINGS_KEY = '@vitatribe_notification_settings';
const LANGUAGE_KEY = '@app_language';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vitatribe_streak', {
      name: 'Seri & Antrenman Hatırlatıcıları',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('vitatribe_water', {
      name: 'Su Takibi Hatırlatıcıları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200],
      lightColor: '#3b82f6',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('vitatribe_motivation', {
      name: 'Motivasyon Bildirimleri',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#f59e0b',
    });
  }
}

export async function getLocalizedNotificationStrings(langOverride?: string) {
  let locale = langOverride;
  if (!locale) {
    try {
      locale = (await AsyncStorage.getItem(LANGUAGE_KEY)) || 'tr';
    } catch (e) {
      locale = 'tr';
    }
  }

  if (locale === 'en') {
    return {
      streakTitle: "🔥 VitaTribe: Don't Break Your Streak!",
      streakBody: "Don't forget to complete your workout and log your activity today. Keep your streak alive! 💪",
      waterTitle: '💧 VitaTribe Water Time!',
      waterTimes: [
        { hour: 10, minute: 0, body: 'Start your morning with a fresh glass of water to boost your energy! 💧' },
        { hour: 14, minute: 0, body: 'Drink 1 more glass of water to keep your hydration optimal! 💧' },
        { hour: 18, minute: 0, body: 'Have you reached your water goal before your evening workout? 💧' },
        { hour: 21, minute: 0, body: 'Final water reminder of the day! Complete your daily goal. 💧' },
      ],
      motivationTitle: '⚡ VitaTribe Daily Motivation',
      motivations: [
        { hour: 8, minute: 30, body: 'Good morning! Every new day is a fresh opportunity to achieve your fitness goals! 🌅💪' },
        { hour: 12, minute: 30, body: 'Discipline is choosing between what you want now and what you want most! 🚀' },
        { hour: 18, minute: 30, body: 'Workday is over! Time to release stress and crush your workout session! 🏋️‍♂️🔥' },
      ],
      testTitle: '🚀 VitaTribe Test Notification',
      testBody: 'Success! VitaTribe background notifications are working perfectly on your device! 🔥',
    };
  }

  // Turkish default & fallbacks
  return {
    streakTitle: "🔥 VitaTribe: Streak'ini Kaybetme!",
    streakBody: 'Bugünkü antrenmanını ve aktiviteni tamamlamayı unutma. Serini sürdür! 💪',
    waterTitle: '💧 VitaTribe Su Vakti!',
    waterTimes: [
      { hour: 10, minute: 0, body: 'Güne taze bir bardak su ile başlayıp enerjini yükselt! 💧' },
      { hour: 14, minute: 0, body: 'Hidrasyon seviyeni korumak için 1 bardak daha su iç. 💧' },
      { hour: 18, minute: 0, body: 'Antrenman öncesi su hedefine ulaştın mı? Kaydet! 💧' },
      { hour: 21, minute: 0, body: 'Günün son su hatırlatması! Günlük su hedefini tamamla. 💧' },
    ],
    motivationTitle: '⚡ VitaTribe Motivasyon',
    motivations: [
      { hour: 8, minute: 30, body: 'Günaydın! Yeni bir gün, hedeflerine bir adım daha yaklaşmak için harika bir fırsat! 🌅💪' },
      { hour: 12, minute: 30, body: 'Disiplin, ne istediğinle şu an ne istediğin arasındaki seçimdir. Başarmak senin elinde! 🚀' },
      { hour: 18, minute: 30, body: 'Mesai bitti, deşarj vakti! Bugünkü antrenmanını tamamlayıp günün stresini at! 🏋️‍♂️🔥' },
    ],
    testTitle: '🚀 VitaTribe Test Bildirimi',
    testBody: 'Tebrikler! VitaTribe bildirimleri cihazınızda uygulama kapalıyken de sorunsuz çalışıyor! 🔥',
  };
}

export async function registerForPushNotificationsAsync(userId?: string) {
  let token;

  await setupNotificationChannels();

  const perm: any = await Notifications.getPermissionsAsync();
  let finalStatus = perm.status || (perm.granted ? 'granted' : 'denied');

  if (finalStatus !== 'granted') {
    const reqPerm: any = await Notifications.requestPermissionsAsync();
    finalStatus = reqPerm.status || (reqPerm.granted ? 'granted' : 'denied');
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return null;
  }

  if (Device.isDevice) {
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId ?? process.env.EXPO_PUBLIC_PROJECT_ID,
        })
      ).data;

      if (token && userId) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId);
      }
    } catch (e) {
      console.log('Error getting Expo push token:', e);
    }
  }

  return token;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load notification settings', e);
  }
  return DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    await syncNotificationSchedules(settings);
  } catch (e) {
    console.error('Failed to save notification settings', e);
  }
}

export async function syncNotificationSchedules(customSettings?: NotificationSettings) {
  try {
    const settings = customSettings || (await getNotificationSettings());
    const localized = await getLocalizedNotificationStrings();

    // Cancel existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const perm: any = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.status !== 'granted') {
      return;
    }

    // 1. Schedule Daily Streak & Workout Reminder
    if (settings.streakEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: localized.streakTitle,
          body: localized.streakBody,
          sound: true,
          channelId: 'vitatribe_streak',
          data: { screen: 'log' },
        } as any,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: settings.streakHour,
          minute: settings.streakMinute,
        },
      });
    }

    // 2. Schedule Water Hydration Reminders
    if (settings.waterEnabled) {
      for (const time of localized.waterTimes) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: localized.waterTitle,
            body: time.body,
            sound: true,
            channelId: 'vitatribe_water',
            data: { screen: 'water' },
          } as any,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: time.hour,
            minute: time.minute,
          },
        });
      }
    }

    // 3. Schedule Daily Motivation Pushes (Morning 08:30, Noon 12:30, Evening / Post-work 18:30)
    if (settings.motivationEnabled) {
      for (const mot of localized.motivations) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: localized.motivationTitle,
            body: mot.body,
            sound: true,
            channelId: 'vitatribe_motivation',
            data: { screen: '(tabs)' },
          } as any,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: mot.hour,
            minute: mot.minute,
          },
        });
      }
    }
  } catch (e) {
    console.error('Error syncing notification schedules:', e);
  }
}

export async function sendInstantTestNotification() {
  const perm: any = await Notifications.getPermissionsAsync();
  if (!perm.granted && perm.status !== 'granted') {
    const req: any = await Notifications.requestPermissionsAsync();
    if (!req.granted && req.status !== 'granted') {
      alert('Bildirim izni gerekli. Lütfen cihaz ayarlarınızdan izin verin.');
      return false;
    }
  }

  await setupNotificationChannels();
  const localized = await getLocalizedNotificationStrings();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: localized.testTitle,
      body: localized.testBody,
      sound: true,
      channelId: 'vitatribe_streak',
      data: { screen: '(tabs)' },
    } as any,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });

  return true;
}
