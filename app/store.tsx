import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';

const STORE_ITEMS = [
  {
    id: 'streak_freeze',
    title: 'Streak Freeze (Kalkan)',
    desc: 'Bir gün antrenman yapamazsan serin bozulmaz, koruma altına alınır.',
    cost: 500,
    icon: 'shield-checkmark',
    badge: 'EN ÇOK TERCİH EDİLEN',
    gradient: ['#3b82f6', '#1d4ed8'] as const,
  },
  {
    id: 'xp_booster',
    title: '2X XP Güçlendirici (3 Gün)',
    desc: 'Tamamladığın tüm antrenmanlardan 2 kat fazla tecrübe puanı kazan.',
    cost: 750,
    icon: 'flash',
    badge: 'POPÜLER',
    gradient: ['#eab308', '#ca8a04'] as const,
  },
  {
    id: 'gold_avatar',
    title: 'Altın Alev Çerçevesi',
    desc: 'Profilinde ve liderlik tablosunda ışıldayan özel altın çerçeve.',
    cost: 1200,
    icon: 'trophy',
    badge: 'ÖZEL SKIN',
    gradient: ['#ec4899', '#be185d'] as const,
  },
];

export default function StreakStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [userCoins, setUserCoins] = useState(1500);
  const [hasShield, setHasShield] = useState(true);

  const buyItem = (item: (typeof STORE_ITEMS)[0]) => {
    if (userCoins < item.cost) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Yetersiz XP', 'Bu eşyayı almak için yeterli XP puanın bulunmuyor!');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserCoins((prev) => prev - item.cost);
    if (item.id === 'streak_freeze') setHasShield(true);

    Alert.alert('🎉 Başarılı!', `${item.title} başarıyla envanterine eklendi.`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#180E29', '#0F091A', '#06030B']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STREAK MAĞAZASI</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.xpText}>{userCoins} XP</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Shield Status Banner */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <GlassCard
            gradientColors={
              hasShield
                ? ['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.03)']
                : ['rgba(239, 68, 68, 0.15)', 'rgba(185, 28, 28, 0.03)']
            }
            borderColor={hasShield ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}
          >
            <View style={styles.bannerRow}>
              <View
                style={[
                  styles.bannerIconBox,
                  { backgroundColor: hasShield ? '#10b98120' : '#ef444420' },
                ]}
              >
                <Ionicons
                  name={hasShield ? 'shield-checkmark' : 'shield-outline'}
                  size={32}
                  color={hasShield ? '#10b981' : '#ef4444'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  {hasShield ? 'STREAK KALKANI AKTİF' : 'KALKAN KORUMASI YOK'}
                </Text>
                <Text style={styles.bannerDesc}>
                  {hasShield
                    ? '1 Günlük serin olası kaçırmalara karşı koruma altında!'
                    : 'Serinin sıfırlanmaması için mağazadan Streak Freeze satın al.'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Store Catalog Items */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>MAĞAZA ÜRÜNLERİ</Text>
          {STORE_ITEMS.map((item, idx) => (
            <GlassCard key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.badgeBox}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              </View>

              <View style={styles.itemBody}>
                <View style={styles.itemIconBox}>
                  <Ionicons name={item.icon as any} size={28} color="#a855f7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => buyItem(item)}
              >
                <LinearGradient colors={item.gradient} style={styles.buyBtnGrad}>
                  <Text style={styles.buyBtnText}>SATIN AL</Text>
                  <View style={styles.priceRow}>
                    <Ionicons name="star" size={14} color="#fff" />
                    <Text style={styles.priceText}>{item.cost}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06030B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  xpText: { color: '#fbbf24', fontSize: 13, fontWeight: '900' },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 40 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bannerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  bannerDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 18 },
  section: { gap: 16 },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  itemCard: { padding: 20, gap: 16 },
  itemHeader: { flexDirection: 'row', justifyContent: 'flex-start' },
  badgeBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  badgeText: { color: '#c084fc', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  itemBody: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  itemDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 18 },
  buyBtn: { height: 50, borderRadius: 16, overflow: 'hidden' },
  buyBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  buyBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
