import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../../lib/i18n/i18n';

export default function NutritionLog() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  
  const [mealType, setMealType] = useState('breakfast');
  const [content, setContent] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const loadLogs = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('daily_nutrition_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('log_date', todayStr)
      .order('created_at', { ascending: false });
    
    if (data) setTodayLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, [profile]);

  const handleSave = async () => {
    if (!content.trim() || !calories) {
      Alert.alert(t('common.error'), t('nutritionLog.fill'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('daily_nutrition_logs').insert({
      user_id: profile?.id,
      log_date: todayStr,
      meal_type: mealType,
      content,
      calories: parseInt(calories) || 0,
      protein_g: parseFloat(protein) || 0,
      carbs_g: parseFloat(carbs) || 0,
      fat_g: parseFloat(fat) || 0,
    });

    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), t('nutritionLog.save_failed'));
    } else {
      setContent('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      loadLogs();
    }
  };

  const totalCals = todayLogs.reduce((acc, log) => acc + log.calories, 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('nutritionLog.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('nutritionLog.today_cals')}</Text>
          <Text style={styles.summaryValue}>{totalCals} kcal</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('nutritionLog.new')}</Text>
          
          <View style={styles.tabsRow}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.tab, mealType === type && styles.tabActive]}
                onPress={() => setMealType(type)}
              >
                <Text style={[styles.tabText, mealType === type && styles.tabTextActive]}>
                  {t(`nutritionLog.${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.inputMulti}
            placeholder={t('nutritionLog.what')}
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
          />

          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.cal')} placeholderTextColor="#666" keyboardType="numeric" value={calories} onChangeText={setCalories} />
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.protein')} placeholderTextColor="#666" keyboardType="numeric" value={protein} onChangeText={setProtein} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.carbs')} placeholderTextColor="#666" keyboardType="numeric" value={carbs} onChangeText={setCarbs} />
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('nutritionLog.fat')} placeholderTextColor="#666" keyboardType="numeric" value={fat} onChangeText={setFat} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? t('nutritionLog.saving') : t('nutritionLog.save')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>{t('nutritionLog.today')}</Text>
        {todayLogs.map((log, index) => (
          <Animated.View key={log.id} entering={FadeInDown.delay(index * 100).springify()} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logMealType}>
                {t(`nutritionLog.${log.meal_type}`)}
              </Text>
              <Text style={styles.logCals}>{log.calories} kcal</Text>
            </View>
            <Text style={styles.logContent}>{log.content}</Text>
            <View style={styles.macrosRow}>
              <Text style={styles.macroText}>{t('nutritionLog.p')}: {log.protein_g}g</Text>
              <Text style={styles.macroText}>{t('nutritionLog.c')}: {log.carbs_g}g</Text>
              <Text style={styles.macroText}>{t('nutritionLog.f')}: {log.fat_g}g</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 100 },
  summaryCard: { backgroundColor: '#10b98120', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#10b98150' },
  summaryTitle: { color: '#10b981', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 8 },
  formCard: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  tabActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  tabText: { color: '#666', fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: '#10b981' },
  inputMulti: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 16, color: '#fff', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 16, color: '#fff' },
  flex1: { flex: 1 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  logCard: { backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logMealType: { color: '#f59e0b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  logCals: { color: '#10b981', fontSize: 14, fontWeight: '900' },
  logContent: { color: '#fff', fontSize: 14, marginBottom: 12 },
  macrosRow: { flexDirection: 'row', gap: 16 },
  macroText: { color: '#666', fontSize: 11, fontWeight: '700' }
});
