import { supabase } from './supabase';

export type DietitianScore = {
  dietitian_id: string;
  review_count: number;
  avg_rating: number;
  client_count: number;
  trust_score: number;
};

/** Scores for every dietitian, keyed by id. Empty map if the migration has not been run / offline. */
export async function fetchDietitianScores(): Promise<Map<string, DietitianScore>> {
  const { data, error } = await supabase.rpc('get_dietitian_scores');
  const map = new Map<string, DietitianScore>();
  if (error || !data) return map;
  for (const row of data as any[]) {
    map.set(row.dietitian_id, {
      dietitian_id: row.dietitian_id,
      review_count: Number(row.review_count) || 0,
      avg_rating: Number(row.avg_rating) || 0,
      client_count: Number(row.client_count) || 0,
      trust_score: Number(row.trust_score) || 0,
    });
  }
  return map;
}

export const trustColor = (score: number) => (score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#94a3b8');
