import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../lib/i18n/i18n';
import {
  recordLaunchAndShouldPrompt,
  openPlayStoreReview,
  markReviewDismissed,
  markReviewNeverAsk,
} from '../lib/reviewPrompt';

export default function RateAppModal({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(false);
  const { locale } = useTranslation();

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    recordLaunchAndShouldPrompt().then((shouldShow) => {
      if (!cancelled && shouldShow) {
        timer = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 6000);
      }
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ready]);

  if (!visible) return null;

  const isTr = (locale || '').toLowerCase().startsWith('tr');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setVisible(false);
        markReviewDismissed();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={30} color="#F59E0B" />
          </View>
          <Text style={styles.title}>
            {isTr ? 'DietitianFit\'i Beğeniyor musunuz?' : 'Enjoying DietitianFit?'}
          </Text>
          <Text style={styles.body}>
            {isTr
              ? 'Uygulamamızı geliştirmemize destek olmak için Google Play\'de değerlendirmenizi paylaşabilirsiniz.'
              : 'Your review on Google Play helps us improve DietitianFit for everyone.'}
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              setVisible(false);
              openPlayStoreReview();
            }}
          >
            <Text style={styles.primaryBtnText}>
              {isTr ? "Google Play'de Değerlendir" : 'Rate on Google Play'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setVisible(false);
              markReviewDismissed();
            }}
          >
            <Text style={styles.secondaryBtnText}>
              {isTr ? 'Şimdi Değil' : 'Not Now'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.neverBtn}
            onPress={() => {
              setVisible(false);
              markReviewNeverAsk();
            }}
          >
            <Text style={styles.neverBtnText}>
              {isTr
                ? 'Zaten değerlendirdim / Bir daha gösterme'
                : 'Already reviewed / Do not show again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  neverBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  neverBtnText: {
    color: '#64748B',
    fontSize: 12,
  },
});
