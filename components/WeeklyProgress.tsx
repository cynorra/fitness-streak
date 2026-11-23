import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import { formatWeight, formatWater, Units } from '../lib/units';

type Wk = { week_start: string; avg_calories: number | null; logged_days: number; avg_weight_kg: number | null; water_ml_per_day: number | null };

function Bars({ title, values, labels, color }: { title: string; values: (number | null)[]; labels: string[]; color: string }) {
  const max = Math.max(1, ...values.map((v) => v || 0));
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.cap}>{title}</Text>
      <View style={styles.chart}>
        {values.map((v, i) => (
          <View key={i} style={styles.col}>
            <Text style={styles.val}>{v ? labels[i] : ''}</Text>
            <View style={[styles.bar, { height: Math.max(2, ((v || 0) / max) * 70), backgroundColor: v ? color : 'rgba(255,255,255,0.08)' }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Weekly calories / weight / water bars from rpc client_weekly_progress (server enforces relationship + consent). */
export default function WeeklyProgress({ clientId, units = 'metric', weeks = 8 }: { clientId: string; units?: Units; weeks?: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Wk[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    supabase.rpc('client_weekly_progress', { p_client: clientId, p_weeks: weeks }).then(({ data, error }) => {
      if (error) setFailed(true);
      else setRows((data || []) as Wk[]);
    });
  }, [clientId, weeks]);

  if (failed) return <Text style={styles.cap}>{t('platform.wk_unavailable')}</Text>;
  if (!rows) return <ActivityIndicator color="#10b981" />;

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>{t('platform.weekly')}</Text>
      <Bars title={t('platform.wk_cal')} values={rows.map((r) => r.avg_calories)} labels={rows.map((r) => String(Math.round(r.avg_calories || 0)))} color="#10b981" />
      <Bars title={t('platform.wk_weight')} values={rows.map((r) => r.avg_weight_kg)} labels={rows.map((r) => formatWeight(r.avg_weight_kg, units).replace(/ (kg|lb)$/, ''))} color="#8b5cf6" />
      <Bars title={t('platform.wk_water')} values={rows.map((r) => r.water_ml_per_day)} labels={rows.map((r) => formatWater(Math.round(r.water_ml_per_day || 0), units).replace(/ .*/, ''))} color="#38bdf8" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  heading: { color: '#fff', fontWeight: '900', fontSize: 15 },
  cap: { color: '#a1a1aa', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 96, marginTop: 6 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', borderRadius: 4 },
  val: { color: '#71717a', fontSize: 8, marginBottom: 2 },
});
