import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationTracking } from '../lib/useLocationTracking';
import MapTracker from '../components/MapTracker';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function TrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isTracking,
    locations,
    distance,
    duration,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    formatPace
  } = useLocationTracking();

  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasStarted(true);
    startTracking();
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pauseTracking();
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resumeTracking();
  };

  const handleStop = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stopTracking();
    setIsFinished(true);
  };

  const handleSave = () => {
    // In a real app, save to Supabase here
    alert(`Aktivite Kaydedildi! Toplam Mesafe: ${(distance / 1000).toFixed(2)} km`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Map Background */}
      <MapTracker locations={locations} isTracking={isTracking} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Koşu / Yürüyüş</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Bottom Panel */}
      <View style={[styles.panelContainer, { paddingBottom: 30 + insets.bottom }]}>
        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{(distance / 1000).toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Kilometre</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatPace(distance, duration)}</Text>
            <Text style={styles.metricLabel}>Pace (/km)</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatDuration(duration)}</Text>
            <Text style={styles.metricLabel}>Süre</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {!hasStarted ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>BAŞLA</Text>
            </TouchableOpacity>
          ) : isFinished ? (
            <View style={styles.finishControls}>
              <TouchableOpacity style={styles.discardButton} onPress={() => router.back()}>
                <Text style={styles.discardButtonText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activeControls}>
              {isTracking ? (
                <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                  <Ionicons name="pause" size={32} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.pausedStateRow}>
                  <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                    <Text style={styles.resumeButtonText}>Devam</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                    <Text style={styles.stopButtonText}>Bitir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    fontVariant: ['tabular-nums']
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  controlsRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#ff3366',
    width: width * 0.8,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  pauseButton: {
    backgroundColor: '#ff9900',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff9900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pausedStateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  resumeButton: {
    backgroundColor: '#ff3366',
    width: width * 0.4,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#333',
    width: width * 0.4,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  finishControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#00cc66',
    width: width * 0.6,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  discardButton: {
    backgroundColor: 'transparent',
    width: width * 0.3,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardButtonText: {
    color: '#ff3333',
    fontSize: 16,
    fontWeight: '600',
  }
});
