import * as Localization from 'expo-localization';
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
  dietitianEnabled: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  streakEnabled: true,
  streakHour: 20,
  streakMinute: 0,
  waterEnabled: true,
  motivationEnabled: true,
  dietitianEnabled: true,
};

const SETTINGS_KEY = '@vitatribe_notification_settings';
const LAST_LOG_KEY = '@vitatribe_last_workout_log_date';
const PROFILE_CACHE_KEY = '@vitatribe_profile_cache';
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

async function resolveLocale(): Promise<'tr' | 'en'> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
    return Localization.getLocales()?.[0]?.languageCode === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    const en = (await resolveLocale()) === 'en';
    await Notifications.setNotificationChannelAsync('vitatribe_streak', {
      name: en ? 'Streak & Workout Reminders' : 'Seri & Antrenman Hatırlatıcıları',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('vitatribe_water', {
      name: en ? 'Water Tracking Reminders' : 'Su Takibi Hatırlatıcıları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200],
      lightColor: '#3b82f6',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('vitatribe_motivation', {
      name: en ? 'Motivation Notifications' : 'Motivasyon Bildirimleri',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#f59e0b',
    });

    await Notifications.setNotificationChannelAsync('vitatribe_dietitian', {
      name: en ? 'Dietitian Reminders' : 'Diyetisyen Hatırlatıcıları',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#8b5cf6',
    });

    // Remote pushes (likes, comments, messages, client requests)
    await Notifications.setNotificationChannelAsync('vitatribe_social', {
      name: en ? 'Social & Messages' : 'Sosyal & Mesajlar',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });
  }
}

export async function getLocalizedNotificationStrings(langOverride?: string) {
  let locale = langOverride;
  if (!locale) {
    try {
      const systemDefault = Localization.getLocales()?.[0]?.languageCode === 'tr' ? 'tr' : 'en';
      locale = (await AsyncStorage.getItem(LANGUAGE_KEY)) || systemDefault;
    } catch (e) {
      locale = 'en';
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
      comebackTitle: '👋 VitaTribe misses you!',
      comebacks: [
        { days: 3, body: "It's been 3 days. One short workout is enough to get your streak rolling again! 🌱" },
        { days: 7, body: 'A week already! Your tribe is still training — come back and log today. 💪' },
        { days: 14, body: 'Your goals are still waiting for you. Start again with a 10-minute session! 🔥' },
      ],
      dietitianTitle: '🥗 VitaTribe for Dietitians',
      dietitianDaily: 'Good morning! Check your clients’ latest logs and answer their messages. 📋',
      dietitianPending: 'Review pending client requests and appointments before the day ends. ✅',
      dietitianWeekly: 'Plan next week: update your clients’ meal plans and goals. 🗓️',
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
    comebackTitle: '👋 VitaTribe seni özledi!',
    comebacks: [
      { days: 3, body: '3 gündür yoksun. Serini yeniden başlatmak için kısa bir antrenman yeter! 🌱' },
      { days: 7, body: 'Bir hafta oldu! Kabilen antrenmana devam ediyor, sen de gel ve bugünü kaydet. 💪' },
      { days: 14, body: 'Hedeflerin seni bekliyor. 10 dakikalık bir seansla yeniden başla! 🔥' },
    ],
    dietitianTitle: '🥗 VitaTribe Diyetisyen',
    dietitianDaily: 'Günaydın! Danışanlarının son kayıtlarına göz at ve mesajlarını yanıtla. 📋',
    dietitianPending: 'Gün bitmeden bekleyen danışan taleplerini ve randevularını gözden geçir. ✅',
    dietitianWeekly: 'Haftayı planla: danışanlarının beslenme planlarını ve hedeflerini güncelle. 🗓️',
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
        // Separate update: tolerated failing until the app_language column migration has been run.
        await supabase
          .from('profiles')
          .update({ app_language: await resolveLocale() })
          .eq('id', userId);
      }
    } catch (e) {
      console.log('Error getting Expo push token:', e);
    }
  }

  return token;
}

// Keeps the server-side push language (profiles.app_language) in step with the in-app language.
export async function syncPushLanguage() {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (uid) await supabase.from('profiles').update({ app_language: await resolveLocale() }).eq('id', uid);
  } catch {}
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

const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Called after a workout is saved: today's streak reminder is skipped and schedules are rebuilt.
export async function markWorkoutLoggedToday() {
  try {
    await AsyncStorage.setItem(LAST_LOG_KEY, localDateKey(new Date()));
  } catch {}
  await syncNotificationSchedules();
}

async function getCachedRole(): Promise<string | null> {
  try {
    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached)?.role ?? null : null;
  } catch {
    return null;
  }
}

