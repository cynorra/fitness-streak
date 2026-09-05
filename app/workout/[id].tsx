import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as Haptics from 'expo-haptics';

export default function WorkoutPlayerScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const VIDEO_HEIGHT = width * (9 / 16);

  const [playing, setPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, save the completed streak to DB here
    alert('Harika iş çıkardın! 🎉\nBugünkü serin tamamlandı.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Video Player */}
      <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
        {!isReady && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff3366" />
          </View>
        )}
        {id && (
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            play={playing}
            videoId={id}
            onChangeState={onStateChange}
            onReady={() => setIsReady(true)}
            initialPlayerParams={{
              modestbranding: true,
              rel: false,
              preventFullScreen: false,
            }}
          />
        )}
      </View>

      {/* Details & Action */}
      <View style={styles.detailsContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            Eğitmen eşliğinde bu ücretsiz antrenmanı tamamlayarak günlük serini koruyabilirsin. Gerekli durumlarda videoyu duraklatabilir veya başa sarabilirsin.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.finishButton} 
          onPress={handleFinish}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.finishButtonText}>ANTRENMANI BİTİRDİM</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    zIndex: 1,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  infoBox: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 22,
  },
  finishButton: {
    backgroundColor: '#10b981', // Premium Green for completion
    flexDirection: 'row',
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 40,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  }
});
