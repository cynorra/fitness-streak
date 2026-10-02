import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n/i18n';
import AdMobBanner from '../../components/AdMobBanner';
import PressableScale from '../../components/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AmbientBackground from '../../components/AmbientBackground';

// Dummy Video Data - Mümkün olan en popüler ve ücretsiz Youtube videoları
const WORKOUT_CATEGORIES = [
  {
    id: 'hiit',
    titleKey: 'hiit',
    videos: [
      { id: 'ml6cT4AZdqI', title: '15 Min Fat Burn (No Equipment)', duration: '15 dk', thumbnail: 'https://img.youtube.com/vi/ml6cT4AZdqI/hqdefault.jpg' },
      { id: 'cbKkB3oaKAw', title: '20 Min Full Body HIIT', duration: '20 dk', thumbnail: 'https://img.youtube.com/vi/cbKkB3oaKAw/hqdefault.jpg' },
    ]
  },
  {
    id: 'yoga',
    titleKey: 'yoga',
    videos: [
      { id: 'v7AYKMP6rOE', title: '10 Min Morning Yoga', duration: '10 dk', thumbnail: 'https://img.youtube.com/vi/v7AYKMP6rOE/hqdefault.jpg' },
      { id: 'sTANio_2E0Q', title: 'Yoga for Beginners', duration: '20 dk', thumbnail: 'https://img.youtube.com/vi/sTANio_2E0Q/hqdefault.jpg' },
    ]
  },
  {
    id: 'strength',
    titleKey: 'strength',
    videos: [
      { id: 'UBnfm4s7CRA', title: '10 Min Abs Workout', duration: '10 dk', thumbnail: 'https://img.youtube.com/vi/UBnfm4s7CRA/hqdefault.jpg' },
      { id: 'qWy_aPANBu0', title: '15 Min Dumbbell Arms', duration: '15 dk', thumbnail: 'https://img.youtube.com/vi/qWy_aPANBu0/hqdefault.jpg' },
    ]
  }
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t, locale } = useTranslation();

  const handleVideoPress = (videoId: string, title: string) => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/workout/[id]' as any,
      params: { id: videoId, title }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientBackground />
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('workouts.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('workouts.subtitle')}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {WORKOUT_CATEGORIES.map((category, idx) => (
          <View key={category.id} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{t(`workouts.${category.titleKey}`)}</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {category.videos.map((video, vIdx) => (
                <PressableScale
                  key={video.id}
                  index={vIdx + idx * 2}
                  style={[styles.videoCard, { width: width * 0.7 }]}
                  onPress={() => handleVideoPress(video.id, video.title)}
                >
                  <Image 
                    source={{ uri: video.thumbnail }} 
                    style={styles.thumbnail} 
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={styles.thumbShade} />
                  <View style={styles.playBtn}>
                    <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 2 }} />
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration.replace('dk', t('common.minutes_abbr'))}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
            {idx === 0 && <AdMobBanner style={{ marginTop: 16, width: 'auto', marginHorizontal: 20 }} />}
          </View>
        ))}
        <AdMobBanner style={{ marginHorizontal: 20, width: 'auto' }} />
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050607',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  scrollContent: {
    flex: 1,
  },
  categoryContainer: {
    marginTop: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  videoCard: {
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: '#2a2a2a',
  },
  thumbShade: { position: 'absolute', top: 70, left: 0, right: 0, height: 90 },
  playBtn: {
    position: 'absolute', top: 58, alignSelf: 'center', left: '50%', marginLeft: -26,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(16,185,129,0.85)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 70,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    padding: 16,
    height: 64,
    justifyContent: 'center',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  }
});
