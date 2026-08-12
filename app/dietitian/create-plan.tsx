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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { exportNutritionPlanToPDF } from '../../lib/pdfExport';
import { useTranslation } from '../../lib/i18n/i18n';
import { MEAL_TEMPLATES } from '../../lib/nutritionCalc';

export default function CreateNutritionPlan() {
  const { profile } = useAuth();
  const { locale } = useTranslation();
  const router = useRouter();
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
      .eq('dietitian_id', profile.id);

    if (!error && data) {
      setClients(data);
      if (data.length > 0) setSelectedClient(data[0]);
    }
    setLoading(false);
  };

  const applyTemplate = (template: typeof MEAL_TEMPLATES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlanTitle(template.name);
    setMeals(template.meals);
    Alert.alert('Şablon Yüklendi', `"${template.name}" başarıyla forma aktarıldı.`);
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
      Alert.alert('Eksik Bilgi', 'Lütfen danışan seçin ve plan adı girin.');
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
          is_active: true,
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

      Alert.alert('🎉 Başarılı', 'Beslenme planı oluşturuldu ve danışana iletildi!', [
        {
          text: '📄 PDF Olarak Paylaş',
          onPress: () =>
            exportNutritionPlanToPDF(
              planData,
              mealsToInsert,
              selectedClient.client?.display_name || selectedClient.client?.username || 'Danışan',
              locale
            ),
        },
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Plan kaydedilemedi.');
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
        <Text style={styles.headerTitle}>BESLENME PLANI OLUŞTUR 📋</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Quick Templates Bar */}
        <Text style={styles.sectionTitle}>⚡ HAZIR KLİNİK ŞABLONLAR</Text>
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

        <Text style={styles.label}>DANIŞAN SEÇİN:</Text>
        {loading ? (
          <ActivityIndicator color="#10b981" />
        ) : clients.length === 0 ? (
          <Text style={{ color: '#ef4444', marginBottom: 12 }}>Onaylı danışanınız bulunmuyor.</Text>
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
                  👤 {c.client?.display_name || c.client?.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>PLAN BAŞLIĞI:</Text>
        <TextInput
          style={styles.input}
          placeholder="örn: 1. Hafta Yağ Yakım Programı"
          placeholderTextColor="#64748b"
          value={planTitle}
          onChangeText={setPlanTitle}
        />

        <Text style={styles.sectionTitle}>ÖĞÜNLER VE MENÜ</Text>
        {meals.map((meal, index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealNumber}>ÖĞÜN #{index + 1}</Text>
              {meals.length > 1 && (
                <TouchableOpacity onPress={() => removeMealRow(index)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>TİP:</Text>
                <TextInput
                  style={styles.inputSmall}
                  value={meal.meal_type}
                  onChangeText={(v) => updateMeal(index, 'meal_type', v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>KALORİ (kcal):</Text>
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

            <Text style={styles.subLabel}>İÇERİK VE TARİF:</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              placeholder="Yemek detayları, porsiyon ve notlar..."
              placeholderTextColor="#64748b"
              value={meal.content}
              onChangeText={(v) => updateMeal(index, 'content', v)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addMealBtn} onPress={addMealRow}>
          <Ionicons name="add-circle-outline" size={20} color="#10b981" />
          <Text style={styles.addMealText}>YENİ ÖĞÜN EKLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSavePlan}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'KAYDEDİLİYOR...' : 'PLANIBİL KULLANICIYA GÖNDER VE PDF AL'}
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
