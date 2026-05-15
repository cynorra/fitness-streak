import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!profile || !id) return;

    const fetchOtherProfile = async () => {
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
    };

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data as any);
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
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: profile.id,
      content,
    });

    if (error) {
      console.error(error);
    } else {
      // Update conversation timestamp
      await supabase.from('conversations').update({ updated_at: new Date() }).eq('id', id);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff6b35" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherProfile?.display_name || otherProfile?.username || '...'}</Text>
          <Text style={styles.headerStatus}>Çevrimiçi</Text>
        </View>
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
                  {format(new Date(item.created_at), 'HH:mm', { locale: tr })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { 
    padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', gap: 16,
    borderBottomWidth: 1, borderBottomColor: '#111'
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  headerStatus: { color: '#444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  messageList: { padding: 16, paddingBottom: 24 },
  messageRow: { marginBottom: 12, flexDirection: 'row' },
  myRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: '#ff6b35', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#1a1a1a', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#222' },
  content: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  myContent: { color: '#fff' },
  otherContent: { color: '#eee' },
  time: { fontSize: 8, color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-end', marginTop: 4, fontWeight: '800' },
  inputArea: { 
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 16, 
    flexDirection: 'row', gap: 12, alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: '#111'
  },
  input: {
    flex: 1, backgroundColor: '#111', borderRadius: 24, padding: 14, 
    color: '#fff', fontSize: 15, fontWeight: '600',
    borderWidth: 1, borderColor: '#222', maxHeight: 100
  },
  sendBtn: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#ff6b35', 
    justifyContent: 'center', alignItems: 'center' 
  },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '900' },
});
