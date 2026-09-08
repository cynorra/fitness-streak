import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard, Alert, Share
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useTranslation } from '../../lib/i18n/i18n';
import { getDateLocale } from '../../lib/i18n/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkContentModeration } from '../../lib/profanityFilter';
import { reportUser } from '../../lib/blocking';
import AdMobBanner from '../../components/AdMobBanner';

type PostItem = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    username: string;
    display_name: string | null;
    role?: string;
    current_streak?: number;
  };
  like_count: number;
  user_liked: boolean;
  comment_count: number;
};

export default function Feed() {
  const { profile } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const dateLocale = getDateLocale(locale);

  const load = useCallback(async () => {
    if (!profile) return;

    // Sadece onaylanmış postları çekiyoruz
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id, moderation_status')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !posts || posts.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(posts.map(p => p.user_id))];
    const postIds = posts.map(p => p.id);

    const [
      { data: profiles },
      { data: likesData },
      { data: commentsData }
    ] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, role, current_streak').in('id', userIds),
      supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('post_comments').select('post_id, id').in('post_id', postIds),
    ]);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const likesByPost = new Map<string, { count: number; userLiked: boolean }>();
    
    (likesData || []).forEach(l => {
      const curr = likesByPost.get(l.post_id) || { count: 0, userLiked: false };
      likesByPost.set(l.post_id, {
        count: curr.count + 1,
        userLiked: curr.userLiked || l.user_id === profile.id,
      });
    });

    const commentsByPost = new Map<string, number>();
    (commentsData || []).forEach(c => {
      commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) || 0) + 1);
    });

    const feed: PostItem[] = posts.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) as any,
      like_count: likesByPost.get(p.id)?.count || 0,
      user_liked: likesByPost.get(p.id)?.userLiked || false,
      comment_count: commentsByPost.get(p.id) || 0,
    }));

    setItems(feed);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePost = async () => {
    if (!profile || !newPostContent.trim()) return;

    // Profanity & Spam Filter check
    const modResult = checkContentModeration(newPostContent.trim());
    if (!modResult.isClean) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Topluluk Kuralları Engeli 🛑', modResult.reason);
      return;
    }

    setIsPosting(true);
    Keyboard.dismiss();

    const { error } = await supabase.from('posts').insert({
      user_id: profile.id,
      content: newPostContent.trim(),
    });

    setIsPosting(false);
    
    if (error) {
      Alert.alert(t('common.error'), `${t('common.error')}: Failed to publish post. (${error.message})`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewPostContent('');
      onRefresh(); // Refresh feed
    }
  };

  const handleReportPost = (item: PostItem) => {
    if (!profile) return;
    Alert.alert(
      'Gönderiyi Şikayet Et',
      'Bu gönderiyi neden şikayet ediyorsun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Uygunsuz İçerik / Küfür',
          onPress: async () => {
            const result = await reportUser(profile.id, item.user_id, 'Uygunsuz içerik / küfür', 'post', item.id);
            Alert.alert(result.error ? 'Hata' : 'Şikayet Alındı', result.error || 'Şikayetin ekibimize iletildi, en kısa sürede incelenecek.');
          },
        },
        {
          text: 'Spam',
          onPress: async () => {
            const result = await reportUser(profile.id, item.user_id, 'Spam', 'post', item.id);
            Alert.alert(result.error ? 'Hata' : 'Şikayet Alındı', result.error || 'Şikayetin ekibimize iletildi, en kısa sürede incelenecek.');
          },
        },
        {
          text: 'Taciz / Rahatsız Edici',
          onPress: async () => {
            const result = await reportUser(profile.id, item.user_id, 'Taciz / Rahatsız edici', 'post', item.id);
            Alert.alert(result.error ? 'Hata' : 'Şikayet Alındı', result.error || 'Şikayetin ekibimize iletildi, en kısa sürede incelenecek.');
          },
        },
      ]
    );
  };

  const toggleLike = async (item: PostItem) => {
    if (!profile) return;

    const isCurrentlyLiked = item.user_liked;

    // Optimistic UI
    setItems(curr => curr.map(i =>
      i.id === item.id
        ? { 
            ...i, 
            user_liked: !isCurrentlyLiked, 
            like_count: isCurrentlyLiked ? i.like_count - 1 : i.like_count + 1 
          }
        : i
    ));

    if (isCurrentlyLiked) {
      await supabase.from('post_likes').delete().match({ post_id: item.id, user_id: profile.id });
    } else {
      await supabase.from('post_likes').insert({ post_id: item.id, user_id: profile.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(400).springify()} style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.logoRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoLetter}>F</Text>
                </View>
                <Text style={styles.logoText}>VITA<Text style={{color: '#10b981'}}>TRIBE</Text></Text>
              </View>
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.push('/messages' as any); }} style={styles.msgBtn}>
                <Text style={styles.msgIcon}>💬</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{t('feed.title')}</Text>

            {/* Create Post Section */}
            <Animated.View entering={FadeInUp.delay(150).duration(400).springify()} style={styles.createPostContainer}>
              <TextInput
                style={styles.postInput}
                placeholder={t('feed.post_placeholder')}
                placeholderTextColor="#555"
                multiline
                maxLength={500}
                value={newPostContent}
                onChangeText={setNewPostContent}
              />
              <View style={styles.postActionRow}>
                <Text style={styles.charCount}>{newPostContent.length}/500</Text>
                <TouchableOpacity 
                  style={[styles.postButton, (!newPostContent.trim() || isPosting) && styles.postButtonDisabled]}
                  onPress={handlePost}
                  disabled={!newPostContent.trim() || isPosting}
                >
                  {isPosting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.postButtonText}>{t('feed.post_button')} ✨</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* AdMob Banner in Feed */}
            <View style={{ marginTop: 12 }}>
              <AdMobBanner />
            </View>
          </Animated.View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>
              {t('feed.no_posts')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 60).duration(350).springify()}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.profile?.display_name || item.profile?.username || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.userName}>
                    {item.profile?.display_name || item.profile?.username}
                  </Text>
                  
                  {/* Role Badges */}
                  {item.profile?.role === 'dietitian' ? (
                    <View style={styles.dietitianBadge}>
                      <Text style={styles.dietitianBadgeText}>🩺 Diyetisyen</Text>
                    </View>
                  ) : (item.profile?.current_streak || 0) >= 30 ? (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>🏆 Pro Sporcu</Text>
                    </View>
                  ) : (
                    <View style={styles.userBadge}>
                      <Text style={styles.userBadgeText}>💪 Üye</Text>
                    </View>
                  )}

                  <Text style={styles.userHandle}>@{item.profile?.username}</Text>
                </View>
                <Text style={styles.userMeta}>
                  {format(parseISO(item.created_at), 'd MMM HH:mm', { locale: dateLocale })}
                </Text>
              </View>
              {item.user_id !== profile?.id && (
                <TouchableOpacity
                  style={styles.reportBtn}
                  onPress={() => { Haptics.selectionAsync(); handleReportPost(item); }}
                >
                  <Text style={styles.reportBtnText}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.postContent}>{item.content}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleLike(item); }}
              >
                <Text style={styles.actionEmoji}>{item.user_liked ? '❤️' : '🤍'}</Text>
                <Text style={[styles.actionCount, item.user_liked && styles.likeCountActive]}>
                  {item.like_count}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <Text style={styles.actionEmoji}>💬</Text>
                <Text style={styles.actionCount}>{item.comment_count}</Text>
              </View>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Share.share({
                    message: `🔥 VitaTribe Spor Serisi Paylaşımı: "${item.content}" - Sen de katıl! #VitaTribe #Fitness #Diyet`,
                  });
                }}
              >
                <Text style={styles.actionEmoji}>📸</Text>
                <Text style={styles.actionCount}>Hikayede Paylaş</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { padding: 24, gap: 12, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  msgBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  msgIcon: { fontSize: 20 },
  logoBox: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1.5 },
  title: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  
  createPostContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  postInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    fontStyle: 'italic',
  },
  postActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600'
  },
  postButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  postButtonDisabled: {
    backgroundColor: '#444',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  empty: { padding: 48, alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  card: {
    backgroundColor: '#111', marginHorizontal: 16, marginBottom: 16,
    padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#222',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#222',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#10b981', fontWeight: '900', fontSize: 18 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  dietitianBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  dietitianBadgeText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  proBadge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  proBadgeText: { color: '#f59e0b', fontSize: 10, fontWeight: '900' },
  userBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userBadgeText: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  userHandle: { color: '#666', fontSize: 12, fontWeight: '600' },
  reportBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  reportBtnText: { color: '#666', fontSize: 18, fontWeight: '900' },
  userMeta: { color: '#888', fontSize: 11, marginTop: 4, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  
  postContent: {
    color: '#f4f4f5',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 20,
  },
  
  actions: { flexDirection: 'row', gap: 20 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: '#1a1a1a', borderRadius: 12,
  },
  actionEmoji: { fontSize: 14 },
  actionCount: { color: '#888', fontSize: 13, fontWeight: '700' },
  likeCountActive: { color: '#10b981' },
});
