import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '../lib/i18n/dateUtils';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { fetchDietitianScores, trustColor, DietitianScore } from '../lib/dietitianScores';
import { useTranslation } from '../lib/i18n/i18n';
import StarRating from './StarRating';
import GradientCard from './GradientCard';
import PressableScale from './PressableScale';

type Mine = { id: string; name: string; next: string | null };
type Dietitian = { id: string; username: string; display_name: string | null; specialty: string | null };

// Home-screen promo for the dietitian side of the app: a CTA card plus a strip of top-rated dietitians.
export default function FeaturedDietitians({ userId, variant = 'full' }: { userId: string; variant?: 'full' | 'strip' }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<{ d: Dietitian; score?: DietitianScore }[]>([]);
  const [mine, setMine] = useState<Mine | null>(null);

  // The member's own approved dietitian (first one) + their next appointment with them.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('dietitian_clients')
        .select('person:dietitian_id (id, display_name, username)')
        .eq('client_id', userId)
        .eq('status', 'approved')
        .limit(1);
      const person = (data?.[0] as any)?.person;
      if (!person || !alive) return;
      const { data: appt } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('client_id', userId)
        .eq('dietitian_id', person.id)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_time', new Date().toISOString())
        .order('appointment_time', { ascending: true })
        .limit(1);
      if (alive) setMine({ id: person.id, name: person.display_name || person.username, next: appt?.[0]?.appointment_time || null });
    })();
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [list, scores] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, specialty').eq('role', 'dietitian').neq('id', userId).limit(30),
        fetchDietitianScores(),
      ]);
      if (!alive) return;
      const rows = ((list.data || []) as Dietitian[])
        .map((d) => ({ d, score: scores.get(d.id) }))
        .sort((a, b) => (b.score?.trust_score || 0) - (a.score?.trust_score || 0))
        .slice(0, 8);
      setItems(rows);
    })();
    return () => { alive = false; };
  }, [userId]);

  const openDirectory = () => {
    Haptics.selectionAsync();
    router.push('/(tabs)/dietitians' as any);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {variant === 'full' && mine && (
        <View style={{ paddingHorizontal: 16 }}>
          <GradientCard accent="#10b981" padding={18}>
            <Text style={styles.myLabel}>{t('home.my_dt_title')}</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.ctaRow} onPress={() => router.push(`/user/${mine.id}` as any)}>
              <View style={styles.ctaIcon}>
                <Text style={styles.avatarText}>{mine.name[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>{mine.name}</Text>
                <Text style={styles.ctaSub}>
                  {mine.next
                    ? `${t('home.my_dt_next')}: ${format(parseISO(mine.next), 'd MMM HH:mm', { locale: getDateLocale(locale) })}`
                    : t('home.my_dt_no_appt')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#10b981" />
            </TouchableOpacity>
            <View style={styles.actionRow}>
              {([
                ['paper-plane', t('home.my_dt_chat'), `/user/${mine.id}`],
                ['calendar', t('home.my_dt_appts'), '/appointments'],
                ['restaurant', t('home.my_dt_plans'), '/my-plans'],
              ] as const).map(([icon, label, path]) => (
                <TouchableOpacity key={label} style={styles.actionBtn} onPress={() => { Haptics.selectionAsync(); router.push(path as any); }}>
                  <Ionicons name={icon} size={16} color="#10b981" />
                  <Text style={styles.actionText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GradientCard>
        </View>
      )}

      {variant === 'full' && !mine && (
      <View style={{ paddingHorizontal: 16 }}>
        <PressableScale onPress={openDirectory}>
          <GradientCard accent="#10b981" padding={18}>
            <View style={styles.ctaRow}>
              <View style={styles.ctaIcon}>
                <Ionicons name="nutrition" size={24} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>{t('home.dt_find_title')}</Text>
                <Text style={styles.ctaSub}>{t('home.dt_find_sub')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#10b981" />
            </View>
          </GradientCard>
        </PressableScale>
      </View>
      )}

      {items.length > 0 && (
        <>
          <View style={styles.stripHeader}>
            <Text style={styles.stripTitle}>{t('home.dt_featured')}</Text>
            <TouchableOpacity onPress={openDirectory}>
              <Text style={styles.seeAll}>{t('home.dt_see_all')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {items.map(({ d, score }) => (
              <TouchableOpacity key={d.id} activeOpacity={0.8} style={styles.card} onPress={() => router.push(`/user/${d.id}` as any)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(d.display_name || d.username)[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.name} numberOfLines={1}>{d.display_name || d.username}</Text>
                <Text style={styles.specialty} numberOfLines={1}>{d.specialty || t('home.dt_role')}</Text>
                <StarRating value={score?.avg_rating || 0} size={12} />
                {!!score && score.review_count > 0 && (
                  <Text style={[styles.trust, { color: trustColor(score.trust_score) }]}>
                    {score.avg_rating.toFixed(1)} · {score.review_count}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  myLabel: { color: '#10b981', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.12)' },
  actionText: { color: '#10b981', fontSize: 12, fontWeight: '800' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b98122', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  ctaSub: { color: '#8b93a1', fontSize: 12, fontWeight: '600', marginTop: 2 },
  stripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 16, marginBottom: 10 },
  stripTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  seeAll: { color: '#10b981', fontSize: 12, fontWeight: '800' },
  card: { width: 132, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 18, padding: 12, alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#10b98130', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  name: { color: '#fff', fontSize: 13, fontWeight: '800' },
  specialty: { color: '#8b93a1', fontSize: 11, fontWeight: '600', marginTop: 2, marginBottom: 6 },
  trust: { fontSize: 11, fontWeight: '800', marginTop: 4 },
});
