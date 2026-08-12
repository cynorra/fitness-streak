import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import AdMobBanner from '../components/AdMobBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { format, parseISO } from 'date-fns';

const BLOG_CATEGORIES = ['HEPSİ', 'SPOR', 'BESLENME', 'SAĞLIK', 'MOTİVASYON'];

interface Article {
  id: string;
  category: 'SPOR' | 'BESLENME' | 'SAĞLIK' | 'MOTİVASYON';
  title: string;
  excerpt: string;
  readTime: string;
  author: string;
  date: string;
  gradient: readonly [string, string];
  content: string;
}

export default function BlogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState('HEPSİ');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // New Article Publish Modal state for Dietitians
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'SPOR' | 'BESLENME' | 'SAĞLIK' | 'MOTİVASYON'>('BESLENME');
  const [newContent, setNewContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchBlogPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setArticles(
        data.map((item) => ({
          id: item.id,
          category: item.category || 'BESLENME',
          title: item.title,
          excerpt: item.excerpt || item.content.substring(0, 100) + '...',
          content: item.content,
          author: item.author || 'Uzman Diyetisyen & Koç',
          date: item.created_at
            ? format(parseISO(item.created_at), 'dd MMM yyyy')
            : 'Güncel',
          readTime: item.read_time || '4 dk okuma',
          gradient:
            item.category === 'BESLENME'
              ? (['#f97316', '#ea580c'] as const)
              : item.category === 'SAĞLIK'
              ? (['#10b981', '#059669'] as const)
              : (['#3b82f6', '#1d4ed8'] as const),
        }))
      );
    } else {
      setArticles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBlogPosts();
    setRefreshing(false);
  };

  const handlePublishPost = async () => {
    if (!newTitle || !newContent) {
      Alert.alert('Eksik Bilgi', 'Lütfen başlık ve içerik girin.');
      return;
    }

    setPublishing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const authorName = profile?.display_name || profile?.username || 'Uzman Diyetisyen';

      const { error } = await supabase.from('blog_posts').insert({
        title: newTitle,
        content: newContent,
        category: newCategory,
        author: `🩺 Dzt. ${authorName}`,
        excerpt: newContent.substring(0, 120) + '...',
        read_time: `${Math.max(2, Math.ceil(newContent.length / 200))} dk okuma`,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🎉 Tebrikler!', 'Blog yazınız yayınlandı.');
      setCreateModalVisible(false);
      setNewTitle('');
      setNewContent('');
      fetchBlogPosts();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Yazı yayınlanamadı.');
    } finally {
      setPublishing(false);
    }
  };

  const filtered = articles.filter(
    (a) => selectedCat === 'HEPSİ' || a.category === selectedCat
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#0B0F19', '#020617']}
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
        <Text style={styles.headerTitle}>STREAKFIT BLOG</Text>

        {profile?.role === 'dietitian' ? (
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCreateModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.publishBtnText}>YAZI EKLE</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
      >
        {/* Category Selector Chips */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={styles.catScrollContainer}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {BLOG_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  selectedCat === cat && styles.catChipActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCat(cat);
                }}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selectedCat === cat && styles.catChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <AdMobBanner />

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📖</Text>
            <Text style={styles.emptyTitle}>Henüz Yazı Bulunmuyor</Text>
            <Text style={styles.emptyDesc}>Diyetisyenlerimiz tarafından yeni rehberler hazırlanmaktadır.</Text>
          </GlassCard>
        ) : (
          filtered.map((item, idx) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(idx * 80).duration(400).springify()}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedArticle(item);
                }}
              >
                <GlassCard style={styles.articleCard}>
                  <LinearGradient colors={item.gradient} style={styles.badgeGrad}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                  </LinearGradient>
                  <Text style={styles.articleTitle}>{item.title}</Text>
                  <Text style={styles.articleExcerpt} numberOfLines={2}>{item.excerpt}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>👤 {item.author}</Text>
                    <Text style={styles.metaText}>⏱️ {item.readTime}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Article Detail Modal */}
      <Modal visible={!!selectedArticle} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <GlassCard style={styles.detailContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.detailCat}>{selectedArticle?.category}</Text>
              <TouchableOpacity onPress={() => setSelectedArticle(null)}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Text style={styles.detailTitle}>{selectedArticle?.title}</Text>
              <Text style={styles.detailMeta}>Yazar: {selectedArticle?.author} | Tarih: {selectedArticle?.date}</Text>
              <View style={styles.detailDivider} />
              <Text style={styles.detailBody}>{selectedArticle?.content}</Text>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Dietitian Publish Article Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.detailOverlay}>
          <GlassCard style={styles.detailContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✍️ Yeni Blog Yazısı Paylaş</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Text style={styles.label}>KATEGORİ SEÇİN:</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {(['BESLENME', 'SPOR', 'SAĞLIK', 'MOTİVASYON'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, newCategory === cat && styles.catChipActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.catChipText, newCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>YAZI BAŞLIĞI:</Text>
              <TextInput
                style={styles.input}
                placeholder="örn: Kas Yapımını Hızlandıran 5 Süper Besin"
                placeholderTextColor="#64748b"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>YAZI İÇERİĞİ:</Text>
              <TextInput
                style={[styles.input, { height: 140 }]}
                multiline
                placeholder="Detaylı bilgi ve uzman tavsiyelerinizi buraya yazın..."
                placeholderTextColor="#64748b"
                value={newContent}
                onChangeText={setNewContent}
              />

              <TouchableOpacity
                style={[styles.saveBtn, publishing && { opacity: 0.5 }]}
                onPress={handlePublishPost}
                disabled={publishing}
              >
                <Text style={styles.saveBtnText}>{publishing ? 'YAYINLANIYOR...' : 'YAYINLA'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  publishBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  catScrollContainer: { marginBottom: 14 },
  catChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  catChipActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  catChipText: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  catChipTextActive: { color: '#10b981' },
  emptyCard: { padding: 32, alignItems: 'center', marginTop: 20 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  articleCard: { padding: 18, marginBottom: 14 },
  badgeGrad: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  articleTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  articleExcerpt: { color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 10 },
  metaText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  detailContent: { padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  detailCat: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  detailTitle: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 26 },
  detailMeta: { color: '#64748b', fontSize: 12 },
  detailDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 8 },
  detailBody: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
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
