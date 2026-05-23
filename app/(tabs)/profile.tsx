import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Modal, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useState } from 'react';

export default function Profile() {
  const { profile, session, refreshProfile } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [newName, setNewName] = useState(profile?.display_name || '');
  const [updating, setUpdating] = useState(false);

  const signOut = () => {
    Alert.alert('Çıkış', 'Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const updateProfile = async () => {
    if (!profile) return;
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', profile.id);
    
    if (error) {
      Alert.alert('Hata', 'Profil güncellenemedi.');
    } else {
      await refreshProfile();
      setEditModal(false);
    }
    setUpdating(false);
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
        
        <TouchableOpacity style={styles.editBtn} onPress={() => {
          setNewName(profile?.display_name || '');
          setEditModal(true);
        }}>
          <Text style={styles.editBtnText}>PROFİLİ DÜZENLE</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PROFİLİ DÜZENLE</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GÖRÜNÜR AD</Text>
              <TextInput 
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Adınız"
                placeholderTextColor="#444"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>İPTAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={updateProfile} disabled={updating}>
                <Text style={styles.saveBtnText}>{updating ? 'KAYDEDİLİYOR...' : 'KAYDET'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => Linking.openURL('https://vitatribe.com/privacy')}>
          <Text style={styles.legalText}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>•</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://vitatribe.com/terms')}>
          <Text style={styles.legalText}>Kullanım Şartları</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => Alert.alert('Hesabı Sil', 'Hesabınızı silmek için destek@vitatribe.com adresine e-posta gönderebilirsiniz. 30 gün içinde tüm verileriniz silinecektir.')}
      >
        <Text style={styles.deleteText}>Hesabımı Sil</Text>
      </TouchableOpacity>

      <Text style={styles.version}>VITATRIBE v1.0.0</Text>
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
  signOutText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 },
  legalText: { color: '#444', fontSize: 12, fontWeight: '600' },
  legalDot: { color: '#222' },
  deleteBtn: { marginTop: 24, alignSelf: 'center' },
  deleteText: { color: '#b91c1c', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  version: { color: '#222', fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 48, letterSpacing: 2 },
  editBtn: { marginTop: 16, backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  editBtnText: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 24, letterSpacing: 2 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#0a0a0a', padding: 16, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: '#222' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontSize: 13, fontWeight: '800' },
  saveBtn: { flex: 2, backgroundColor: '#ff6b35', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