// Serialize syncs: concurrent cancelAll + schedule calls would otherwise duplicate or drop reminders.
let syncChain: Promise<void> = Promise.resolve();

export function syncNotificationSchedules(customSettings?: NotificationSettings): Promise<void> {
  syncChain = syncChain.then(() => syncNow(customSettings)).catch(() => {});
  return syncChain;
}

async function syncNow(customSettings?: NotificationSettings) {
  try {
    const settings = customSettings || (await getNotificationSettings());
    const localized = await getLocalizedNotificationStrings();

    await setupNotificationChannels();

    // Cancel existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const perm: any = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.status !== 'granted') {
      return;
    }

    const now = new Date();
    const T = Notifications.SchedulableTriggerInputTypes;

    // 1. Daily Streak & Workout Reminder (weekly triggers so today's can be skipped once a workout is logged)
    if (settings.streakEnabled) {
      const lastLog = await AsyncStorage.getItem(LAST_LOG_KEY).catch(() => null);
      const loggedToday = lastLog === localDateKey(now);
      const todayWeekday = now.getDay() + 1; // expo: 1 = Sunday
      const todayReminder = new Date(now);
      todayReminder.setHours(settings.streakHour, settings.streakMinute, 0, 0);
      const todayStillAhead = todayReminder.getTime() > now.getTime();

      for (let weekday = 1; weekday <= 7; weekday++) {
        if (weekday === todayWeekday && loggedToday && todayStillAhead) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: localized.streakTitle,
            body: localized.streakBody,
            sound: true,
            channelId: 'vitatribe_streak',
            data: { screen: 'log' },
          } as any,
          trigger: { type: T.WEEKLY, weekday, hour: settings.streakHour, minute: settings.streakMinute },
        });
      }
      if (loggedToday && todayStillAhead) {
        // Keep next week's same-weekday reminder alive (the repeating one was skipped above).
        const nextWeek = new Date(todayReminder.getTime() + 7 * 24 * 3600 * 1000);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: localized.streakTitle,
            body: localized.streakBody,
            sound: true,
            channelId: 'vitatribe_streak',
            data: { screen: 'log' },
          } as any,
          trigger: { type: T.DATE, date: nextWeek },
        });
      }
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

    // 4. Win-back: rescheduled on every app open, so they only ever fire if the user stays away.
    if (settings.motivationEnabled) {
      for (const cb of localized.comebacks) {
        const when = new Date(now);
        when.setDate(when.getDate() + cb.days);
        when.setHours(18, 0, 0, 0);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: localized.comebackTitle,
            body: cb.body,
            sound: true,
            channelId: 'vitatribe_motivation',
            data: { screen: 'log' },
          } as any,
          trigger: { type: T.DATE, date: when },
        });
      }
    }

    // 5. Dietitian-only reminders
    if (settings.dietitianEnabled && (await getCachedRole()) === 'dietitian') {
      const dietitianContent = (body: string, screen: string) =>
        ({ title: localized.dietitianTitle, body, sound: true, channelId: 'vitatribe_dietitian', data: { screen } } as any);

      await Notifications.scheduleNotificationAsync({
        content: dietitianContent(localized.dietitianDaily, 'dietitian/clients'),
        trigger: { type: T.DAILY, hour: 9, minute: 0 },
      });
      for (const weekday of [2, 3, 4, 5, 6]) { // Mon–Fri
        await Notifications.scheduleNotificationAsync({
          content: dietitianContent(localized.dietitianPending, 'appointments'),
          trigger: { type: T.WEEKLY, weekday, hour: 16, minute: 30 },
        });
      }
      await Notifications.scheduleNotificationAsync({
        content: dietitianContent(localized.dietitianWeekly, 'dietitian/clients'),
        trigger: { type: T.WEEKLY, weekday: 1, hour: 19, minute: 0 }, // Sunday
      });
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
      alert(
        (await resolveLocale()) === 'en'
          ? 'Notification permission is required. Please allow it in your device settings.'
          : 'Bildirim izni gerekli. Lütfen cihaz ayarlarınızdan izin verin.'
      );
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
