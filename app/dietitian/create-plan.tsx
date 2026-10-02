import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { exportNutritionPlanToPDF } from '../../lib/pdfExport';
import { useTranslation } from '../../lib/i18n/i18n';
import { getMealTemplates } from '../../lib/nutritionCalc';
import { friendlyError } from '../../lib/useOnline';

export default function CreateNutritionPlan() {
  const { profile } = useAuth();
  const { t, locale } = useTranslation();
  const MEAL_TEMPLATES = getMealTemplates(locale);
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const insets = useSafeAreaInsets();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [meals, setMeals] = useState<any[]>([
    { meal_type: 'breakfast', day_of_week: 1, content: '', calories: '' },
  ]);

  useEffect(() => {
    loadClients();
  }, [profile]);

  const loadClients = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('dietitian_clients')
      .select('client_id, client:profiles!dietitian_clients_client_id_fkey(display_name, username)')
      .eq('dietitian_id', profile.id)
      .eq('status', 'approved');

    if (!error && data) {
      setClients(data);
      // Preselect the client the dietitian came from (param), otherwise the first one.
      const preselected = data.find((c: any) => c.client_id === clientId);
      if (data.length > 0) setSelectedClient(preselected || data[0]);
    }
    setLoading(false);
  };

  const applyTemplate = (template: ReturnType<typeof getMealTemplates>[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlanTitle(template.name);
    setMeals(template.meals);
    Alert.alert(t('plan.tmpl_loaded'), t('plan.tmpl_loaded_msg', { name: template.name }));
  };

  const addMealRow = () => {
    setMeals([...meals, { meal_type: 'lunch', day_of_week: 1, content: '', calories: '' }]);
  };

  const removeMealRow = (index: number) => {
    if (meals.length <= 1) return;
    const updated = meals.filter((_, idx) => idx !== index);
    setMeals(updated);
  };

  const updateMeal = (index: number, key: string, value: string) => {
    const updated = [...meals];
    updated[index][key] = value;
    setMeals(updated);
  };

  const handleSavePlan = async () => {
    if (!selectedClient || !planTitle) {
      Alert.alert(t('plan.missing'), t('plan.missing_msg'));
      return;
    }

    setSaving(true);
    try {
      const { data: planData, error: planError } = await supabase
        .from('nutrition_plans')
        .insert({
          dietitian_id: profile?.id,
          client_id: selectedClient.client_id,
          title: planTitle,
        })
        .select()
        .single();

      if (planError) throw planError;

      const mealsToInsert = meals.map((m) => ({
        plan_id: planData.id,
        meal_type: m.meal_type,
        day_of_week: parseInt(m.day_of_week) || 1,
        content: m.content,
        calories: parseInt(m.calories) || 0,
      }));

      const { error: mealsError } = await supabase.from('nutrition_meals').insert(mealsToInsert);
      if (mealsError) throw mealsError;

      Alert.alert(t('plan.success'), t('plan.created'), [
        {
          text: t('plan.share_pdf'),
          onPress: () =>
            exportNutritionPlanToPDF(
              planData,
              mealsToInsert,
              selectedClient.client?.display_name || selectedClient.client?.username || t('plan.client'),
              locale
            ),
        },
        { text: t('plan.ok'), onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), friendlyError(err.message, t) || t('plan.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('plan.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Quick Templates Bar */}
        <Text style={styles.sectionTitle}>{t('plan.templates')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          {MEAL_TEMPLATES.map((tmpl, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.templateCard}
              onPress={() => applyTemplate(tmpl)}
            >
              <Text style={styles.templateName}>{tmpl.name}</Text>
              <Text style={styles.templateDesc} numberOfLines={2}>{tmpl.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('plan.pick_client')}</Text>
        {loading ? (
          <ActivityIndicator color="#10b981" />
        ) : clients.length === 0 ? (
          <Text style={{ color: '#ef4444', marginBottom: 12 }}>{t('plan.no_clients')}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientScroll}>
            {clients.map((c) => (
              <TouchableOpacity
                key={c.client_id}
                style={[
                  styles.clientChip,
                  selectedClient?.client_id === c.client_id && styles.clientChipActive,
                ]}
                onPress={() => setSelectedClient(c)}
              >
                <Text style={styles.clientChipText}>
                  {c.client?.display_name || c.client?.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>{t('plan.plan_title')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('plan.plan_title_ph')}
          placeholderTextColor="#64748b"
          value={planTitle}
          onChangeText={setPlanTitle}
        />

        <Text style={styles.sectionTitle}>{t('plan.meals_menu')}</Text>
        {meals.map((meal, index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealNumber}>{t('plan.meal_n', { n: index + 1 })}</Text>
              {meals.length > 1 && (
                <TouchableOpacity onPress={() => removeMealRow(index)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.subLabel}>{t('plan.day')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.clientChip, Number(meal.day_of_week) === d && styles.clientChipActive]}
                  onPress={() => updateMeal(index, 'day_of_week', String(d))}
                >
                  <Text style={styles.clientChipText}>{t('dietitianCare.day_n', { n: d })}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>{t('plan.type')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((mt) => (
                    <TouchableOpacity
                      key={mt}
                      style={[styles.clientChip, meal.meal_type === mt && styles.clientChipActive]}
                      onPress={() => updateMeal(index, 'meal_type', mt)}
                    >
                      <Text style={styles.clientChipText}>{t(`plan.${mt}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>{t('plan.calories')}</Text>
                <TextInput
                  style={styles.inputSmall}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#64748b"
                  value={meal.calories}
                  onChangeText={(v) => updateMeal(index, 'calories', v)}
                />
              </View>
            </View>

            <Text style={styles.subLabel}>{t('plan.content')}</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              placeholder={t('plan.content_ph')}
              placeholderTextColor="#64748b"
              value={meal.content}
              onChangeText={(v) => updateMeal(index, 'content', v)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addMealBtn} onPress={addMealRow}>
          <Ionicons name="add-circle-outline" size={20} color="#10b981" />
          <Text style={styles.addMealText}>{t('plan.add_meal')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSavePlan}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? t('plan.saving') : t('plan.save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  scroll: { padding: 20, gap: 14 },
  sectionTitle: { color: '#10b981', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 10 },
  templateScroll: { flexDirection: 'row', marginBottom: 10 },
  templateCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 14,
    borderRadius: 14,
    width: 220,
    marginRight: 10,
  },
  templateName: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  templateDesc: { color: '#94a3b8', fontSize: 11, lineHeight: 14 },
  label: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  subLabel: { color: '#64748b', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  clientScroll: { flexDirection: 'row', marginBottom: 10 },
  clientChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clientChipActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  clientChipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealNumber: { color: '#10b981', fontSize: 11, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10 },
  inputSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  addMealText: { color: '#10b981', fontWeight: '900', fontSize: 13 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  btnDisabled: { opacity: 0.5 },
});
