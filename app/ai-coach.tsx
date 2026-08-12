import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

const QUICK_PROMPTS = [
  '⚡ 15 Dakikalık Hızlı Ev Antrenmanı',
  '🥗 Antrenman Sonrası Ne Yemeliyim?',
  '🔥 Günlük Makro Hedeflerimi Doğrula',
];

export default function AICoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Merhaba Eren! Ben senin kişisel StreakFit AI Koçunum. Bugün antrenman ya da beslenme hedeflerinle ilgili nasıl yardımcı olabilirim?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Dynamic AI response generator
    setTimeout(() => {
      let reply = 'Harika bir soru! Hedeflerine göre günlük protein alımını kg başına 1.8-2.0g seviyesinde tutmanı ve antrenman sonrasında 30g protein içeren bir öğün tercih etmeni öneririm.';
      if (query.includes('15')) {
        reply = '⚡ **15 Dakikalık Yüksek Yoğunluklu Hızlı Yıkım:**\n1. 45sn Jumping Jacks (15sn Dinlenme)\n2. 45sn Push-Ups (15sn Dinlenme)\n3. 45sn High Knees (15sn Dinlenme)\n4. 45sn Bodyweight Squats\n(3 Tur Tekrar Et!)';
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: reply },
      ]);
      setIsTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0F0826', '#090518', '#03020A']}
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
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>STREAK AI KOÇ</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>ÇEVRİMİÇİ</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Prompts Carousel */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={styles.promptsContainer}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptChip}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Chat Messages */}
        <View style={styles.messagesList}>
          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.duration(300).springify()}
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color="#a855f7" />
                </View>
              )}
              <View
                style={[
                  styles.msgTextContainer,
                  msg.sender === 'user'
                    ? styles.userTextContainer
                    : styles.aiTextContainer,
                ]}
              >
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            </Animated.View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#a855f7" />
              </View>
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>Yazıyor...</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="AI Koçuna soru sor..."
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()}>
          <LinearGradient colors={['#c084fc', '#9333ea']} style={styles.sendBtnGrad}>
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#03020A' },
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
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  onlineText: { color: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 20 },
  promptsContainer: { marginBottom: 8 },
  promptChip: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginRight: 8,
  },
  promptText: { color: '#e9d5ff', fontSize: 12, fontWeight: '700' },
  messagesList: { gap: 14 },
  messageBubble: { flexDirection: 'row', gap: 10, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgTextContainer: { padding: 14, borderRadius: 20 },
  userTextContainer: {
    backgroundColor: '#9333ea',
    borderBottomRightRadius: 4,
  },
  aiTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  msgText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  typingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  typingText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    backgroundColor: '#090518',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 25,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  sendBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
