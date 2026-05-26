import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { format } from 'date-fns';
import { useTranslation } from '../../lib/i18n/i18n';
import { getDateLocale } from '../../lib/i18n/dateUtils';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'message' | 'dietitian_request' | 'dietitian_approved' | 'repost';
  is_read: boolean;
  created_at: string;
  actor: {
    display_name: string | null;
    username: string;
  };
  post_id?: string;
};

export default function Notifications() {
  const { profile } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dateLocale = getDateLocale(locale);

  const load = useCallback(async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        is_read,
        created_at,
        post_id,
        actor:actor_id(display_name, username)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setItems(data as any);
    setLoading(false);

    // Mark as read
    if (data && data.some(n => !n.is_read)) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'dietitian_request': return '🤝';
      case 'dietitian_approved': return '✅';
      case 'repost': return '🔄';
      default: return '🔔';
    }
  };

  const getMessage = (notif: Notification) => {
    const name = notif.actor.display_name || notif.actor.username;
    
    // Dynamic multilingual notification message mapper
    const messages: Record<string, Record<string, string>> = {
      tr: {
        like: "paylaşımını beğendi.",
        comment: "paylaşımına yorum yaptı.",
        dietitian_request: "seninle çalışmak istiyor!",
        dietitian_approved: "talebini onayladı.",
        repost: "paylaşımını repostladı.",
        default: "bir işlem yaptı."
      },
      en: {
        like: "liked your post.",
        comment: "commented on your post.",
        dietitian_request: "wants to work with you!",
        dietitian_approved: "approved your request.",
        repost: "reposted your post.",
        default: "performed an action."
      },
      de: {
        like: "hat deinen Beitrag geliked.",
        comment: "hat deinen Beitrag kommentiert.",
        dietitian_request: "möchte mit dir arbeiten!",
        dietitian_approved: "hat deine Anfrage bestätigt.",
        repost: "hat deinen Beitrag geteilt.",
        default: "hat eine Aktion durchgeführt."
      },
      fr: {
        like: "a aimé votre publication.",
        comment: "a commenté votre publication.",
        dietitian_request: "veut travailler avec vous !",
        dietitian_approved: "a approuvé votre demande.",
        repost: "a repartagé votre publication.",
        default: "a effectué une action."
      },
      it: {
        like: "ha messo mi piace al tuo post.",
        comment: "ha commentato il tuo post.",
        dietitian_request: "vuole lavorare con te!",
        dietitian_approved: "ha approvato la tua richiesta.",
        repost: "ha ricondiviso il tuo post.",
        default: "ha eseguito un'azione."
      },
      es: {
        like: "le gustó tu publicación.",
        comment: "comentó tu publicación.",
        dietitian_request: "quiere trabajar contigo!",
        dietitian_approved: "aprobó tu solicitud.",
        repost: "compartió tu publicación.",
        default: "realizó una acción."
      },
      pt: {
        like: "curtiu sua publicação.",
        comment: "comentou em sua publicação.",
        dietitian_request: "quer trabalhar com você!",
        dietitian_approved: "aprovou sua solicitação.",
        repost: "recompartilhou sua publicação.",
        default: "realizou uma ação."
      },
      ru: {
        like: "понравилась ваша публикация.",
        comment: "прокомментировал вашу публикацию.",
        dietitian_request: "хочет работать с вами!",
        dietitian_approved: "одобрил ваш запрос.",
        repost: "поделился вашей публикацией.",
        default: "выполнил действие."
      },
      uk: {
        like: "сподобалась ваша публікація.",
        comment: "прокоментував вашу публікацію.",
        dietitian_request: "хоче працювати з вами!",
        dietitian_approved: "схвалив ваш запит.",
        repost: "поділився вашою публікацією.",
        default: "виконав дію."
      },
      zh: {
        like: "赞了你的动态。",
        comment: "评论了你的动态。",
        dietitian_request: "想和你合作！",
        dietitian_approved: "批准 your 请求。",
        repost: "转发了你的动态。",
        default: "进行了操作。"
      },
      ja: {
        like: "があなたの投稿にいいねしました。",
        comment: "があなたの投稿にコメントしました。",
        dietitian_request: "があなたと一緒に働きたいと言っています！",
        dietitian_approved: "があなたのリクエストを承認しました。",
        repost: "があなたの投稿をリポストしました。",
        default: "がアクションを実行しました。"
      },
      ko: {
        like: "님이 회원님의 게시물을 좋아합니다.",
        comment: "님이 회원님의 게시물에 댓글을 남겼습니다.",
        dietitian_request: "님이 회원님과 함께 일하고 싶어 합니다!",
        dietitian_approved: "님이 회원님의 요청을 승인했습니다.",
        repost: "님이 회원님의 게시물을 공유했습니다.",
        default: "님이 작업을 수행했습니다."
      },
      hi: {
        like: "ने आपकी पोस्ट पसंद की।",
        comment: "ने आपकी पोस्ट पर टिप्पणी की।",
        dietitian_request: "आपके साथ काम करना चाहता है!",
        dietitian_approved: "ने आपके अनुरोध को मंजूरी दी।",
        repost: "ने आपकी पोस्ट को रीपोस्ट किया।",
        default: "ने एक क्रिया की।"
      },
      el: {
        like: "του άρεσε η δημοσίευσή σας.",
        comment: "σχολίασε τη δημοσίευσή σας.",
        dietitian_request: "θέλει να συνεργαστεί μαζί σας!",
        dietitian_approved: "ενέκρινε το αίτημά σας.",
        repost: "αναδημοσίευσε τη δημοσίευσή σας.",
        default: "έκανε μια ενέργεια."
      }
    };
    
    const msgs = messages[locale] || messages['en'];
    const msg = msgs[notif.type] || msgs['default'];
    return `${name} ${msg}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>S</Text>
            </View>
            <Text style={styles.logoText}>VITA<Text style={{color: '#10b981'}}>TRIBE</Text></Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/messages' as any)} style={styles.msgBtn}>
            <Text style={styles.msgIcon}>💬</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t('notifications.title')}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>{t('notifications.no_notifications')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_read && styles.cardUnread]}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'like' ? '#fff1f2' : '#fff7ed' }]}>
              <Text style={styles.icon}>{getEmoji(item.type)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.message}>{getMessage(item)}</Text>
              <Text style={styles.date}>
                {format(new Date(item.created_at), 'd MMM HH:mm', { locale: dateLocale }).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60, gap: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  msgBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  msgIcon: { fontSize: 20 },
  logoBox: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1.5 },
  title: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  empty: { padding: 48, alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16, opacity: 0.2 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, marginBottom: 8, padding: 16,
    backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#222',
  },
  cardUnread: { borderColor: '#10b98133', backgroundColor: '#1a1a1a' },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 20 },
  message: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  date: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
});
