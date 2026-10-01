import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal, Share } from 'react-native';
import { buildShoppingList, ShoppingGroup } from '../lib/shoppingList';
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
  const [shopping, setShopping] = useState<{ title: string; groups: ShoppingGroup[] } | null>(null);

  const openShopping = (plan: Plan) => {
    setShopping({ title: plan.title || '', groups: buildShoppingList(plan.meals.map((m) => m.content)) });
  };

  const shareShopping = async () => {
    if (!shopping) return;
    const lines = shopping.groups.flatMap((g) => [
      t(`dietitianCare.cat_${g.category}`),
      ...g.items.map((i) => `• ${i.name}${i.quantity ? ` — ${i.quantity}` : ''}`),
      '',
    ]);
    await Share.share({ message: `${t('dietitianCare.shop_title')} – ${shopping.title}\n\n${lines.join('\n')}` }).catch(() => {});
  };

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

                <TouchableOpacity style={styles.shopBtn} onPress={() => openShopping(plan)}>
                  <Text style={styles.shopBtnText}>{t('dietitianCare.shop_btn')}</Text>
                </TouchableOpacity>

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

      <Modal visible={!!shopping} transparent animationType="slide" onRequestClose={() => setShopping(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('dietitianCare.shop_title')}</Text>
            <Text style={styles.modalSub}>{shopping?.title}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {shopping && shopping.groups.length === 0 && <Text style={styles.empty}>{t('dietitianCare.shop_empty')}</Text>}
              {shopping?.groups.map((g) => (
                <View key={g.category} style={{ marginTop: 12 }}>
                  <Text style={styles.catTitle}>{t(`dietitianCare.cat_${g.category}`)}</Text>
                  {g.items.map((i) => (
                    <View key={i.name} style={styles.itemRow}>
                      <Text style={styles.itemName}>• {i.name}</Text>
                      {!!i.quantity && <Text style={styles.itemQty}>{i.quantity}</Text>}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
            <Text style={styles.note}>{t('dietitianCare.shop_note')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShopping(null)}>
                <Text style={styles.closeText}>{t('dietitianCare.shop_close')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} onPress={shareShopping}>
                <Text style={styles.shareText}>{t('dietitianCare.shop_share')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  shopBtn: { borderWidth: 1, borderColor: '#10b981', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 6 },
  shopBtnText: { color: '#10b981', fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  modalSub: { color: '#10b981', fontSize: 12, fontWeight: '700', marginTop: 2 },
  catTitle: { color: '#f59e0b', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 10 },
  itemName: { color: '#fff', fontSize: 14, flex: 1 },
  itemQty: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
  note: { color: '#71717a', fontSize: 11, marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingBottom: 8 },
  closeBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  closeText: { color: '#aaa', fontWeight: '800' },
  shareBtn: { flex: 1, backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  shareText: { color: '#fff', fontWeight: '900' },
  dayBlock: { marginTop: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dayTitle: { color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  dayKcal: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  meal: { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#1c1c1c' },
  mealType: { color: '#8b5cf6', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  mealContent: { color: '#fff', fontSize: 13, marginTop: 4 },
});
