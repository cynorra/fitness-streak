import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/GlassCard';
import { useTranslation, supportedLanguages } from '../../lib/i18n/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { t, locale, changeLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'dietitian'>('user');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const redirectUrl = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Google giriş adresi alınamadı.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type !== 'success') {
        // Kullanıcı pencereyi kapattı / iptal etti
        return;
      }

      // Token'lar fragment (#) ya da query (?) içinde gelebilir
      const returned = result.url;
      const params = new URLSearchParams(
        returned.includes('#') ? returned.split('#')[1] : (returned.split('?')[1] || '')
      );

      const oauthError = params.get('error_description') || params.get('error');
      if (oauthError) throw new Error(oauthError);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const code = params.get('code');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        throw new Error('Google girişi tamamlanamadı.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), err.message || 'Google ile giriş başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), 'Lütfen e-posta adresi ve şifrenizi girin.');
      return;
    }
    if (mode === 'signup' && (!username || username.length < 3)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), 'Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: username, role: selectedRole } },
        });
        if (error) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🎉 Hoş geldin!', 'Hesabın başarıyla oluşturuldu.');
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), err.message || 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Şifre Sıfırlama', 'Lütfen şifre sıfırlama bağlantısı göndermek için e-posta adresinizi girin.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      Alert.alert('Şifre Sıfırlama', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0F172A', '#0B0F19', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Language Switcher Bar */}
      <View style={[styles.langBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.langPill}>
          <Ionicons name="globe-outline" size={14} color="#10b981" />
          {['tr', 'en', 'ar', 'de', 'es', 'ru', 'zh', 'ja', 'ko', 'hi'].map((code) => (
            <TouchableOpacity
              key={code}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                changeLanguage(code);
              }}
              style={[
                styles.langBtn,
                locale === code && styles.langBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.langBtnText,
                  locale === code && styles.langBtnTextActive,
                ]}
              >
                {code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.title}>
            STREAK<Text style={{ color: '#10b981' }}>FIT</Text>
          </Text>
          <Text style={styles.tagline}>Her gün bir adım. Seri alevin hiç sönmesin.</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.form}>
            {/* Primary Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={styles.googleBtnText}>GOOGLE İLE İLERLE</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>VEYA E-POSTA İLE</Text>
              <View style={styles.dividerLine} />
            </View>

            {mode === 'signup' && (
              <>
                <View>
                  <Text style={styles.label}>HESAP TİPİ SEÇ</Text>
                  <View style={styles.roleRow}>
                    <TouchableOpacity
                      style={[
                        styles.roleChip,
                        selectedRole === 'user' && styles.roleChipActive,
                      ]}
                      onPress={() => setSelectedRole('user')}
                    >
                      <Text style={styles.roleChipIcon}>💪</Text>
                      <Text
                        style={[
                          styles.roleChipText,
                          selectedRole === 'user' && styles.roleChipTextActive,
                        ]}
                      >
                        SPORCU / ÜYE
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleChip,
                        selectedRole === 'dietitian' && styles.roleChipActive,
                      ]}
                      onPress={() => setSelectedRole('dietitian')}
                    >
                      <Text style={styles.roleChipIcon}>🩺</Text>
                      <Text
                        style={[
                          styles.roleChipText,
                          selectedRole === 'dietitian' && styles.roleChipTextActive,
                        ]}
                      >
                        DİYETİSYEN
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>KULLANICI ADI</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="örn: fit_erene"
                    placeholderTextColor="#64748b"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}

            <View>
              <Text style={styles.label}>E-POSTA ADRESİ</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text style={styles.label}>ŞİFRE</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {mode === 'login' && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.buttonGrad}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'YÜKLENİYOR...' : mode === 'login' ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode(mode === 'login' ? 'signup' : 'login');
              }}
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? 'Hesabın yok mu? Kayıt ol'
                  : 'Zaten hesabın var mı? Giriş yap'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  langBar: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  langBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  langBtnActive: {
    backgroundColor: '#10b981',
  },
  langBtnText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
  },
  langBtnTextActive: {
    color: '#fff',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 24 },
  flame: { fontSize: 64, marginBottom: 8 },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: { color: '#94a3b8', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  card: { padding: 24 },
  form: { gap: 16 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#ffffff',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  googleBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  label: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleChipActive: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  roleChipIcon: { fontSize: 16 },
  roleChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  roleChipTextActive: { color: '#10b981' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  button: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  buttonGrad: { padding: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  switchText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },
});
