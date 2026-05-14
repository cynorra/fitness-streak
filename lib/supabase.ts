import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '.env dosyasında EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı değil'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_type: string;
  duration_minutes: number;
  note: string | null;
  logged_at: string;
  logical_date: string;
};

export const WORKOUT_TYPES = [
  { id: 'running', label: 'Koşu', emoji: '🏃' },
  { id: 'gym', label: 'Spor Salonu', emoji: '🏋️' },
  { id: 'cycling', label: 'Bisiklet', emoji: '🚴' },
  { id: 'swimming', label: 'Yüzme', emoji: '🏊' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'walking', label: 'Yürüyüş', emoji: '🚶' },
  { id: 'home', label: 'Ev Antrenmanı', emoji: '💪' },
  { id: 'other', label: 'Diğer', emoji: '⚡' },
] as const;
