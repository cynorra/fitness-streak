/**
 * Firebase Analytics wrapper.
 *
 * Why this exists: Google Ads (app install campaigns) can only optimise for / report on what the
 * app actually sends. These events feed the Firebase -> Google Ads link.
 *
 * Rules:
 *  - NEVER put personal data (email, name, ids, free text) in event names or params.
 *  - It must never throw or block the UI: native module missing (web, Expo Go) or Firebase errors
 *    are swallowed.
 */
type AnalyticsModule = { logEvent: (name: string, params?: Record<string, unknown>) => Promise<void> };

let cached: AnalyticsModule | null | undefined;

function getAnalytics(): AnalyticsModule | null {
  if (cached !== undefined) return cached;
  try {
    // Lazy require so platforms without the native module (web, Expo Go) don't crash on import.
    const mod = require('@react-native-firebase/analytics');
    cached = (mod.default ?? mod)() as AnalyticsModule;
  } catch {
    cached = null;
  }
  return cached;
}

export function logEvent(name: string, params?: Record<string, string | number | boolean>): void {
  try {
    getAnalytics()
      ?.logEvent(name, params)
      .catch(() => {});
  } catch {
    // analytics must never affect the app
  }
}

// Typed helpers = one place that defines which events exist (keep names in sync with Google Ads
// conversion actions; sign_up and onboarding_completed are the install-quality conversions).
export const track = {
  signUp: (method: 'email' | 'google') => logEvent('sign_up', { method }),
  login: (method: 'email' | 'google') => logEvent('login', { method }),
  onboardingCompleted: () => logEvent('onboarding_completed'),
  workoutLogged: (minutes: number) => logEvent('workout_logged', { duration_minutes: minutes }),
  appointmentBooked: () => logEvent('appointment_booked'),
  dietitianRequestSent: () => logEvent('dietitian_request_sent'),
};
