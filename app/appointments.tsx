import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format, parseISO, addDays, setHours, setMinutes, startOfDay, isAfter } from 'date-fns';
import { getDateLocale } from '../lib/i18n/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SessionNotes from '../components/SessionNotes';
import { useTranslation } from '../lib/i18n/i18n';
import AppIcon from '../components/AppIcon';
import AmbientBackground from '../components/AmbientBackground';
import PressableScale from '../components/PressableScale';
import { friendlyError } from '../lib/useOnline';

type Person = { id: string; display_name: string | null; username: string };

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export default function Appointments() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const isDietitian = profile?.role === 'dietitian';
  const { book } = useLocalSearchParams<{ book?: string }>();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [notesVisible, setNotesVisible] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);

  // Booking sheet
  const [bookVisible, setBookVisible] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(1);
  const [slot, setSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!profile) return;
    const idField = isDietitian ? 'dietitian_id' : 'client_id';
    const { data, error } = await supabase
      .from('appointments')
      .select('*, client:profiles!appointments_client_id_fkey(display_name, username), dietitian:profiles!appointments_dietitian_id_fkey(display_name, username)')
      .eq(idField, profile.id)
      .order('appointment_time', { ascending: true });
    if (!error && data) setAppointments(data);
    setLoading(false);
  }, [profile?.id, isDietitian]);

  // Approved dietitian<->client pairs are the only people one can book with.
  const loadPeople = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('dietitian_clients')
      .select(
        isDietitian
          ? 'person:client_id (id, display_name, username)'
          : 'person:dietitian_id (id, display_name, username)'
      )
      .eq(isDietitian ? 'dietitian_id' : 'client_id', profile.id)
      .eq('status', 'approved');
    const list = ((data || []) as any[]).map((r) => r.person).filter(Boolean) as Person[];
    setPeople(list);
    if (list.length === 1) setPersonId(list[0].id);
  }, [profile?.id, isDietitian]);

  useEffect(() => {
    loadAppointments();
    loadPeople();
  }, [loadAppointments, loadPeople]);

  // Deep link from a dietitian's profile: open the booking sheet with that person preselected.
  useEffect(() => {
    if (!book || !people.some((p) => p.id === book)) return;
    setPersonId(book);
    setSlot(null);
    setDayOffset(1);
    setBookVisible(true);
  }, [book, people]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAppointments(), loadPeople()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6366f1';
      default: return '#666';
    }
  };

  const setStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    loadAppointments();
  };

  const confirmCancel = (id: string) => {
    Alert.alert(t('appointments.cancel_title'), t('appointments.cancel_msg'), [
      { text: t('feed2.cancel'), style: 'cancel' },
      { text: t('appointments.cancel_yes'), style: 'destructive', onPress: () => setStatus(id, 'cancelled') },
    ]);
  };

  const openBooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (people.length === 0) {
      Alert.alert(
        t('appointments.no_people_title'),
        isDietitian ? t('appointments.no_people_dietitian') : t('appointments.no_people_member'),
        isDietitian
          ? [{ text: t('appointments.ok') }]
          : [{ text: t('appointments.ok') }, { text: t('dietitianCare.find_link'), onPress: () => router.push('/find-dietitian' as any) }]
      );
      return;
    }
    setSlot(null);
    setDayOffset(1);
    setBookVisible(true);
  };

  const submitBooking = async () => {
    if (!profile || !personId || !slot || saving) return;
    const [h, m] = slot.split(':').map(Number);
    const when = setMinutes(setHours(startOfDay(addDays(new Date(), dayOffset)), h), m);
    if (!isAfter(when, new Date())) {
      Alert.alert(t('common.error'), t('appointments.past_time'));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('appointments').insert({
      dietitian_id: isDietitian ? profile.id : personId,
      client_id: isDietitian ? personId : profile.id,
      appointment_time: when.toISOString(),
      // A dietitian books directly; a member's request waits for the dietitian to confirm.
      status: isDietitian ? 'confirmed' : 'pending',
    });
    setSaving(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBookVisible(false);
    loadAppointments();
  };

  const now = new Date();
  const isActive = (a: any) => a.status === 'pending' || a.status === 'confirmed';
  const upcoming = appointments.filter((a) => isActive(a) && isAfter(parseISO(a.appointment_time), new Date(now.getTime() - 60 * 60 * 1000)));
  const past = appointments
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => b.appointment_time.localeCompare(a.appointment_time));

  const renderCard = (apt: any, index: number) => {
    const otherPerson = isDietitian ? apt.client : apt.dietitian;
    const color = getStatusColor(apt.status);
    const label = t(`appointments.status_${apt.status}`);
    return (
      <Animated.View key={apt.id} entering={FadeInDown.delay(index * 70).springify()} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={18} color={color} />
            <Text style={styles.dateText}>
              {format(parseISO(apt.appointment_time), t('appointments.date_fmt'), { locale: dateLocale })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.statusText, { color }]}>{label}</Text>
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

        <View style={styles.actionsRow}>
          {apt.status === 'pending' && isDietitian && (
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#10b981', backgroundColor: '#10b98118' }]} onPress={() => setStatus(apt.id, 'confirmed')}>
              <Ionicons name="checkmark" size={16} color="#10b981" />
              <Text style={[styles.actionText, { color: '#10b981' }]}>{t('appointments.confirm')}</Text>
            </TouchableOpacity>
          )}
          {isActive(apt) && (
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#ef4444', backgroundColor: '#ef444418' }]} onPress={() => confirmCancel(apt.id)}>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>
                {apt.status === 'pending' && isDietitian ? t('appointments.decline') : t('appointments.cancel')}
              </Text>
            </TouchableOpacity>
          )}
          {apt.status === 'confirmed' && isDietitian && (
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#6366f1', backgroundColor: '#6366f118' }]} onPress={() => setStatus(apt.id, 'completed')}>
              <Ionicons name="checkmark-done" size={16} color="#818cf8" />
              <Text style={[styles.actionText, { color: '#818cf8' }]}>{t('appointments.complete')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isDietitian && (
          <TouchableOpacity
            style={styles.noteBtn}
            onPress={() => {
              setSelectedApt({
                appointmentId: apt.id,
                clientId: apt.client_id,
                clientName: otherPerson?.display_name || otherPerson?.username || t('appointments.client'),
              });
              setNotesVisible(true);
            }}
          >
            <Ionicons name="document-text-outline" size={14} color="#10b981" />
            <Text style={styles.noteBtnText}>{t('appointments.notes_btn')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('appointments.title')}</Text>
        <TouchableOpacity onPress={openBooking} style={[styles.iconBtn, styles.addBtn]}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {isDietitian && (
          <PressableScale index={0} style={styles.quickHubCard} onPress={() => router.push('/dietitian/clients' as any)}>
            <AppIcon name="medkit" color="#10b981" size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.quickHubTitle}>{t('appointments.client_control')}</Text>
              <Text style={styles.quickHubSub}>{t('appointments.client_control_sub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#10b981" />
          </PressableScale>
        )}

        {loading ? (
          <ActivityIndicator color="#10b981" style={{ marginTop: 60 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.empty}>
            <AppIcon name="calendar" color="#3b82f6" size={80} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>{t('appointments.empty')}</Text>
            <TouchableOpacity style={styles.connectBtn} onPress={openBooking}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.connectBtnText}>{t('appointments.book')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && <Text style={styles.sectionLabel}>{t('appointments.upcoming')}</Text>}
            {upcoming.map(renderCard)}
            {past.length > 0 && <Text style={styles.sectionLabel}>{t('appointments.past')}</Text>}
            {past.map((a, i) => renderCard(a, i + upcoming.length))}
          </>
        )}
      </ScrollView>

      <Modal visible={bookVisible} animationType="slide" transparent onRequestClose={() => setBookVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('appointments.book')}</Text>
              <TouchableOpacity onPress={() => setBookVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetLabel}>{isDietitian ? t('appointments.client') : t('appointments.dietitian')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {people.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.chip, personId === p.id && styles.chipActive]} onPress={() => setPersonId(p.id)}>
                  <Text style={[styles.chipText, personId === p.id && styles.chipTextActive]}>{p.display_name || p.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sheetLabel}>{t('appointments.day')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {days.map((d, i) => (
                <TouchableOpacity key={i} style={[styles.dayChip, dayOffset === i + 1 && styles.chipActive]} onPress={() => setDayOffset(i + 1)}>
                  <Text style={[styles.dayChipTop, dayOffset === i + 1 && styles.chipTextActive]}>{format(d, 'EEE', { locale: dateLocale })}</Text>
                  <Text style={[styles.dayChipNum, dayOffset === i + 1 && styles.chipTextActive]}>{format(d, 'd')}</Text>
                  <Text style={[styles.dayChipTop, dayOffset === i + 1 && styles.chipTextActive]}>{format(d, 'MMM', { locale: dateLocale })}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sheetLabel}>{t('appointments.time')}</Text>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map((s) => (
                <TouchableOpacity key={s} style={[styles.slot, slot === s && styles.chipActive]} onPress={() => setSlot(s)}>
                  <Text style={[styles.chipText, slot === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!personId || !slot || saving) && { opacity: 0.45 }]}
              disabled={!personId || !slot || saving}
              onPress={submitBooking}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitText}>{isDietitian ? t('appointments.create') : t('appointments.request')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  addBtn: { backgroundColor: '#10b981', borderColor: '#34d399' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20 },
  quickHubCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    backgroundColor: 'rgba(16,185,129,0.08)', padding: 14, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  quickHubTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  quickHubSub: { color: '#10b981', fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionLabel: { color: '#6b7280', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 70 },
  emptyText: { color: '#8b93a1', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  connectBtn: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#10b981', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },
  connectBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  card: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  personInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.15)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#10b981', fontSize: 16, fontWeight: '900' },
  personRole: { color: '#6b7280', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  personName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '800' },
  noteBtn: { marginTop: 12, flexDirection: 'row', gap: 6, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  noteBtnText: { color: '#10b981', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#0f131a', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  sheetLabel: { color: '#6b7280', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginTop: 16, marginBottom: 10 },
  chipRow: { gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10b981' },
  chipText: { color: '#aab2c0', fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: '#34d399' },
  dayChip: { width: 58, paddingVertical: 10, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dayChipTop: { color: '#6b7280', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dayChipNum: { color: '#fff', fontSize: 20, fontWeight: '900', marginVertical: 2 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { paddingVertical: 10, width: '22.5%', alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtn: { marginTop: 24, backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
