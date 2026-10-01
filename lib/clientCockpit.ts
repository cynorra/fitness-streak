import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { supabase } from './supabase';

export type CockpitStatus = 'green' | 'amber' | 'red';

export type ClientCockpit = {
  todayKcal: number;
  targetKcal: number | null; // average daily calories of the client's latest plan
  workouts7: number; // distinct workout days in the last 7 days
  daysSinceLastLog: number | null; // null = never logged in the last 7 days
  status: CockpitStatus;
};

/**
 * Live snapshot for the dietitian dashboard. Rules (kept deliberately simple and explainable):
 *  red   — no meal logged for 2+ days, or today is >15% over the plan target
 *  amber — nothing logged yet today, or today is outside 85–115% of target
 *  green — logging is current and within range
 */
export async function fetchClientCockpit(dietitianId: string, clientIds: string[]): Promise<Map<string, ClientCockpit>> {
  const result = new Map<string, ClientCockpit>();
  if (!clientIds.length) return result;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const since = format(subDays(today, 6), 'yyyy-MM-dd');

  const [logsRes, workoutsRes, plansRes] = await Promise.all([
    supabase.from('daily_nutrition_logs').select('user_id, log_date, calories').in('user_id', clientIds).gte('log_date', since),
    supabase.from('workouts').select('user_id, logical_date').in('user_id', clientIds).gte('logical_date', since),
    supabase
      .from('nutrition_plans')
      .select('id, client_id, created_at')
      .eq('dietitian_id', dietitianId)
      .in('client_id', clientIds)
      .order('created_at', { ascending: false }),
  ]);

  // Latest plan per client -> average daily kcal
  const latestPlanByClient = new Map<string, string>();
  for (const p of (plansRes.data || []) as any[]) {
    if (!latestPlanByClient.has(p.client_id)) latestPlanByClient.set(p.client_id, p.id);
  }
  const targetByClient = new Map<string, number>();
  if (latestPlanByClient.size) {
    const { data: meals } = await supabase
      .from('nutrition_meals')
      .select('plan_id, day_of_week, calories')
      .in('plan_id', [...latestPlanByClient.values()]);
    for (const [clientId, planId] of latestPlanByClient) {
      const rows = ((meals || []) as any[]).filter((m) => m.plan_id === planId);
      const days = new Set(rows.map((m) => m.day_of_week)).size;
      const total = rows.reduce((a, m) => a + (m.calories || 0), 0);
      if (days > 0 && total > 0) targetByClient.set(clientId, Math.round(total / days));
    }
  }

  for (const clientId of clientIds) {
    const logs = ((logsRes.data || []) as any[]).filter((l) => l.user_id === clientId);
    const todayKcal = logs.filter((l) => l.log_date === todayStr).reduce((a, l) => a + (l.calories || 0), 0);
    const lastLogDate = logs.map((l) => l.log_date as string).sort().pop() || null;
    const daysSinceLastLog = lastLogDate ? differenceInCalendarDays(today, parseISO(lastLogDate)) : null;
    const workouts7 = new Set(
      ((workoutsRes.data || []) as any[]).filter((w) => w.user_id === clientId).map((w) => w.logical_date)
    ).size;
    const targetKcal = targetByClient.get(clientId) ?? null;

    let status: CockpitStatus = 'green';
    const loggedToday = daysSinceLastLog === 0;
    if (daysSinceLastLog === null || daysSinceLastLog >= 2 || (targetKcal && todayKcal > targetKcal * 1.15)) {
      status = 'red';
    } else if (!loggedToday || (targetKcal && (todayKcal < targetKcal * 0.85 || todayKcal > targetKcal * 1.15))) {
      status = 'amber';
    }
    // Early in the day a low total is expected: do not flag "under target" before 15:00.
    if (status === 'amber' && loggedToday && targetKcal && todayKcal < targetKcal * 0.85 && today.getHours() < 15) {
      status = 'green';
    }

    result.set(clientId, { todayKcal, targetKcal, workouts7, daysSinceLastLog, status });
  }
  return result;
}

export const STATUS_COLORS: Record<CockpitStatus, string> = {
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
};
