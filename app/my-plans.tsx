import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import { getDateLocale } from '../lib/i18n/dateUtils';

type Plan = {
  id: string;
  title: string | null;
  created_at: string;
  dietitianName: string;
  meals: { id: string; day_of_week: number; meal_type: string; content: string; calories: number | null }[];
};

export default function MyPlans() {
  const { profile } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: planRows, error } = await supabase
      .from('nutrition_plans')
      .select('id, title, created_at, dietitian_id')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setFailed(false);

    if (!planRows?.length) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const [{ data: meals }, { data: dietitians }] = await Promise.all([
      supabase
        .from('nutrition_meals')
        .select('id, plan_id, day_of_week, meal_type, content, calories')
        .in('plan_id', planRows.map((p) => p.id))
        .order('day_of_week', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', [...new Set(planRows.map((p) => p.dietitian_id))]),
    ]);

    const nameOf = new Map((dietitians || []).map((d: any) => [d.id, d.display_name || d.username]));
    setPlans(
      planRows.map((p) => ({
        id: p.id,
        title: p.title,
        created_at: p.created_at,
        dietitianName: nameOf.get(p.dietitian_id) || '',
        meals: (meals || []).filter((m: any) => m.plan_id === p.id),
      }))
    );
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('dietitianCare.my_plans')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {loading ? (
          <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
        ) : failed ? (
          <Text style={styles.empty}>{t('dietitianCare.loading_failed')}</Text>
        ) : plans.length === 0 ? (
          <Text style={styles.empty}>{t('dietitianCare.no_plans')}</Text>
        ) : (
          plans.map((plan) => {
            const days = [...new Set(plan.meals.map((m) => m.day_of_week))].sort((a, b) => a - b);
            return (
              <View key={plan.id} style={styles.card}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planMeta}>
                  {t('dietitianCare.plan_by', { name: plan.dietitianName })} ·{' '}
                  {format(parseISO(plan.created_at), 'd MMM yyyy', { locale: getDateLocale(locale) })}
                </Text>

                {days.map((day) => {
                  const dayMeals = plan.meals.filter((m) => m.day_of_week === day);
                  const total = dayMeals.reduce((a, m) => a + (m.calories || 0), 0);
                  return (
                    <View key={day} style={styles.dayBlock}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayTitle}>{t('dietitianCare.day_n', { n: day })}</Text>
                        {total > 0 && <Text style={styles.dayKcal}>{total} kcal</Text>}
                      </View>
                      {dayMeals.map((m) => (
                        <View key={m.id} style={styles.meal}>
                          <Text style={styles.mealType}>
                            {t(`nutritionLog.${m.meal_type}`)}
                            {m.calories ? ` · ${m.calories} kcal` : ''}
                          </Text>
                          <Text style={styles.mealContent}>{m.content}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 18, padding: 18, marginBottom: 16 },
  planTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  planMeta: { color: '#10b981', fontSize: 12, fontWeight: '700', marginTop: 4, marginBottom: 12 },
  dayBlock: { marginTop: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dayTitle: { color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  dayKcal: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  meal: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#1c1c1c' },
  mealType: { color: '#8b5cf6', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealContent: { color: '#fff', fontSize: 13, marginTop: 4 },
});
