import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../lib/i18n/i18n';
import { friendlyError } from '../../lib/useOnline';
import { deviceTimezone } from '../../lib/units';
import { makeSlug } from '../../lib/dietitianSlug';
import AmbientBackground from '../../components/AmbientBackground';
import { pickImage, pickDocument, uploadPrivate, Picked } from '../../lib/attachments';

type Status = 'draft' | 'pending' | 'approved' | 'rejected';
const list = (s: string) => s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);

export default function DietitianVerification() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>('draft');
  const [reason, setReason] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [languages, setLanguages] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState(deviceTimezone());
  const [years, setYears] = useState('');
  const [license, setLicense] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [diplomaPath, setDiplomaPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('dietitian_profiles')
      .select('*')
      .eq('id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStatus(data.verification_status);
          setReason(data.rejection_reason);
          setTitle(data.title || '');
          setSpecialties((data.specialties || []).join(', '));
          setLanguages((data.languages || []).join(', '));
          setCountry(data.country || '');
          setTimezone(data.timezone || deviceTimezone());
          setYears(data.years_experience != null ? String(data.years_experience) : '');
          setLicense(data.license_no || '');
          setPrice(data.session_price != null ? String(data.session_price) : '');
          setCurrency(data.price_currency || '');
          setDiplomaPath(data.diploma_path || null);
        }
        setLoading(false);
      });
  }, [profile]);

  const uploadDiploma = async (kind: 'photo' | 'pdf') => {
    if (!profile) return;
    try {
      const f: Picked | null = kind === 'photo' ? await pickImage() : await pickDocument();
      if (!f) return;
      setUploading(true);
      setDiplomaPath(await uploadPrivate('diplomas', profile.id, f));
    } catch (e: any) {
      Alert.alert(t('common.error'), friendlyError(e?.message || '', t));
    } finally {
      setUploading(false);
    }
  };

  const locked = status === 'pending' || status === 'approved';

  const submit = async () => {
    if (!profile) return;
    if (!title.trim() || country.trim().length !== 2 || !timezone.trim() || !license.trim()) {
      Alert.alert(t('common.error'), t('platform.vf_missing'));
      return;
    }
    setSaving(true);
    const yearsNum = parseInt(years, 10);
    const priceNum = parseFloat(price.replace(',', '.'));
    const row = {
      id: profile.id,
      title: title.trim(),
      specialties: list(specialties),
      languages: list(languages),
      country: country.trim().toUpperCase(),
      timezone: timezone.trim(),
      years_experience: isFinite(yearsNum) ? yearsNum : null,
      license_no: license.trim(),
      diploma_path: diplomaPath,
      session_price: isFinite(priceNum) ? priceNum : null,
      price_currency: currency.trim() ? currency.trim().toUpperCase().slice(0, 3) : null,
      slug: makeSlug(profile.display_name || profile.username, profile.id),
      verification_status: 'pending' as Status,
    };
    // Server trigger forces the status: draft/rejected -> pending only; an owner can never self-approve.
    const { error } = await supabase.from('dietitian_profiles').upsert(row, { onConflict: 'id' });
    setSaving(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    setStatus('pending');
    Alert.alert(t('common.success'), t('platform.vf_sent'));
  };

  const field = (value: string, set: (v: string) => void, ph: string, extra: object = {}) => (
    <TextInput
      style={[styles.input, locked && { opacity: 0.6 }]}
      value={value}
      onChangeText={set}
      placeholder={ph}
      placeholderTextColor="#666"
      editable={!locked}
      {...extra}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('platform.vf_title')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.badge, status === 'approved' && styles.badgeOk, status === 'rejected' && styles.badgeNo]}>
            <Text style={styles.badgeText}>{t(`platform.vf_st_${status}`)}</Text>
          </View>
          {status === 'rejected' && !!reason && <Text style={styles.reason}>{reason}</Text>}
          <Text style={styles.intro}>{t('platform.vf_intro')}</Text>

          {field(title, setTitle, t('platform.vf_title_ph'))}
          {field(specialties, setSpecialties, t('platform.vf_specialties_ph'))}
          {field(languages, setLanguages, t('platform.vf_languages_ph'), { autoCapitalize: 'none' })}
          {field(country, setCountry, t('platform.vf_country_ph'), { maxLength: 2, autoCapitalize: 'characters' })}
          {field(timezone, setTimezone, t('platform.vf_tz_ph'), { autoCapitalize: 'none' })}
          {field(years, setYears, t('platform.vf_years_ph'), { keyboardType: 'number-pad', maxLength: 2 })}
          {field(license, setLicense, t('platform.vf_license_ph'))}
          {field(price, setPrice, t('platform.vf_price_ph'), { keyboardType: 'decimal-pad' })}
          {field(currency, setCurrency, t('platform.vf_currency_ph'), { maxLength: 3, autoCapitalize: 'characters' })}

          <Text style={styles.intro}>{diplomaPath ? t('platform.vf_diploma_ok') : t('platform.vf_diploma_hint')}</Text>
          {!locked && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <TouchableOpacity style={styles.upBtn} disabled={uploading} onPress={() => uploadDiploma('photo')}>
                <Text style={styles.upText}>{uploading ? '...' : t('platform.vf_diploma_photo')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.upBtn} disabled={uploading} onPress={() => uploadDiploma('pdf')}>
                <Text style={styles.upText}>{t('platform.vf_diploma_pdf')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!locked && (
            <TouchableOpacity style={[styles.submit, saving && { opacity: 0.5 }]} disabled={saving} onPress={submit}>
              <Text style={styles.submitText}>{t('platform.vf_submit')}</Text>
            </TouchableOpacity>
          )}
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
  intro: { color: '#a1a1aa', fontSize: 13, marginVertical: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 10 },
  upBtn: { flex: 1, borderWidth: 1, borderColor: '#10b981', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  upText: { color: '#10b981', fontWeight: '800', fontSize: 13 },
  note: { color: '#f59e0b', fontSize: 12, marginTop: 4, marginBottom: 8 },
  badge: { backgroundColor: '#f59e0b22', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  badgeOk: { backgroundColor: '#10b98122' },
  badgeNo: { backgroundColor: '#ef444422' },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  reason: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  submit: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
