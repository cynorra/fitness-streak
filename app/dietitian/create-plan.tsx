import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportNutritionPlanToPDF } from '../../lib/pdfExport';

export default function CreateNutritionPlan() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Basic structure for meals
  const [meals, setMeals] = useState<any[]>([
    { meal_type: 'breakfast', day_of_week: 1, content: '', calories: '' }
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
    }
    setLoading(false);
  };

  const addMealRow = () => {
    setMeals([...meals, { meal_type: 'lunch', day_of_week: 1, content: '', calories: '' }]);
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
      // Create Plan
      const { data: planData, error: planError } = await supabase
        .from('nutrition_plans')
        .insert({
          dietitian_id: profile?.id,
          client_id: selectedClient.client_id,
          title: planTitle,
          start_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create Meals
      const mealsToInsert = meals.map(m => ({
        plan_id: planData.id,
        meal_type: m.meal_type,
        day_of_week: parseInt(m.day_of_week) || 1,
        content: m.content,
        calories: parseInt(m.calories) || 0,
      }));

      const { error: mealsError } = await supabase.from('nutrition_meals').insert(mealsToInsert);
      if (mealsError) throw mealsError;

      Alert.alert('Başarılı', 'Beslenme planı kaydedildi!', [
        { text: 'PDF Olarak Paylaş', onPress: () => exportNutritionPlanToPDF(planData, mealsToInsert, selectedClient.client.display_name || selectedClient.client.username) },
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Plan kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (profile?.role !== 'dietitian') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Bu sayfaya sadece Diyetisyenler erişebilir.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#10b981' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Beslenme Planı Oluştur</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Danışan Seç</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {clients.map(c => (
              <TouchableOpacity 
                key={c.client_id} 
                style={[styles.clientChip, selectedClient?.client_id === c.client_id && styles.clientChipActive]}
                onPress={() => setSelectedClient(c)}
              >
                <Text style={[styles.clientText, selectedClient?.client_id === c.client_id && styles.clientTextActive]}>
                  {c.client.display_name || c.client.username}
                </Text>
              </TouchableOpacity>
            ))}
            {clients.length === 0 && <Text style={{ color: '#666' }}>Onaylı danışanınız bulunmuyor.</Text>}
          </ScrollView>

          <Text style={styles.label}>Plan Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 1. Ay Yağ Yakımı"
            placeholderTextColor="#666"
            value={planTitle}
            onChangeText={setPlanTitle}
          />

          <View style={styles.mealsHeader}>
            <Text style={styles.label}>Öğünler</Text>
            <TouchableOpacity onPress={addMealRow}>
              <Text style={{ color: '#10b981', fontWeight: '800' }}>+ Ekle</Text>
            </TouchableOpacity>
          </View>

          {meals.map((meal, index) => (
            <View key={index} style={styles.mealCard}>
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.flex1]} placeholder="Gün (1-7)" placeholderTextColor="#666" keyboardType="numeric" value={String(meal.day_of_week)} onChangeText={(val) => updateMeal(index, 'day_of_week', val)} />
                <TextInput style={[styles.input, styles.flex2]} placeholder="Tip (breakfast...)" placeholderTextColor="#666" value={meal.meal_type} onChangeText={(val) => updateMeal(index, 'meal_type', val)} />
              </View>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top', marginTop: 8 }]}
                placeholder="Öğün İçeriği..."
                placeholderTextColor="#666"
                multiline
                value={meal.content}
                onChangeText={(val) => updateMeal(index, 'content', val)}
              />
              <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Kalori" placeholderTextColor="#666" keyboardType="numeric" value={meal.calories} onChangeText={(val) => updateMeal(index, 'calories', val)} />
            </View>
          ))}

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSavePlan} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Planı Kaydet'}</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20 },
  label: { color: '#888', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  clientChip: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#222', marginRight: 8 },
  clientChipActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  clientText: { color: '#666', fontWeight: '800' },
  clientTextActive: { color: '#10b981' },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 16, color: '#fff', marginBottom: 16 },
  mealsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  mealCard: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1, marginBottom: 0 },
  flex2: { flex: 2, marginBottom: 0 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
