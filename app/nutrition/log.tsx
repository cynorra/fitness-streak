import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../../lib/i18n/i18n';
import { searchFoods, scaleFood, FoodItem } from '../../lib/foodSearch';
import AmbientBackground from '../../components/AmbientBackground';
import { Ionicons } from '@expo/vector-icons';

export default function NutritionLog() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  
  const [mealType, setMealType] = useState('breakfast');
  const [content, setContent] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ id: string; log_id: string; message: string }[]>([]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Food search (Open Food Facts + USDA)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchState, setSearchState] = useState<'idle' | 'done' | 'failed'>('idle');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [gramsText, setGramsText] = useState('100');
  const searchSeq = useRef(0);
  const autoContent = useRef('');

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchState('idle');
      setSearching(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchFoods(q, locale === 'tr' ? 'tr' : 'en');
        if (seq !== searchSeq.current) return; // a newer query superseded this one
        setResults(found);
        setSearchState('done');
      } catch {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setSearchState('failed');
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, locale]);

  // Keep calories/macros (and the auto-generated meal text) in step with the chosen food and amount.
  useEffect(() => {
    if (!selected) return;
    const grams = parseFloat(gramsText.replace(',', '.'));
    if (!(grams > 0 && grams <= 5000)) return;
    const v = scaleFood(selected, grams);
    setCalories(String(v.calories));
    setProtein(String(v.protein));
    setCarbs(String(v.carbs));
    setFat(String(v.fat));
    const text = `${selected.name}${selected.brand ? ` (${selected.brand})` : ''} – ${grams} g`;
    setContent((cur) => (cur === '' || cur === autoContent.current ? text : cur));
    autoContent.current = text;
  }, [selected, gramsText]);

  const pickFood = (food: FoodItem) => {
    autoContent.current = '';
    setContent('');
    setGramsText('100');
    setSelected(food);
    setQuery('');
    setResults([]);
    setSearchState('idle');
  };

  const clearSelection = () => {
    setSelected(null);
    setContent('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    autoContent.current = '';
  };

  const loadLogs = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('daily_nutrition_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('log_date', todayStr)
      .order('created_at', { ascending: false });
    
    if (data) {
      setTodayLogs(data);
      if (data.length) {
        // Recommendations written by the user's dietitian (RLS lets only the client/dietitian read them).
        const { data: fb } = await supabase
          .from('meal_feedback')
          .select('id, log_id, message')
          .in('log_id', data.map((l: any) => l.id))
          .order('created_at', { ascending: true });
        setFeedback(fb || []);
      } else {
        setFeedback([]);
      }
    }
  };

  useEffect(() => {
    loadLogs();
  }, [profile]);

  const handleSave = async () => {
    if (!content.trim() || !calories) {
      Alert.alert(t('common.error'), t('nutritionLog.fill'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('daily_nutrition_logs').insert({
      user_id: profile?.id,
      log_date: todayStr,
      meal_type: mealType,
      content,
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
    });

    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), t('nutritionLog.save_failed'));
    } else {
      setContent('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setSelected(null);
      autoContent.current = '';
      loadLogs();
    }
  };

  const totalCals = todayLogs.reduce((acc, log) => acc + log.calories, 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('nutritionLog.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('nutritionLog.today_cals')}</Text>
          <Text style={styles.summaryValue}>{totalCals} kcal</Text>
        </View>

        <TouchableOpacity style={styles.plansLink} onPress={() => router.push('/my-plans' as any)}>
          <Text style={styles.plansLinkText}>{t('dietitianCare.my_plans_link')}</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('nutritionLog.new')}</Text>
          
          <View style={styles.tabsRow}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.tab, mealType === type && styles.tabActive]}
                onPress={() => setMealType(type)}
              >
                <Text style={[styles.tabText, mealType === type && styles.tabTextActive]}>
                  {t(`nutritionLog.${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Food search */}
          <Text style={styles.searchLabel}>{t('nutritionLog.search_title')}</Text>
          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholder={t('nutritionLog.search_ph')}
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searching && <Text style={styles.searchInfo}>{t('nutritionLog.searching')}</Text>}
          {!searching && searchState === 'failed' && <Text style={styles.searchError}>{t('nutritionLog.search_failed')}</Text>}
          {!searching && searchState === 'done' && results.length === 0 && (
            <Text style={styles.searchInfo}>{t('nutritionLog.no_results')}</Text>
          )}
          {results.slice(0, 10).map((food) => (
            <TouchableOpacity key={food.id} style={styles.resultRow} onPress={() => pickFood(food)}>
              <Text style={styles.resultName} numberOfLines={2}>
                {food.name}{food.brand ? ` · ${food.brand}` : ''}
              </Text>
              <Text style={styles.resultMacros}>
                {food.kcal} kcal · {t('nutritionLog.p')} {food.protein} · {t('nutritionLog.c')} {food.carbs} · {t('nutritionLog.f')} {food.fat}  ({t('nutritionLog.per100')})
              </Text>
            </TouchableOpacity>
          ))}

          {selected && (
            <View style={styles.selectedBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedTitle}>{t('nutritionLog.selected')}</Text>
                <Text style={styles.selectedName} numberOfLines={2}>{selected.name}</Text>
              </View>
              <Text style={styles.gramsLabel}>{t('nutritionLog.grams')}</Text>
              <TextInput
                style={styles.gramsInput}
                keyboardType="decimal-pad"
                value={gramsText}
                onChangeText={setGramsText}
              />
              <TouchableOpacity onPress={clearSelection} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.sourceNote}>{t('nutritionLog.source_note')}</Text>

          <TextInput
            style={styles.inputMulti}
            placeholder={t('nutritionLog.what')}
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
          />

          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.cal')} placeholderTextColor="#666" keyboardType="numeric" value={calories} onChangeText={setCalories} />
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.protein')} placeholderTextColor="#666" keyboardType="numeric" value={protein} onChangeText={setProtein} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.carbs')} placeholderTextColor="#666" keyboardType="numeric" value={carbs} onChangeText={setCarbs} />
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.fat')} placeholderTextColor="#666" keyboardType="numeric" value={fat} onChangeText={setFat} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? t('nutritionLog.saving') : t('nutritionLog.save')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>{t('nutritionLog.today')}</Text>
        {todayLogs.map((log, index) => (
          <Animated.View key={log.id} entering={FadeInDown.delay(index * 100).springify()} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logMealType}>
                {t(`nutritionLog.${log.meal_type}`)}
              </Text>
              <Text style={styles.logCals}>{log.calories} kcal</Text>
            </View>
            <Text style={styles.logContent}>{log.content}</Text>
            <View style={styles.macrosRow}>
              <Text style={styles.macroText}>{t('nutritionLog.p')}: {log.protein_g}g</Text>
              <Text style={styles.macroText}>{t('nutritionLog.c')}: {log.carbs_g}g</Text>
              <Text style={styles.macroText}>{t('nutritionLog.f')}: {log.fat_g}g</Text>
            </View>
            {feedback.filter((f) => f.log_id === log.id).map((f) => (
              <View key={f.id} style={styles.feedbackBox}>
                <Text style={styles.feedbackLabel}>🥗 {t('dietitianCare.from_dietitian')}</Text>
                <Text style={styles.feedbackText}>{f.message}</Text>
              </View>
            ))}
          </Animated.View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 100 },
  summaryCard: { backgroundColor: '#10b98120', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#10b98150' },
  summaryTitle: { color: '#10b981', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 8 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  tabActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  tabText: { color: '#666', fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: '#10b981' },
  inputMulti: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 16, color: '#fff', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 16, color: '#fff' },
  flex1: { flex: 1 },
  searchLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  searchInfo: { color: '#888', fontSize: 12, marginBottom: 8 },
  searchError: { color: '#f87171', fontSize: 12, marginBottom: 8 },
  resultRow: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 12, marginBottom: 6 },
  resultName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resultMacros: { color: '#10b981', fontSize: 11, fontWeight: '700', marginTop: 4 },
  selectedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98150', borderRadius: 12, padding: 12, marginBottom: 8 },
  selectedTitle: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  selectedName: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  gramsLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  gramsInput: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, color: '#fff', minWidth: 64, textAlign: 'center' },
  clearBtn: { padding: 6 },
  clearText: { color: '#94a3b8', fontSize: 16, fontWeight: '900' },
  sourceNote: { color: '#555', fontSize: 10, marginBottom: 12 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  logCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logMealType: { color: '#f59e0b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  logCals: { color: '#10b981', fontSize: 14, fontWeight: '900' },
  logContent: { color: '#fff', fontSize: 14, marginBottom: 12 },
  macrosRow: { flexDirection: 'row', gap: 16 },
  macroText: { color: '#666', fontSize: 11, fontWeight: '700' },
  feedbackBox: { backgroundColor: '#8b5cf61a', borderLeftWidth: 3, borderLeftColor: '#8b5cf6', borderRadius: 8, padding: 10, marginTop: 10 },
  feedbackLabel: { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  feedbackText: { color: '#fff', fontSize: 13, marginTop: 2 },
  plansLink: { backgroundColor: '#8b5cf61a', borderWidth: 1, borderColor: '#8b5cf650', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16 },
  plansLinkText: { color: '#a78bfa', fontSize: 14, fontWeight: '800' }
});
