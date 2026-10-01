import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '../lib/i18n/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SessionNotes from '../components/SessionNotes';
import { useTranslation } from '../lib/i18n/i18n';

export default function Appointments() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [notesVisible, setNotesVisible] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const loadAppointments = async () => {
    if (!profile) return;
    const isDietitian = profile.role === 'dietitian';
    const idField = isDietitian ? 'dietitian_id' : 'client_id';

    const { data, error } = await supabase
      .from('appointments')
      .select('*, client:profiles!appointments_client_id_fkey(display_name, username), dietitian:profiles!appointments_dietitian_id_fkey(display_name, username)')
      .eq(idField, profile.id)
      .order('appointment_time', { ascending: true });

    if (!error && data) {
      setAppointments(data);
    } else if (error) {
      console.log("Appointments Error:", error);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#666';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('appointments.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.quickHubRow}>
        <TouchableOpacity
          style={styles.quickHubCard}
          onPress={() => router.push('/dietitian/clients' as any)}
        >
          <Text style={styles.quickHubIcon}>🩺</Text>
          <View>
            <Text style={styles.quickHubTitle}>{t('appointments.client_control')}</Text>
            <Text style={styles.quickHubSub}>{t('appointments.client_control_sub')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickHubCard}
          onPress={() => router.push('/dietitian/packages' as any)}
        >
          <Text style={styles.quickHubIcon}>💎</Text>
          <View>
            <Text style={styles.quickHubTitle}>{t('appointments.packages')}</Text>
            <Text style={styles.quickHubSub}>{t('appointments.packages_sub')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {appointments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>{t('appointments.empty')}</Text>
            <TouchableOpacity 
              style={styles.connectBtn}
              onPress={() => router.push('/messages' as any)}
            >
              <Text style={styles.connectBtnText}>{t('appointments.contact')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((apt, index) => {
            const isDietitian = profile?.role === 'dietitian';
            const otherPerson = isDietitian ? apt.client : apt.dietitian;
            
            return (
              <Animated.View 
                key={apt.id} 
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>
                    {format(parseISO(apt.appointment_time), t('appointments.date_fmt'), { locale: getDateLocale(locale) })}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(apt.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(apt.status) }]}>
                      {t(`appointments.status_${apt.status}`) === `appointments.status_${apt.status}` ? apt.status.toUpperCase() : t(`appointments.status_${apt.status}`)}
                    </Text>
                  </View>
                </View>

                <View style={styles.personInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(otherPerson?.display_name || otherPerson?.username || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.personRole}>{isDietitian ? t('appointments.client') : t('appointments.dietitian')}</Text>
                    <Text style={styles.personName}>{otherPerson?.display_name || otherPerson?.username}</Text>
                  </View>
                </View>

                {isDietitian && (
                  <TouchableOpacity 
                    style={styles.noteBtn}
                    onPress={() => {
                      setSelectedApt({
                        appointmentId: apt.id,
                        clientId: apt.client_id,
                        clientName: otherPerson?.display_name || otherPerson?.username || t('appointments.client')
                      });
                      setNotesVisible(true);
                    }}
                  >
                    <Text style={styles.noteBtnText}>{t('appointments.notes_btn')}</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {selectedApt && (
        <SessionNotes
          visible={notesVisible}
          onClose={() => setNotesVisible(false)}
          appointmentId={selectedApt.appointmentId}
          clientId={selectedApt.clientId}
          clientName={selectedApt.clientName}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  quickHubRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  quickHubCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#161e2e',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  quickHubIcon: { fontSize: 24 },
  quickHubTitle: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  quickHubSub: { color: '#10b981', fontSize: 10, fontWeight: '700', marginTop: 2 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: '700' },
  connectBtn: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  connectBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  personInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  personRole: { color: '#666', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  personName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  noteBtn: { marginTop: 16, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  noteBtnText: { color: '#10b981', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});
