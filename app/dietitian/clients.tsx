import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/GlassCard';
import { calculateNutritionTargets, BMRParams } from '../../lib/nutritionCalc';

export default function DietitianClients() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // BMR Calc Modal state
  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcParams, setCalcParams] = useState<BMRParams>({
    weightKg: 75,
    heightCm: 175,
    ageYears: 28,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'lose_weight',
  });
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dietitian_clients')
        .select(`
          id, status, created_at,
          client:client_id (id, username, display_name, avatar_url, current_streak)
        `)
        .eq('dietitian_id', profile.id);

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateBMR = () => {
    const result = calculateNutritionTargets(calcParams);
    setCalcResult(result);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filteredClients = clients.filter((item) => {
    const name = item.client?.display_name || item.client?.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0F172A', '#0B0F19', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>DANIŞAN KONTROL MERKEZİ 🩺</Text>
          <Text style={styles.headerSub}>Aktif Danışan Takibi & BMR Hesaplayıcı</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCalcModalVisible(true);
          }}
          style={styles.calcTriggerBtn}
        >
          <Ionicons name="calculator-outline" size={22} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Danışan adı ile ara..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Stats Bar */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{clients.length}</Text>
            <Text style={styles.statLbl}>TOPLAM DANIŞAN</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>%92</Text>
            <Text style={styles.statLbl}>ORTALAMA UYUM</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#f59e0b' }]}>24</Text>
            <Text style={styles.statLbl}>BU HAFTA SEANS</Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>AKTİF DANIŞANLAR</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : filteredClients.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🩺</Text>
            <Text style={styles.emptyTitle}>Henüz Danışanınız Bulunmuyor</Text>
            <Text style={styles.emptyDesc}>
              Kullanıcılar profilinizden size randevu talebi gönderdiğinde burada listelenecektir.
            </Text>
          </GlassCard>
        ) : (
          filteredClients.map((item) => (
            <GlassCard key={item.id} style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(item.client?.display_name || item.client?.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>

                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {item.client?.display_name || item.client?.username}
                  </Text>
                  <Text style={styles.clientStreak}>
                    🔥 {item.client?.current_streak || 0} Günlük Seri | Status: {item.status}
                  </Text>
                </View>

                <View style={styles.complianceBadge}>
                  <Text style={styles.complianceText}>%95 UYUM</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/dietitian/create-plan' as any,
                      params: { clientId: item.client?.id },
                    });
                  }}
                >
                  <Ionicons name="document-text-outline" size={16} color="#10b981" />
                  <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Diyet Yaz</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#3b82f620', borderColor: '#3b82f6' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/chat/[id]' as any,
                      params: { id: item.client?.id },
                    });
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#3b82f6" />
                  <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Mesaj At</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/appointments' as any);
                  }}
                >
                  <Ionicons name="calendar-outline" size={16} color="#f59e0b" />
                  <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Seans Notu</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* BMR / TDEE Calculator Modal */}
      <Modal visible={calcModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🧮 Klinik BMR & TDEE Hesaplayıcı</Text>
              <TouchableOpacity onPress={() => setCalcModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Text style={styles.inputLabel}>KİLO (kg):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={String(calcParams.weightKg)}
                onChangeText={(v) => setCalcParams({ ...calcParams, weightKg: Number(v) || 70 })}
              />

              <Text style={styles.inputLabel}>BOY (cm):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={String(calcParams.heightCm)}
                onChangeText={(v) => setCalcParams({ ...calcParams, heightCm: Number(v) || 170 })}
              />

              <Text style={styles.inputLabel}>YAŞ:</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={String(calcParams.ageYears)}
                onChangeText={(v) => setCalcParams({ ...calcParams, ageYears: Number(v) || 25 })}
              />

              <TouchableOpacity style={styles.calcBtn} onPress={handleCalculateBMR}>
                <Text style={styles.calcBtnText}>HESAPLA</Text>
              </TouchableOpacity>

              {calcResult && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultRow}>⚡ Bazal Metabolizma (BMR): <Text style={styles.resHighlight}>{calcResult.bmr} kcal</Text></Text>
                  <Text style={styles.resultRow}>🔥 Harcanan Enerji (TDEE): <Text style={styles.resHighlight}>{calcResult.tdee} kcal</Text></Text>
                  <Text style={styles.resultRow}>🎯 Hedef Kalori: <Text style={[styles.resHighlight, { color: '#10b981' }]}>{calcResult.targetCalories} kcal</Text></Text>
                  <Text style={styles.resultRow}>🥩 Protein: {calcResult.macros.proteinGrams}g | 🌾 Karb: {calcResult.macros.carbsGrams}g | 🥑 Yağ: {calcResult.macros.fatGrams}g</Text>
                </View>
              )}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  calcTriggerBtn: {
    backgroundColor: '#10b98120',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statsCard: { flexDirection: 'row', padding: 18, marginBottom: 20, justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLbl: { color: '#64748b', fontSize: 9, fontWeight: '900', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  clientCard: { padding: 16, marginBottom: 14 },
  clientHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  avatarText: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  clientInfo: { flex: 1 },
  clientName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  clientStreak: { color: '#64748b', fontSize: 11, marginTop: 2 },
  complianceBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  complianceText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  inputLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', marginTop: 8 },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  calcBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  calcBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  resultBox: { marginTop: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 14, borderRadius: 12, gap: 6 },
  resultRow: { color: '#cbd5e1', fontSize: 12 },
  resHighlight: { fontWeight: '900', color: '#fff' },
});
