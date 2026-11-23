import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../lib/i18n/i18n';
import { friendlyError } from '../../lib/useOnline';
import { checkContentModeration } from '../../lib/profanityFilter';
import AmbientBackground from '../../components/AmbientBackground';

type Tpl = { id: string; title: string; body: string };

export default function Templates() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('message_templates').select('id, title, body').eq('dietitian_id', profile.id).order('created_at', { ascending: false });
    setList((data || []) as Tpl[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!profile || !title.trim() || !body.trim()) return;
    const { error } = await supabase.from('message_templates').insert({ dietitian_id: profile.id, title: title.trim(), body: body.trim() });
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    setTitle('');
    setBody('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('message_templates').delete().eq('id', id);
    load();
  };

  const sendAll = (text: string) => {
    const mod = checkContentModeration(text);
    if (!mod.isClean) {
      Alert.alert(t('chat.rules'), mod.reason);
      return;
    }
    Alert.alert(t('platform.tpl_send_all'), t('platform.tpl_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('platform.tpl_send_all'),
        onPress: async () => {
          setSending(true);
          const { data, error } = await supabase.rpc('send_bulk_message', { p_body: text });
          setSending(false);
          if (error) Alert.alert(t('common.error'), friendlyError(error.message, t));
          else Alert.alert(t('common.success'), t('platform.tpl_sent', { n: String(data ?? 0) }));
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('platform.tpl_title')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('platform.tpl_title_ph')} placeholderTextColor="#666" maxLength={60} />
          <TextInput style={[styles.input, { height: 90 }]} value={body} onChangeText={setBody} placeholder={t('platform.tpl_body_ph')} placeholderTextColor="#666" multiline maxLength={1000} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#10b981' }]} onPress={save}>
              <Text style={styles.btnText}>{t('common.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#6366f1' }, (!body.trim() || sending) && { opacity: 0.45 }]} disabled={!body.trim() || sending} onPress={() => sendAll(body.trim())}>
              <Text style={styles.btnText}>{t('platform.tpl_send_all')}</Text>
            </TouchableOpacity>
          </View>

          {list.map((tpl) => (
            <View key={tpl.id} style={styles.card}>
              <Text style={styles.cardTitle}>{tpl.title}</Text>
              <Text style={styles.cardBody}>{tpl.body}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={styles.mini} onPress={() => { setTitle(tpl.title); setBody(tpl.body); }}>
                  <Text style={styles.miniText}>{t('platform.tpl_use')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mini} disabled={sending} onPress={() => sendAll(tpl.body)}>
                  <Text style={styles.miniText}>{t('platform.tpl_send_all')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mini} onPress={() => remove(tpl.id)}>
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 10, textAlignVertical: 'top' },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  cardTitle: { color: '#fff', fontWeight: '800' },
  cardBody: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
  mini: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)' },
  miniText: { color: '#d4d4d8', fontWeight: '800', fontSize: 12 },
});
