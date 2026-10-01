import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnline } from '../lib/useOnline';
import { useTranslation } from '../lib/i18n/i18n';

export default function OfflineBanner() {
  const online = useOnline();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (online) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { paddingBottom: insets.bottom + 72 }]}>
      <View style={styles.banner}>
        <Text style={styles.text}>📡 {t('net.offline_banner')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16 },
  banner: { backgroundColor: '#7f1d1d', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
