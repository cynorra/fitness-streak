import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export default function Profile() {
  const { profile, session } = useAuth();

  const signOut = () => {
    Alert.alert('Çıkış', 'Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.display_name || profile?.username}</Text>
        <Text style={styles.handle}>@{profile?.username}</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.current_streak ?? 0}</Text>
          <Text style={styles.statLabel}>GÜNCEL STREAK</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.longest_streak ?? 0}</Text>
          <Text style={styles.statLabel}>EN UZUN</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <Text style={styles.version}>streak-fit MVP v0.1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingTop: 60 },
  profileCard: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#ff6b35',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  handle: { color: '#888', fontSize: 14, marginTop: 4 },
  email: { color: '#666', fontSize: 12, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox: {
    flex: 1, backgroundColor: '#1a1a1a', padding: 20,
    borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  statValue: { color: '#ff6b35', fontSize: 40, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },
  signOutBtn: {
    backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
  },
  signOutText: { color: '#ff6b35', fontSize: 15, fontWeight: '700' },
  version: { color: '#444', fontSize: 11, textAlign: 'center', marginTop: 32 },
});
