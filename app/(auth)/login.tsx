import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Eksik bilgi', 'Email ve şifre gerekli');
      return;
    }
    if (mode === 'signup' && (!username || username.length < 3)) {
      Alert.alert('Kullanıcı adı', 'En az 3 karakter olmalı');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: username } },
        });
        if (error) throw error;
        Alert.alert('Hoş geldin!', 'Hesabın oluşturuldu, başlayabilirsin.');
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.title}>streak-fit</Text>
          <Text style={styles.tagline}>Her gün bir adım. Streak'in yansın.</Text>
        </View>

        <View style={styles.form}>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı adı"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '...' : mode === 'login' ? 'GİRİŞ YAP' : 'KAYIT OL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Hesabın yok mu? Kayıt ol' : 'Hesabın var mı? Giriş yap'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 48 },
  flame: { fontSize: 64, marginBottom: 8 },
  title: {
    fontSize: 36, fontWeight: '900', color: '#fff',
    letterSpacing: -1, marginBottom: 8,
  },
  tagline: { color: '#888', fontSize: 14, textAlign: 'center' },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 12, padding: 16, color: '#fff', fontSize: 16,
  },
  button: {
    backgroundColor: '#ff6b35', padding: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1,
  },
  switchText: {
    color: '#888', textAlign: 'center', marginTop: 16, fontSize: 14,
  },
});
