import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Modal, Alert, Share,
  RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform, LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import { checkContentModeration } from '../lib/profanityFilter';
import { reportUser } from '../lib/blocking';
import { friendlyError } from '../lib/useOnline';
import AmbientBackground from '../components/AmbientBackground';

type Kind = 'tip' | 'recipe' | 'myth' | 'supplement';
const KINDS: Kind[] = ['tip', 'recipe', 'myth', 'supplement'];
const KIND_STYLE: Record<Kind, { emoji: string; colors: [string, string] }> = {
  tip: { emoji: '💡', colors: ['#064e3b', '#0a0a0a'] },
  recipe: { emoji: '🍳', colors: ['#7c2d12', '#0a0a0a'] },
  myth: { emoji: '🧠', colors: ['#312e81', '#0a0a0a'] },
  supplement: { emoji: '💊', colors: ['#134e4a', '#0a0a0a'] },
};

type Post = {
  id: string; author_id: string; kind: Kind; title: string; body: string;
  authorName: string; likes: number; liked: boolean;
};
type Answer = { id: string; question_id: string; author_id: string; body: string; authorName: string };
type Question = { id: string; asker_id: string; body: string; askerName: string; answers: Answer[] };

export default function Learn() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDietitian = profile?.role === 'dietitian';

  const [tab, setTab] = useState<'feed' | 'qa'>('feed');
  const [pageHeight, setPageHeight] = useState(0);

  const [posts, setPosts] = useState<Post[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // compose post (dietitians)
  const [composeOpen, setComposeOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('tip');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);

  // ask / answer
  const [askText, setAskText] = useState('');
  const [asking, setAsking] = useState(false);
  const [answerFor, setAnswerFor] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answering, setAnswering] = useState(false);

  const loadAll = useCallback(async () => {
    if (!profile) return;

    const [postsRes, questionsRes] = await Promise.all([
      supabase.from('micro_posts').select('id, author_id, kind, title, body').eq('moderation_status', 'approved').order('created_at', { ascending: false }).limit(40),
      supabase.from('qa_questions').select('id, asker_id, body').eq('moderation_status', 'approved').order('created_at', { ascending: false }).limit(50),
    ]);
    if (postsRes.error || questionsRes.error) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setFailed(false);

    const postRows = (postsRes.data || []) as any[];
    const questionRows = (questionsRes.data || []) as any[];

    const { data: answerRows } = questionRows.length
      ? await supabase.from('qa_answers').select('id, question_id, author_id, body').eq('moderation_status', 'approved').in('question_id', questionRows.map((q) => q.id)).order('created_at', { ascending: true })
      : { data: [] as any[] };

    const personIds = [...new Set([...postRows.map((p) => p.author_id), ...questionRows.map((q) => q.asker_id), ...(answerRows || []).map((a: any) => a.author_id)])];
    const [{ data: people }, likesRes] = await Promise.all([
      personIds.length ? supabase.from('profiles').select('id, display_name, username').in('id', personIds) : Promise.resolve({ data: [] as any[] }),
      postRows.length ? supabase.rpc('get_micro_post_likes', { p_ids: postRows.map((p) => p.id) }) : Promise.resolve({ data: [] as any[] }),
    ]);
    const name = new Map((people || []).map((p: any) => [p.id, p.display_name || p.username || '']));
    const likeMap = new Map(((likesRes as any).data || []).map((l: any) => [l.post_id, l]));

    setPosts(postRows.map((p) => ({
      ...p,
      authorName: name.get(p.author_id) || '',
      likes: (likeMap.get(p.id) as any)?.likes || 0,
      liked: !!(likeMap.get(p.id) as any)?.liked_by_me,
    })));
    setQuestions(questionRows.map((q) => ({
      ...q,
      askerName: name.get(q.asker_id) || '',
      answers: (answerRows || []).filter((a: any) => a.question_id === q.id).map((a: any) => ({ ...a, authorName: name.get(a.author_id) || '' })),
    })));
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const toggleLike = async (post: Post) => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const apply = (liked: boolean) =>
      setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, liked, likes: p.likes + (liked ? 1 : -1) } : p)));
    apply(!post.liked);
    const { error } = post.liked
      ? await supabase.from('micro_post_likes').delete().match({ post_id: post.id, user_id: profile.id })
      : await supabase.from('micro_post_likes').insert({ post_id: post.id, user_id: profile.id });
    if (error) apply(post.liked); // roll back
  };

  const report = (authorId: string, id: string, type: 'post' | 'comment') => {
    if (!profile) return;
    Alert.alert(t('learn.report'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('learn.report'),
        style: 'destructive',
        onPress: async () => {
          const result = await reportUser(profile.id, authorId, 'inappropriate', type, id);
          Alert.alert(result.error ? t('common.error') : '✓', result.error ? friendlyError(result.error, t) : t('learn.reported'));
        },
      },
    ]);
  };

  const remove = (table: 'micro_posts' | 'qa_questions' | 'qa_answers', id: string) => {
    Alert.alert(t('learn.delete'), t('learn.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('learn.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from(table).delete().eq('id', id);
          if (error) Alert.alert(t('common.error'), friendlyError(error.message, t));
          else loadAll();
        },
      },
    ]);
  };

  const publishPost = async () => {
    if (!profile) return;
    if (title.trim().length < 3 || body.trim().length < 10) {
      Alert.alert(t('common.error'), t('learn.invalid_post'));
      return;
    }
    const mod = checkContentModeration(`${title} ${body}`);
    if (!mod.isClean) {
      Alert.alert(t('common.error'), mod.reason);
      return;
    }
    setPublishing(true);
    const { data, error } = await supabase
      .from('micro_posts')
      .insert({ author_id: profile.id, kind, title: title.trim(), body: body.trim() })
      .select('moderation_status')
      .single();
    setPublishing(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setComposeOpen(false);
    setTitle('');
    setBody('');
    Alert.alert(t('common.success'), t(data?.moderation_status === 'flagged' ? 'learn.flagged' : 'learn.posted'));
    loadAll();
  };

  const askQuestion = async () => {
    if (!profile) return;
    if (askText.trim().length < 5) {
      Alert.alert(t('common.error'), t('learn.ask_invalid'));
      return;
    }
    const mod = checkContentModeration(askText);
    if (!mod.isClean) {
      Alert.alert(t('common.error'), mod.reason);
      return;
    }
    setAsking(true);
    const { error } = await supabase.from('qa_questions').insert({ asker_id: profile.id, body: askText.trim() });
    setAsking(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAskText('');
    Alert.alert(t('common.success'), t('learn.asked'));
    loadAll();
  };

  const sendAnswer = async () => {
    if (!profile || !answerFor) return;
    const text = answerText.trim();
    if (text.length < 2) return;
    const mod = checkContentModeration(text);
    if (!mod.isClean) {
      Alert.alert(t('common.error'), mod.reason);
      return;
    }
    setAnswering(true);
    const { error } = await supabase.from('qa_answers').insert({ question_id: answerFor.id, author_id: profile.id, body: text });
    setAnswering(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAnswerFor(null);
    setAnswerText('');
    loadAll();
  };

  const renderPost = ({ item }: { item: Post }) => {
    const style = KIND_STYLE[item.kind] || KIND_STYLE.tip;
    return (
      <LinearGradient colors={style.colors} style={{ height: pageHeight, paddingHorizontal: 24 }}>
        <View style={styles.postCenter}>
          <View style={styles.kindChip}>
            <Text style={styles.kindText}>{style.emoji} {t(`learn.kind_${item.kind}`)}</Text>
          </View>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postBody}>{item.body}</Text>
          <Text style={styles.disclaimer}>{t('learn.disclaimer')}</Text>
        </View>

        <View style={styles.postFooter}>
          <View style={{ flex: 1 }}>
            <Text style={styles.author} numberOfLines={1}>🥗 {item.authorName}</Text>
            <Text style={styles.authorRole}>{t('learn.dietitian')}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item)}>
              <Text style={styles.actionEmoji}>{item.liked ? '❤️' : '🤍'}</Text>
              <Text style={styles.actionCount}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Share.share({ message: `${item.title}\n\n${item.body}\n\n— ${item.authorName} · DietitianFit` }).catch(() => {})}
            >
              <Ionicons name="share-social-outline" size={24} color="#fff" />
            </TouchableOpacity>
            {item.author_id === profile?.id ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => remove('micro_posts', item.id)}>
                <Ionicons name="trash-outline" size={22} color="#f87171" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionBtn} onPress={() => report(item.author_id, item.id, 'post')}>
                <Ionicons name="flag-outline" size={22} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('learn.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabs}>
        {(['feed', 'qa'] as const).map((k) => (
          <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{t(`learn.tab_${k}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : tab === 'feed' ? (
        <View style={{ flex: 1 }} onLayout={(e: LayoutChangeEvent) => setPageHeight(e.nativeEvent.layout.height)}>
          {pageHeight > 0 && (
            <FlatList
              data={posts}
              keyExtractor={(p) => p.id}
              renderItem={renderPost}
              pagingEnabled
              snapToInterval={pageHeight}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
              ListEmptyComponent={
                <View style={{ height: pageHeight, justifyContent: 'center', padding: 30 }}>
                  <Text style={styles.empty}>{failed ? t('learn.load_failed') : t('learn.empty_feed')}</Text>
                </View>
              }
            />
          )}
          {posts.length > 1 && <Text style={styles.swipeHint}>{t('learn.swipe_hint')}</Text>}
          {isDietitian && (
            <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => setComposeOpen(true)}>
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={styles.fabText}>{t('learn.compose')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          >
            <View style={styles.askBox}>
              <TextInput
                style={styles.askInput}
                value={askText}
                onChangeText={setAskText}
                placeholder={t('learn.ask_ph')}
                placeholderTextColor="#666"
                multiline
                maxLength={300}
              />
              <TouchableOpacity style={[styles.askBtn, (asking || askText.trim().length < 5) && { opacity: 0.4 }]} disabled={asking || askText.trim().length < 5} onPress={askQuestion}>
                <Text style={styles.askBtnText}>{t('learn.ask')}</Text>
              </TouchableOpacity>
            </View>

            {failed && <Text style={styles.empty}>{t('learn.load_failed')}</Text>}
            {!failed && questions.length === 0 && <Text style={styles.empty}>{t('learn.no_questions')}</Text>}

            {questions.map((q) => (
              <View key={q.id} style={styles.qCard}>
                <View style={styles.qHeader}>
                  <Text style={styles.qAsker}>{q.askerName}</Text>
                  {q.asker_id === profile?.id ? (
                    <TouchableOpacity onPress={() => remove('qa_questions', q.id)}>
                      <Ionicons name="trash-outline" size={18} color="#f87171" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => report(q.asker_id, q.id, 'comment')}>
                      <Ionicons name="flag-outline" size={18} color="#71717a" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.qBody}>{q.body}</Text>

                {q.answers.length === 0 ? (
                  <Text style={styles.unanswered}>{t('learn.unanswered')}</Text>
                ) : (
                  q.answers.map((a) => (
                    <View key={a.id} style={styles.answer}>
                      <View style={styles.qHeader}>
                        <Text style={styles.aAuthor}>🥗 {a.authorName} · {t('learn.dietitian')}</Text>
                        {a.author_id === profile?.id ? (
                          <TouchableOpacity onPress={() => remove('qa_answers', a.id)}>
                            <Ionicons name="trash-outline" size={16} color="#f87171" />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity onPress={() => report(a.author_id, a.id, 'comment')}>
                            <Ionicons name="flag-outline" size={16} color="#71717a" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.aBody}>{a.body}</Text>
                    </View>
                  ))
                )}

                {isDietitian && (
                  <TouchableOpacity style={styles.answerBtn} onPress={() => { setAnswerFor(q); setAnswerText(''); }}>
                    <Text style={styles.answerBtnText}>{t('learn.answer')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <Text style={styles.disclaimerSmall}>{t('learn.disclaimer')}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Compose micro post */}
      <Modal visible={composeOpen} transparent animationType="slide" onRequestClose={() => setComposeOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('learn.compose_title')}</Text>
            <Text style={styles.label}>{t('learn.f_kind')}</Text>
            <View style={styles.chipRow}>
              {KINDS.map((k) => (
                <TouchableOpacity key={k} style={[styles.chip, kind === k && styles.chipActive]} onPress={() => setKind(k)}>
                  <Text style={[styles.chipText, kind === k && styles.chipTextActive]}>{KIND_STYLE[k].emoji} {t(`learn.kind_${k}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>{t('learn.f_title')}</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={80} placeholder={t('learn.f_title_ph')} placeholderTextColor="#555" />
            <Text style={styles.label}>{t('learn.f_body')}</Text>
            <TextInput style={[styles.input, { minHeight: 110, textAlignVertical: 'top' }]} value={body} onChangeText={setBody} multiline maxLength={800} placeholder={t('learn.f_body_ph')} placeholderTextColor="#555" />
            <Text style={styles.charCount}>{body.length}/800</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setComposeOpen(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, publishing && { opacity: 0.5 }]} disabled={publishing} onPress={publishPost}>
                <Text style={styles.saveText}>{t('learn.publish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Answer a question */}
      <Modal visible={!!answerFor} transparent animationType="slide" onRequestClose={() => setAnswerFor(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('learn.answer')}</Text>
            <Text style={styles.qBody}>{answerFor?.body}</Text>
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top', marginTop: 12 }]}
              value={answerText}
              onChangeText={setAnswerText}
              multiline
              maxLength={800}
              placeholder={t('learn.answer_ph')}
              placeholderTextColor="#555"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAnswerFor(null)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, (answering || answerText.trim().length < 2) && { opacity: 0.5 }]} disabled={answering || answerText.trim().length < 2} onPress={sendAnswer}>
                <Text style={styles.saveText}>{t('learn.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  tabActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  tabText: { color: '#71717a', fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#10b981' },
  empty: { color: '#888', textAlign: 'center', marginTop: 30, fontSize: 14 },

  postCenter: { flex: 1, justifyContent: 'center' },
  kindChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 18 },
  kindText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  postTitle: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 34, marginBottom: 14 },
  postBody: { color: '#e4e4e7', fontSize: 17, lineHeight: 26 },
  disclaimer: { color: '#71717a', fontSize: 10, marginTop: 22 },
  postFooter: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 24, gap: 10 },
  author: { color: '#fff', fontSize: 15, fontWeight: '800' },
  authorRole: { color: '#a78bfa', fontSize: 11, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 },
  actionEmoji: { fontSize: 24 },
  actionCount: { color: '#d4d4d8', fontSize: 11, fontWeight: '800' },
  swipeHint: { position: 'absolute', top: 6, alignSelf: 'center', color: '#52525b', fontSize: 11, fontWeight: '700' },
  fab: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: '#8b5cf6', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 13, fontWeight: '900' },

  askBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 16, padding: 12, marginBottom: 16 },
  askInput: { color: '#fff', minHeight: 60, textAlignVertical: 'top' },
  askBtn: { alignSelf: 'flex-end', backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 6 },
  askBtnText: { color: '#fff', fontWeight: '900' },
  qCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 16, padding: 16, marginBottom: 14 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qAsker: { color: '#a1a1aa', fontSize: 12, fontWeight: '700' },
  qBody: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 6, lineHeight: 22 },
  unanswered: { color: '#f59e0b', fontSize: 11, fontWeight: '800', marginTop: 10 },
  answer: { backgroundColor: '#8b5cf61a', borderLeftWidth: 3, borderLeftColor: '#8b5cf6', borderRadius: 8, padding: 10, marginTop: 10 },
  aAuthor: { color: '#a78bfa', fontSize: 11, fontWeight: '800' },
  aBody: { color: '#e4e4e7', fontSize: 13, marginTop: 4, lineHeight: 19 },
  answerBtn: { alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderColor: '#8b5cf6', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  answerBtnText: { color: '#a78bfa', fontWeight: '800', fontSize: 12 },
  disclaimerSmall: { color: '#52525b', fontSize: 10, textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 6 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 12, color: '#fff' },
  charCount: { color: '#52525b', fontSize: 10, textAlign: 'right', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#334155' },
  chipActive: { borderColor: '#10b981', backgroundColor: '#10b98122' },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#10b981' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingBottom: 8 },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: '#aaa', fontWeight: '800' },
  saveBtn: { flex: 1, backgroundColor: '#8b5cf6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900' },
});
