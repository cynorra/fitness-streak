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
  // Pre/post-workout nutrition nudges, anchored to the user's usual training time (off until chosen).
  workoutNutritionEnabled: boolean;
  workoutHour: number;
  workoutMinute: number;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  streakEnabled: true,
  streakHour: 20,
  streakMinute: 0,
  waterEnabled: true,
  motivationEnabled: true,
  dietitianEnabled: true,
  workoutNutritionEnabled: false,
  workoutHour: 18,
  workoutMinute: 0,
};

const SETTINGS_KEY = '@vitatribe_notification_settings';
const LAST_LOG_KEY = '@vitatribe_last_workout_log_date';
const PROFILE_CACHE_KEY = '@vitatribe_profile_cache';
const LANGUAGE_KEY = '@app_language';

// Conversation currently open on screen: its own incoming-message pushes are not shown on top of it.
let activeChatId: string | null = null;
export function setActiveChat(id: string | null) {
  activeChatId = id;
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const screen = notification.request.content.data?.screen;
    const inOpenChat = !!activeChatId && screen === `chat/${activeChatId}`;
    return {
      shouldShowAlert: !inOpenChat,
      shouldPlaySound: !inOpenChat,
      shouldSetBadge: !inOpenChat,
      shouldShowBanner: !inOpenChat,
      shouldShowList: !inOpenChat,
    };
  },
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
      streakTitle: "🔥 DietitianFit: Don't Break Your Streak!",
      streakBody: "Don't forget to complete your workout and log your activity today. Keep your streak alive! 💪",
      waterTitle: '💧 DietitianFit Water Time!',
      waterTimes: [
        { hour: 10, minute: 30, body: 'Start your morning with a fresh glass of water to boost your energy! 💧' },
        { hour: 15, minute: 30, body: 'Drink 1 more glass of water to keep your hydration optimal! 💧' },
        { hour: 18, minute: 30, body: 'Have you reached your water goal before your evening workout? 💧' },
        { hour: 21, minute: 0, body: 'Final water reminder of the day! Complete your daily goal. 💧' },
      ],
      motivationTitle: '⚡ DietitianFit Daily Motivation',
      // Each slot rotates through its variants by weekday so the text never feels repetitive.
      motivations: [
        { hour: 8, minute: 30, bodies: [
          'Good morning! Every new day is a fresh opportunity to achieve your fitness goals! 🌅💪',
          'Rise and shine! Small steps today build the body you want tomorrow. ☀️',
          'New day, clean slate. What is the one healthy thing you will do first? 🌱',
          'Your future self is already thanking you for moving today. Let’s go! 🚀',
        ] },
        { hour: 12, minute: 30, bodies: [
          'Discipline is choosing between what you want now and what you want most! 🚀',
          'Halfway through the day — a quick walk or stretch resets your energy. 🚶‍♂️',
          'Fuel up smart at lunch: protein, veggies, water. Your body will thank you! 🥗',
          'Motivation gets you started, habit keeps you going. Keep the streak alive! 🔥',
        ] },
        { hour: 17, minute: 0, bodies: [
          'Workday is over! Time to release stress and crush your workout session! 🏋️‍♂️🔥',
          'Even 15 minutes counts. Put on your shoes and start — the rest follows! 👟',
          'Your tribe is training right now. Join them and log today’s session! 💪',
          'Tired? That is exactly when a workout gives you the most back. ⚡',
        ] },
      ],
      mealTitle: '🍽️ DietitianFit Nutrition',
      mealReminder: { hour: 14, minute: 0, bodies: [
        'Had lunch? Log your meal in 10 seconds and stay on track! 🥗',
        'A quick meal log keeps your nutrition goals honest. Add today’s lunch! 📝',
        'What’s on your plate today? Log it and see how your macros are doing. 🍎',
      ] },
      testTitle: '🚀 DietitianFit Test Notification',
      testBody: 'Success! DietitianFit background notifications are working perfectly on your device! 🔥',
      workoutPreTitle: '⏱️ Pre-workout fuel',
      workoutPre: '2 hours to your workout: time for ~40 g of complex carbs (oats, rice, banana) for steady energy. 🍌',
      workoutPostTitle: '🔋 Recovery window',
      workoutPost: 'Recovery window is open: aim for ~25 g of protein plus some carbs within the next hour. 🥛',
      comebackTitle: '👋 DietitianFit misses you!',
      comebacks: [
        { days: 3, body: "It's been 3 days. One short workout is enough to get your streak rolling again! 🌱" },
        { days: 7, body: 'A week already! Your tribe is still training — come back and log today. 💪' },
        { days: 14, body: 'Your goals are still waiting for you. Start again with a 10-minute session! 🔥' },
      ],
      dietitianTitle: '🥗 DietitianFit for Dietitians',
      dietitianDaily: 'Good morning! Check your clients’ latest logs and answer their messages. 📋',
      dietitianPending: 'Review pending client requests and appointments before the day ends. ✅',
      dietitianWeekly: 'Plan next week: update your clients’ meal plans and goals. 🗓️',
    };
  }

  // Turkish default & fallbacks
  return {
    streakTitle: "🔥 DietitianFit: Streak'ini Kaybetme!",
    streakBody: 'Bugünkü antrenmanını ve aktiviteni tamamlamayı unutma. Serini sürdür! 💪',
    waterTitle: '💧 DietitianFit Su Vakti!',
    waterTimes: [
      { hour: 10, minute: 30, body: 'Güne taze bir bardak su ile başlayıp enerjini yükselt! 💧' },
      { hour: 15, minute: 30, body: 'Hidrasyon seviyeni korumak için 1 bardak daha su iç. 💧' },
      { hour: 18, minute: 30, body: 'Antrenman öncesi su hedefine ulaştın mı? Kaydet! 💧' },
      { hour: 21, minute: 0, body: 'Günün son su hatırlatması! Günlük su hedefini tamamla. 💧' },
    ],
    motivationTitle: '⚡ DietitianFit Motivasyon',
    // Her zaman dilimi, haftanın gününe göre farklı metin gösterir; tekrar hissi olmaz.
    motivations: [
      { hour: 8, minute: 30, bodies: [
        'Günaydın! Yeni bir gün, hedeflerine bir adım daha yaklaşmak için harika bir fırsat! 🌅💪',
        'Güne enerjiyle başla! Bugün atacağın küçük adımlar yarınki vücudunu şekillendirir. ☀️',
        'Yeni gün, temiz sayfa. Bugün yapacağın ilk sağlıklı şey ne olacak? 🌱',
        'Gelecekteki sen, bugün hareket ettiğin için şimdiden teşekkür ediyor. Hadi başlayalım! 🚀',
      ] },
      { hour: 12, minute: 30, bodies: [
        'Disiplin, ne istediğinle şu an ne istediğin arasındaki seçimdir. Başarmak senin elinde! 🚀',
        'Günün yarısı geçti — kısa bir yürüyüş ya da esneme enerjini tazeler. 🚶‍♂️',
        'Öğle yemeğinde akıllı yakıt: protein, sebze, su. Vücudun teşekkür edecek! 🥗',
        'Motivasyon başlatır, alışkanlık sürdürür. Serini canlı tut! 🔥',
      ] },
      { hour: 17, minute: 0, bodies: [
        'Mesai bitti, deşarj vakti! Bugünkü antrenmanını tamamlayıp günün stresini at! 🏋️‍♂️🔥',
        '15 dakika bile sayılır. Ayakkabılarını giy ve başla, gerisi gelir! 👟',
        'Kabilen şu an antrenman yapıyor. Sen de katıl ve bugünü kaydet! 💪',
        'Yorgun musun? Antrenman en çok tam da böyle günlerde geri verir. ⚡',
      ] },
    ],
    mealTitle: '🍽️ DietitianFit Beslenme',
    mealReminder: { hour: 14, minute: 0, bodies: [
      'Öğle yemeğini yedin mi? 10 saniyede kaydet, hedefinde kal! 🥗',
      'Kısa bir öğün kaydı beslenme hedeflerini dürüst tutar. Bugünkü öğlenini ekle! 📝',
      'Bugün tabağında ne var? Kaydet ve makrolarının durumunu gör. 🍎',
    ] },
    testTitle: '🚀 DietitianFit Test Bildirimi',
    testBody: 'Tebrikler! DietitianFit bildirimleri cihazınızda uygulama kapalıyken de sorunsuz çalışıyor! 🔥',
    workoutPreTitle: '⏱️ Antrenman öncesi yakıt',
    workoutPre: 'Antrenmana 2 saat kaldı: sabit enerji için ~40 g kompleks karbonhidrat zamanı (yulaf, pirinç, muz). 🍌',
    workoutPostTitle: '🔋 Toparlanma penceresi',
    workoutPost: 'Toparlanma penceresi açık: önümüzdeki 1 saat içinde ~25 g protein ve biraz karbonhidrat al. 🥛',
    comebackTitle: '👋 DietitianFit seni özledi!',
    comebacks: [
      { days: 3, body: '3 gündür yoksun. Serini yeniden başlatmak için kısa bir antrenman yeter! 🌱' },
      { days: 7, body: 'Bir hafta oldu! Kabilen antrenmana devam ediyor, sen de gel ve bugünü kaydet. 💪' },
      { days: 14, body: 'Hedeflerin seni bekliyor. 10 dakikalık bir seansla yeniden başla! 🔥' },
    ],
    dietitianTitle: '🥗 DietitianFit Diyetisyen',
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

    // 3. Daily motivation (08:30, 12:30, 17:00) + lunch meal-log nudge (14:00).
    //    Weekly triggers so each weekday gets a different message from the slot's pool.
    if (settings.motivationEnabled) {
      for (const mot of localized.motivations) {
        for (let weekday = 1; weekday <= 7; weekday++) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: localized.motivationTitle,
              body: mot.bodies[(weekday - 1) % mot.bodies.length],
              sound: true,
              channelId: 'vitatribe_motivation',
              data: { screen: '(tabs)' },
            } as any,
            trigger: { type: T.WEEKLY, weekday, hour: mot.hour, minute: mot.minute },
          });
        }
      }

      const meal = localized.mealReminder;
      for (let weekday = 1; weekday <= 7; weekday++) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: localized.mealTitle,
            body: meal.bodies[(weekday - 1) % meal.bodies.length],
            sound: true,
            channelId: 'vitatribe_motivation',
            data: { screen: 'nutrition/log' },
          } as any,
          trigger: { type: T.WEEKLY, weekday, hour: meal.hour, minute: meal.minute },
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

    // 5a. Pre/post-workout nutrition nudges: 2 h before and ~90 min after the usual workout start.
    if (settings.workoutNutritionEnabled) {
      const at = (offsetMinutes: number) => {
        const total = (settings.workoutHour * 60 + settings.workoutMinute + offsetMinutes + 24 * 60) % (24 * 60);
        return { hour: Math.floor(total / 60), minute: total % 60 };
      };
      await Notifications.scheduleNotificationAsync({
        content: { title: localized.workoutPreTitle, body: localized.workoutPre, sound: true, channelId: 'vitatribe_motivation', data: { screen: 'nutrition/log' } } as any,
        trigger: { type: T.DAILY, ...at(-120) },
      });
      await Notifications.scheduleNotificationAsync({
        content: { title: localized.workoutPostTitle, body: localized.workoutPost, sound: true, channelId: 'vitatribe_motivation', data: { screen: 'nutrition/log' } } as any,
        trigger: { type: T.DAILY, ...at(90) },
      });
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
