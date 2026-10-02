import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type ShareCardStat = { value: string; label: string };

export type ShareCardProps = {
  width: number; // card is 9:16 (Instagram/TikTok story ratio)
  variant: 'daily' | 'streak' | 'together';
  headline: string;
  subline?: string;
  bigValue?: string;
  bigLabel?: string;
  stats: ShareCardStat[];
  names?: { client: string; dietitian: string }; // "together" variant
  footer: string;
};

// A plain View tree: react-native-view-shot snapshots it to a PNG, so no remote assets are used (always renders).
const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(props, ref) {
  const { width, variant, headline, subline, bigValue, bigLabel, stats, names, footer } = props;
  const s = width / 360; // all sizes scale with the card
  const height = (width * 16) / 9;

  const colors =
    variant === 'together' ? ['#1e1b4b', '#0f172a', '#064e3b'] : variant === 'streak' ? ['#7c2d12', '#0f172a', '#0a0a0a'] : ['#064e3b', '#0f172a', '#0a0a0a'];

  return (
    <View ref={ref} collapsable={false} style={{ width, height }}>
      <LinearGradient colors={colors as any} style={[styles.fill, { padding: 28 * s }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { width: 34 * s, height: 34 * s, borderRadius: 10 * s }]}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 * s }}>S</Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 * s, letterSpacing: 1.5 }}>
            STREAK<Text style={{ color: '#10b981' }}>FIT</Text>
          </Text>
        </View>

        <View style={styles.center}>
          {variant === 'together' && names ? (
            <>
              <Text style={[styles.together, { fontSize: 15 * s }]}>🤝</Text>
              <Text style={{ color: '#fff', fontSize: 26 * s, fontWeight: '900', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
                {names.client}
              </Text>
              <Text style={{ color: '#a78bfa', fontSize: 18 * s, fontWeight: '900', marginVertical: 2 * s }}>×</Text>
              <Text style={{ color: '#fff', fontSize: 26 * s, fontWeight: '900', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
                {names.dietitian}
              </Text>
              <Text style={{ color: '#a78bfa', fontSize: 11 * s, fontWeight: '800', letterSpacing: 1.5, marginTop: 6 * s }}>
                DİYETİSYEN · DIETITIAN
              </Text>
            </>
          ) : null}

          <Text style={{ color: '#d4d4d8', fontSize: 14 * s, fontWeight: '800', letterSpacing: 2, marginTop: 22 * s, textTransform: 'uppercase', textAlign: 'center' }}>
            {headline}
          </Text>
          {!!bigValue && (
            <Text style={{ color: '#fff', fontSize: 84 * s, fontWeight: '900', lineHeight: 92 * s, marginTop: 4 * s }}>{bigValue}</Text>
          )}
          {!!bigLabel && (
            <Text style={{ color: '#10b981', fontSize: 16 * s, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>{bigLabel}</Text>
          )}
          {!!subline && (
            <Text style={{ color: '#a1a1aa', fontSize: 13 * s, fontWeight: '600', marginTop: 10 * s, textAlign: 'center' }}>{subline}</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          {stats.map((st) => (
            <View key={st.label} style={[styles.statTile, { borderRadius: 16 * s, paddingVertical: 12 * s }]}>
              <Text style={{ color: '#fff', fontSize: 22 * s, fontWeight: '900' }} numberOfLines={1} adjustsFontSizeToFit>
                {st.value}
              </Text>
              <Text style={{ color: '#a1a1aa', fontSize: 9 * s, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 * s, textAlign: 'center' }}>
                {st.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        <Text style={{ color: '#71717a', fontSize: 11 * s, fontWeight: '700', textAlign: 'center', marginTop: 18 * s }}>{footer}</Text>
      </LinearGradient>
    </View>
  );
});

export default ShareCard;

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  together: { marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', paddingHorizontal: 6 },
});
