import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { format } from 'date-fns';
import { getDateLocale } from '../../lib/i18n/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkContentModeration } from '../../lib/profanityFilter';
import { blockUser, reportUser } from '../../lib/blocking';
import { useTranslation } from '../../lib/i18n/i18n';
import { friendlyError } from '../../lib/useOnline';
import { setActiveChat } from '../../lib/notifications';
import AppIcon from '../../components/AppIcon';
import { Ionicons } from '@expo/vector-icons';
import AmbientBackground from '../../components/AmbientBackground';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    setActiveChat(String(id));
    return () => setActiveChat(null);
  }, [id]);

  useEffect(() => {
    if (!profile || !id) return;

    const fetchOtherProfile = async () => {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('participant_1, participant_2')
          .eq('id', id)
          .single();

        if (conv) {
          const otherId = conv.participant_1 === profile.id ? conv.participant_2 : conv.participant_1;
          const { data: p } = await supabase.from('profiles').select('*').eq('id', otherId).single();
          setOtherProfile(p);
        }
      } catch (e) {
        console.log('[Chat] fetchOtherProfile failed:', e);
      }
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data as any);
      setLoading(false);
    };

    fetchOtherProfile();
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, profile]);

  const sendMessage = async () => {
    if (!inputText.trim() || !profile || !id) return;
    const content = inputText.trim();

    const modResult = checkContentModeration(content);
    if (!modResult.isClean) {
      Alert.alert(t('chat.rules'), modResult.reason);
      return;
    }

    setInputText('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: profile.id,
      content,
    });

    if (error) {
      console.error(error);
      Alert.alert(t('chat.send_failed'), friendlyError(error.message, t));
    } else {
      // Update conversation timestamp
      await supabase.from('conversations').update({ updated_at: new Date() }).eq('id', id);
    }
  };

  const handleBlock = () => {
    if (!otherProfile || !profile) return;
    Alert.alert(
      t('chat.block_title'),
      t('chat.block_msg', { name: otherProfile.display_name || otherProfile.username }),
      [
        { text: t('chat.cancel'), style: 'cancel' },
        {
          text: t('chat.block'),
          style: 'destructive',
          onPress: async () => {
            const result = await blockUser(profile.id, otherProfile.id);
            if (result.error) {
              Alert.alert(t('common.error'), result.error);
            } else {
              Alert.alert(t('chat.blocked_title'), t('chat.blocked_msg'));
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!otherProfile || !profile) return;
    Alert.alert(
      t('chat.report_title'),
      t('chat.report_q'),
      [
        { text: t('chat.cancel'), style: 'cancel' },
        {
          text: t('chat.r_harass'),
          onPress: async () => {
            const result = await reportUser(profile.id, otherProfile.id, t('chat.r_harass_val'), 'message', typeof id === 'string' ? id : undefined);
            Alert.alert(result.error ? t('common.error') : t('chat.report_received'), result.error || t('chat.report_sent'));
          },
        },
        {
          text: t('chat.r_spam'),
          onPress: async () => {
            const result = await reportUser(profile.id, otherProfile.id, t('chat.r_spam'), 'message', typeof id === 'string' ? id : undefined);
            Alert.alert(result.error ? t('common.error') : t('chat.report_received'), result.error || t('chat.report_sent'));
          },
        },
        {
          text: t('chat.r_inapp'),
          onPress: async () => {
            const result = await reportUser(profile.id, otherProfile.id, t('chat.r_inapp_val'), 'message', typeof id === 'string' ? id : undefined);
            Alert.alert(result.error ? t('common.error') : t('chat.report_received'), result.error || t('chat.report_sent'));
          },
        },
      ]
    );
  };

  const showChatOptions = () => {
    Alert.alert(
      t('chat.options'),
      undefined,
      [
        { text: t('chat.report'), onPress: handleReport },
        { text: t('chat.block'), style: 'destructive', onPress: handleBlock },
        { text: t('chat.cancel'), style: 'cancel' },
      ]
    );
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <AmbientBackground />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherProfile?.display_name || otherProfile?.username || '...'}</Text>
          <Text style={styles.headerStatus}>{t('chat.online')}</Text>
        </View>
        <TouchableOpacity onPress={showChatOptions} style={styles.backBtn}>
          <Text style={styles.backText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === profile?.id;
          return (
            <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
              <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.content, isMe ? styles.myContent : styles.otherContent]}>
                  {item.content}
                </Text>
                <Text style={styles.time}>
                  {format(new Date(item.created_at), 'HH:mm', { locale: getDateLocale(locale) })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <AppIcon name="paper-plane" color="#ffffff" size={20} bare />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  header: {
    padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  headerStatus: { color: '#444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  messageList: { padding: 16, paddingBottom: 24 },
  messageRow: { marginBottom: 12, flexDirection: 'row' },
  myRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: '#10b981', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  content: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  myContent: { color: '#fff' },
  otherContent: { color: '#eee' },
  time: { fontSize: 8, color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-end', marginTop: 4, fontWeight: '800' },
  inputArea: {
    padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: '#111',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 14, 
    color: '#fff', fontSize: 15, fontWeight: '600',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', maxHeight: 100
  },
  sendBtn: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#10b981', 
    justifyContent: 'center', alignItems: 'center' 
  },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '900' },
});
