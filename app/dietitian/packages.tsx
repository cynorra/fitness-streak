import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import GlassCard from '../../components/GlassCard';
import { useTranslation } from '../../lib/i18n/i18n';

interface DietitianPackage {
  id: string;
  title: string;
  price: string;
  durationDays: number;
  description: string;
  features: string[];
}

const buildDefaultPackages = (t: (k: string) => string): DietitianPackage[] => [
  {
    id: '1',
    title: t('packages.p1_title'),
    price: t('packages.p1_price'),
    durationDays: 30,
    description: t('packages.p1_desc'),
    features: [t('packages.p1_f1'), t('packages.p1_f2'), t('packages.p1_f3'), t('packages.p1_f4')],
  },
  {
    id: '2',
    title: t('packages.p2_title'),
    price: t('packages.p2_price'),
    durationDays: 90,
    description: t('packages.p2_desc'),
    features: [t('packages.p2_f1'), t('packages.p2_f2'), t('packages.p2_f3'), t('packages.p2_f4')],
  },
];

export default function DietitianPackages() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();

  const [packages, setPackages] = useState<DietitianPackage[]>(() => buildDefaultPackages(t));
  const [modalVisible, setModalVisible] = useState(false);

  // New Package form
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDays, setNewDays] = useState('30');
  const [newDesc, setNewDesc] = useState('');

  const handleAddPackage = () => {
    if (!newTitle || !newPrice) {
      Alert.alert(t('packages.missing'), t('packages.missing_msg'));
      return;
    }

    const created: DietitianPackage = {
      id: String(Date.now()),
      title: newTitle,
      price: /[₺$]/.test(newPrice) ? newPrice : t('packages.currency') === '$' ? `$${newPrice}` : `${newPrice} ${t('packages.currency')}`,
      durationDays: Number(newDays) || 30,
      description: newDesc || t('packages.default_desc'),
      features: [t('packages.custom_f1'), t('packages.custom_f2'), t('packages.custom_f3')],
    };

    setPackages([created, ...packages]);
    setModalVisible(false);
    setNewTitle('');
    setNewPrice('');
    setNewDesc('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('packages.success'), t('packages.published'));
  };

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
          <Text style={styles.headerTitle}>{t('packages.title')}</Text>
          <Text style={styles.headerSub}>{t('packages.sub')}</Text>
        </View>
        {profile?.role === 'dietitian' && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setModalVisible(true);
            }}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {packages.map((pkg) => (
          <GlassCard key={pkg.id} style={styles.packageCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.pkgTitle}>{pkg.title}</Text>
              <Text style={styles.pkgPrice}>{pkg.price}</Text>
            </View>

            <Text style={styles.pkgDesc}>{pkg.description}</Text>

            <View style={styles.featuresList}>
              {pkg.features.map((feat, idx) => (
                <View key={idx} style={styles.featRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.featText}>{feat}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (profile?.role === 'dietitian') {
                  Alert.alert(t('packages.info_title'), t('packages.info_msg'));
                } else {
                  router.push('/appointments' as any);
                }
              }}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.selectBtnGrad}>
                <Text style={styles.selectBtnText}>
                  {profile?.role === 'dietitian' ? t('packages.edit') : t('packages.apply')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Add Package Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('packages.modal_title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <Text style={styles.label}>{t('packages.pkg_title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('packages.pkg_title_ph')}
                placeholderTextColor="#64748b"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>{t('packages.price')}</Text>
              <TextInput
                style={styles.input}
                placeholder="1500"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={newPrice}
                onChangeText={setNewPrice}
              />

              <Text style={styles.label}>{t('packages.days')}</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={newDays}
                onChangeText={setNewDays}
              />

              <Text style={styles.label}>{t('packages.desc')}</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                multiline
                placeholder={t('packages.desc_ph')}
                placeholderTextColor="#64748b"
                value={newDesc}
                onChangeText={setNewDesc}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPackage}>
                <Text style={styles.saveBtnText}>{t('packages.publish')}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
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
  addBtn: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  packageCard: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pkgTitle: { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1, paddingRight: 10 },
  pkgPrice: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  pkgDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 14 },
  featuresList: { gap: 8, marginBottom: 18 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  selectBtn: { borderRadius: 14, overflow: 'hidden' },
  selectBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  selectBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24 },
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
  saveBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
