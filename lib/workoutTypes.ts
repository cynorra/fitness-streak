import { WORKOUT_TYPES } from './supabase';

// Workouts are stored either as the type id (new rows) or the legacy Turkish label (old rows).
export function displayWorkoutType(stored: string, t: (key: string) => string): string {
  const match = WORKOUT_TYPES.find((w) => w.id === stored || w.label === stored);
  return match ? t(`workoutTypes.${match.id}`) : stored;
}
