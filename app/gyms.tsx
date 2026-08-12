import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import { supabase } from '../lib/supabase';
import { checkTextModeration } from '../lib/profanityFilter';

interface GymItem {
  id: string;
  name: string;
  city: string;
  district: string;
  rating: number;
  phone: string;
  address: string;
  facilities: string[];
  discount_code?: string;
  image_emoji: string;
}

const FACILITIES_LIST = [
  'HEPSİ',
  'Serbest Ağırlık',
  'Havuz',
  'Pilates',
  'Sauna',
  'Boks',
];

export default function GymsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [gyms, setGyms] = useState<GymItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('HEPSİ');

  // New Gym Add Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGyms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGyms(
          data.map((g) => ({
            id: g.id,
            name: g.name,
            city: g.city || 'İstanbul',
            district: g.district || 'Merkez',
            rating: g.rating || 4.8,
            phone: g.phone || '+902125550000',
            address: g.address || '',
            facilities: Array.isArray(g.facilities)
              ? g.facilities
              : ['Serbest Ağırlık', 'Sauna'],
            discount_code: g.discount_code || 'STREAKFIT20',
            image_emoji: g.image_emoji || '🏋️‍♂️',
          }))
        );
      } else {
        setGyms([]);
      }
    } catch (e) {
      console.error('Error fetching gyms:', e);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGyms();
    setRefreshing(false);
  };

  const handleAddGym = async () => {
    if (!newName || !newCity || !newPhone) {
      Alert.alert('Eksik Bilgi', 'Lütfen salon adı, şehir ve telefon alanlarını doldurun.');
      return;
    }

    // Moderation Check for Troll / Profanity submissions
    const modResult = checkTextModeration(`${newName} ${newCity} ${newDistrict} ${newAddress} ${newDiscount}`);
    if (!modResult.isClean) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('İçerik Engellendi 🛑', modResult.reason || 'Lütfen küfür, argo veya uygunsuz ifadeler kullanmayın.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase.from('gyms').insert({
        name: newName,
        city: newCity,
        district: newDistrict || 'Merkez',
        phone: newPhone,
        address: newAddress,
        discount_code: newDiscount || 'STREAKFIT15',
        rating: 4.9,
        image_emoji: '🏋️‍♂️',
        facilities: ['Serbest Ağırlık', 'Sauna', 'PT'],
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🎉 Başarılı', 'Spor salonunuz veritabanına eklendi!');
      setAddModalVisible(false);
      setNewName('');
      setNewCity('');
      setNewDistrict('');
      setNewPhone('');
      setNewAddress('');
      setNewDiscount('');
      fetchGyms();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Salon eklenirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGyms = gyms.filter((gym) => {
    const matchSearch =
      gym.name.toLowerCase().includes(search.toLowerCase()) ||
      gym.city.toLowerCase().includes(search.toLowerCase()) ||
      gym.district.toLowerCase().includes(search.toLowerCase());

    const matchFacility =
      selectedFacility === 'HEPSİ' ||
      gym.facilities.some((f) => f.toLowerCase().includes(selectedFacility.toLowerCase()));

    return matchSearch && matchFacility;
  });

  const handleCallGym = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone}`);
  };

  const handleMapDirections = (address: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const query = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0F172A', '#0B0F19', '#020617']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>FITNESS SALONLARI & STÜDYOLAR 🏋️‍♂️</Text>
          <Text style={styles.headerSub}>Canlı Veritabanı & İndirimler</Text>
        </View>

        <TouchableOpacity
          style={styles.addTriggerBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setAddModalVisible(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTriggerText}>EKLE</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Şehir, ilçe veya salon adı ara..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Facility Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
      >
        {FACILITIES_LIST.map((fac) => (
          <TouchableOpacity
            key={fac}
            style={[styles.facChip, selectedFacility === fac && styles.facChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedFacility(fac);
            }}
          >
            <Text style={[styles.facChipText, selectedFacility === fac && styles.facChipTextActive]}>
              {fac}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : filteredGyms.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏋️‍♂️</Text>
            <Text style={styles.emptyTitle}>Henüz Salon Bulunmuyor</Text>
            <Text style={styles.emptyDesc}>
              Aramanıza uygun spor salonu bulunamadı. Sağ üstteki "EKLE" butonu ile ilk salonu sen ekleyebilirsin!
            </Text>
          </GlassCard>
        ) : (
          filteredGyms.map((gym) => (
            <GlassCard key={gym.id} style={styles.gymCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.emojiIcon}>{gym.image_emoji}</Text>
                <View style={styles.gymInfo}>
                  <Text style={styles.gymName}>{gym.name}</Text>
                  <Text style={styles.gymLoc}>
                    📍 {gym.district}, {gym.city}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>{gym.rating}</Text>
                </View>
              </View>

              <View style={styles.facRow}>
                {gym.facilities.map((fac, idx) => (
                  <View key={idx} style={styles.facTag}>
                    <Text style={styles.facTagText}>{fac}</Text>
                  </View>
                ))}
              </View>

              {gym.discount_code && (
                <View style={styles.discountBanner}>
                  <Ionicons name="pricetag" size={14} color="#10b981" />
                  <Text style={styles.discountText}>
                    StreakFit Özel İndirim Kodu: <Text style={styles.codeText}>{gym.discount_code}</Text>
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.callBtn} onPress={() => handleCallGym(gym.phone)}>
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.btnText}>ARA</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mapBtn} onPress={() => handleMapDirections(gym.address)}>
                  <Ionicons name="navigate-circle" size={18} color="#10b981" />
                  <Text style={[styles.btnText, { color: '#10b981' }]}>YOL TARİFİ</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Add Gym Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏋️‍♂️ Yeni Spor Salonu Ekle</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.label}>SALON ADI:</Text>
              <TextInput
                style={styles.input}
                placeholder="örn: MacFit Levent"
                placeholderTextColor="#64748b"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.label}>ŞEHİR:</Text>
              <TextInput
                style={styles.input}
                placeholder="örn: İstanbul"
                placeholderTextColor="#64748b"
                value={newCity}
                onChangeText={setNewCity}
              />

              <Text style={styles.label}>İLÇE:</Text>
              <TextInput
                style={styles.input}
                placeholder="örn: Kadıköy"
                placeholderTextColor="#64748b"
                value={newDistrict}
                onChangeText={setNewDistrict}
              />

              <Text style={styles.label}>TELEFON:</Text>
              <TextInput
                style={styles.input}
                placeholder="örn: +902125550000"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />

              <Text style={styles.label}>AÇIK ADRES:</Text>
              <TextInput
                style={styles.input}
                placeholder="Adres bilgisi..."
                placeholderTextColor="#64748b"
                value={newAddress}
                onChangeText={setNewAddress}
              />

              <Text style={styles.label}>İNDİRİM KODU (İSTEĞE BAĞLI):</Text>
              <TextInput
                style={styles.input}
                placeholder="STREAKFIT20"
                placeholderTextColor="#64748b"
                value={newDiscount}
                onChangeText={setNewDiscount}
              />

              <TouchableOpacity
                style={[styles.saveBtn, submitting && { opacity: 0.5 }]}
                onPress={handleAddGym}
                disabled={submitting}
              >
                <Text style={styles.saveBtnText}>{submitting ? 'KAYDEDİLİYOR...' : 'VERİTABANINA EKLE'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  addTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addTriggerText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterScroll: { maxHeight: 40, marginBottom: 12 },
  facChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  facChipActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  facChipText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  facChipTextActive: { color: '#10b981' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  emptyCard: { padding: 32, alignItems: 'center', marginTop: 20 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  gymCard: { padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  emojiIcon: { fontSize: 32 },
  gymInfo: { flex: 1 },
  gymName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  gymLoc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: { color: '#f59e0b', fontSize: 12, fontWeight: '900' },
  facRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  facTag: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  facTagText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b98115',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b98140',
    marginBottom: 14,
  },
  discountText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  codeText: { color: '#10b981', fontWeight: '900' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
