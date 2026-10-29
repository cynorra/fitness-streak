import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Modal, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useState } from 'react';
import { useTranslation, supportedLanguages } from '../../lib/i18n/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InviteCard from '../../components/InviteCard';
import { friendlyError } from '../../lib/useOnline';
import AppIcon from '../../components/AppIcon';
import PressableScale from '../../components/PressableScale';
import AmbientBackground from '../../components/AmbientBackground';

export default function Profile() {
  const { profile, session, refreshProfile } = useAuth();
  const router = useRouter();
  const { t, locale, changeLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const [editModal, setEditModal] = useState(false);
  const [newName, setNewName] = useState(profile?.display_name || '');
  const [instagram, setInstagram] = useState((profile as any)?.instagram_handle || '');
  const [tiktok, setTiktok] = useState((profile as any)?.tiktok_handle || '');
  const [updating, setUpdating] = useState(false);
  const [specialty, setSpecialty] = useState((profile as any)?.specialty || '');
  const [bio, setBio] = useState((profile as any)?.bio || '');

  const signOut = () => {
    Alert.alert(t('profile.logout_dialog_title'), t('profile.logout_dialog_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(t('profile.delete_account'), t('profile.delete_account_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.delete_account'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('delete_my_account');
          if (error) {
            Alert.alert(t('common.error'), friendlyError(error.message, t));
            return;
          }
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const updateProfile = async () => {
    if (!profile) return;
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update(
        profile.role === 'dietitian'
          ? { display_name: newName, specialty: specialty.trim() || null, bio: bio.trim() || null }
          : { display_name: newName }
      )
      .eq('id', profile.id);
    
    if (error) {
      Alert.alert(t('common.error'), t('profile.profile_error'));
    } else {
      await refreshProfile();
      setEditModal(false);
    }
    setUpdating(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050607' }}>
    <AmbientBackground />
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.display_name || profile?.username}</Text>
        <Text style={styles.handle}>@{profile?.username}</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>
        
        {/* Social Badges */}
        <View style={styles.socialRow}>
          {!!instagram && (
            <TouchableOpacity style={styles.socialChip} onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}>
              <Ionicons name="logo-instagram" size={16} color="#e1306c" />
              <Text style={styles.socialText}>@{instagram}</Text>
            </TouchableOpacity>
          )}
          {!!tiktok && (
            <TouchableOpacity style={styles.socialChip} onPress={() => Linking.openURL(`https://tiktok.com/@${tiktok}`)}>
              <Ionicons name="logo-tiktok" size={16} color="#fff" />
              <Text style={styles.socialText}>@{tiktok}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => {
          setNewName(profile?.display_name || '');
          setEditModal(true);
        }}>
          <Text style={styles.editBtnText}>{t('profile.edit_profile')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.edit_profile')}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.display_name')}</Text>
              <TextInput 
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder={t('profile.your_name')}
                placeholderTextColor="#444"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile2.instagram')}</Text>
              <TextInput 
                style={styles.input}
                value={instagram}
                onChangeText={setInstagram}
                placeholder={t('profile2.handle_placeholder')}
                placeholderTextColor="#444"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile2.tiktok')}</Text>
              <TextInput 
                style={styles.input}
                value={tiktok}
                onChangeText={setTiktok}
                placeholder={t('profile2.handle_placeholder')}
                placeholderTextColor="#444"
              />
            </View>
            {profile?.role === 'dietitian' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('dietitianCare.specialty_label')}</Text>
                  <TextInput
                    style={styles.input}
                    value={specialty}
                    onChangeText={setSpecialty}
                    placeholder={t('dietitianCare.specialty_ph')}
                    placeholderTextColor="#444"
                    maxLength={80}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('dietitianCare.bio_label')}</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder={t('dietitianCare.bio_ph')}
                    placeholderTextColor="#444"
                    multiline
                    maxLength={300}
                  />
                </View>
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={updateProfile} disabled={updating}>
                <Text style={styles.saveBtnText}>{updating ? t('common.saving') : t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.current_streak ?? 0}</Text>
          <Text style={styles.statLabel}>{t('profile.current_streak')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.longest_streak ?? 0}</Text>
          <Text style={styles.statLabel}>{t('profile.longest_streak_title')}</Text>
        </View>
      </View>

      {/* Notifications Settings Link */}
      <PressableScale index={0} 
        style={styles.menuBtn} 
        onPress={() => router.push('/notification-settings' as any)}
      >
        <AppIcon name="notifications" color="#f59e0b" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.notif')}</Text>
      </PressableScale>

      {/* Analytics Link */}
      <PressableScale index={1} 
        style={styles.menuBtn} 
        onPress={() => router.push('/analytics' as any)}
      >
        <AppIcon name="stats-chart" color="#3b82f6" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.analytics')}</Text>
      </PressableScale>

      {/* Water Tracking Link */}
      <PressableScale index={2} 
        style={styles.menuBtn} 
        onPress={() => router.push('/water' as any)}
      >
        <AppIcon name="water" color="#38bdf8" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.water')}</Text>
      </PressableScale>

      {/* Fasting Link */}
      <PressableScale index={3} 
        style={styles.menuBtn} 
        onPress={() => router.push('/fasting' as any)}
      >
        <AppIcon name="timer" color="#f97316" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.fasting')}</Text>
      </PressableScale>

      {/* Appointments Link */}
      <PressableScale index={4} 
        style={styles.menuBtn} 
        onPress={() => router.push('/appointments' as any)}
      >
        <AppIcon name="calendar" color="#3b82f6" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.appts')}</Text>
      </PressableScale>

      {/* Nutrition Log Link */}
      <PressableScale index={5} 
        style={styles.menuBtn} 
        onPress={() => router.push('/nutrition/log' as any)}
      >
        <AppIcon name="nutrition" color="#22c55e" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.nutrition')}</Text>
      </PressableScale>

      {/* Measurements Link */}
      <PressableScale index={6} 
        style={styles.menuBtn} 
        onPress={() => router.push('/measurements' as any)}
      >
        <AppIcon name="resize" color="#06b6d4" size={40} style={{ marginRight: 14 }} />
        <Text style={styles.menuBtnText}>{t('profile2.measure')}</Text>
      </PressableScale>

      {/* Dietitian links */}
      {profile?.role === 'dietitian' && (
        <>
          <PressableScale index={7}
            style={styles.menuBtn}
            onPress={() => router.push('/dietitian/clients' as any)}
          >
            <AppIcon name="medkit" color="#10b981" size={40} style={{ marginRight: 14 }} />
            <Text style={styles.menuBtnText}>{t('dietitianCare.my_clients')}</Text>
          </PressableScale>
          <PressableScale index={8}
            style={styles.menuBtn}
            onPress={() => router.push('/dietitian/create-plan' as any)}
          >
            <AppIcon name="clipboard" color="#94a3b8" size={40} style={{ marginRight: 14 }} />
            <Text style={styles.menuBtnText}>{t('profile2.create_plan')}</Text>
          </PressableScale>
        </>
      )}

      {/* Member links: find a dietitian + see the plans written for me */}
      {profile?.role !== 'dietitian' && (
        <>
          <PressableScale index={9}
            style={styles.menuBtn}
            onPress={() => router.push('/find-dietitian' as any)}
          >
            <AppIcon name="search" color="#3b82f6" size={40} style={{ marginRight: 14 }} />
            <Text style={styles.menuBtnText}>{t('dietitianCare.find_link')}</Text>
          </PressableScale>
          <PressableScale index={10}
            style={styles.menuBtn}
            onPress={() => router.push('/my-plans' as any)}
          >
            <AppIcon name="clipboard" color="#94a3b8" size={40} style={{ marginRight: 14 }} />
            <Text style={styles.menuBtnText}>{t('dietitianCare.my_plans')}</Text>
          </PressableScale>
        </>
      )}

      <InviteCard isDietitian={profile?.role === 'dietitian'} />

      {/* Language Selector Section */}
      <View style={styles.languageContainer}>
        <Text style={styles.languageHeader}>{t('profile.select_language')}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.langScroll}
          contentContainerStyle={styles.langScrollContent}
        >
          {supportedLanguages.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langCard, isActive && styles.langCardActive]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[styles.langText, isActive && styles.langTextActive]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => Linking.openURL('https://vitatribe.com/privacy')}>
          <Text style={styles.legalText}>{t('profile.privacy_policy')}</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>•</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://vitatribe.com/terms')}>
          <Text style={styles.legalText}>{t('profile.terms_of_use')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={deleteAccount}
      >
        <Text style={styles.deleteText}>{t('profile.delete_account')}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DIETITIANFIT v1.0.9</Text>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 24 },
  profileCard: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#10b981',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  handle: { color: '#888', fontSize: 14, marginTop: 4 },
  email: { color: '#666', fontSize: 12, marginTop: 4 },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  socialIcon: { fontSize: 14 },
  socialText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', padding: 20,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  statValue: { color: '#10b981', fontSize: 40, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },
  
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    marginBottom: 24,
    gap: 16,
  },
  menuBtnIcon: { fontSize: 24 },
  menuBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Language Selector Styles
  languageContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  languageHeader: {
    color: '#888',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  langScroll: {
    flexDirection: 'row',
  },
  langScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  langCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  langCardActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  langText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '800',
  },
  langTextActive: {
    color: '#fff',
    fontWeight: '900',
  },

  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  signOutText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 48 },
  legalText: { color: '#444', fontSize: 12, fontWeight: '600' },
  legalDot: { color: '#222' },
  deleteBtn: { marginTop: 24, alignSelf: 'center' },
  deleteText: { color: '#b91c1c', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  version: { color: '#222', fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 48, letterSpacing: 2 },
  editBtn: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.045)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  editBtnText: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#12161d', padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 24, letterSpacing: 2 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#0a0a0a', padding: 16, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontSize: 13, fontWeight: '800' },
  saveBtn: { flex: 2, backgroundColor: '#10b981', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});

