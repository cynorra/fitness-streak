import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, useWindowDimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n/i18n';
import AdMobBanner from '../../components/AdMobBanner';
import PressableScale from '../../components/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AmbientBackground from '../../components/AmbientBackground';
import FeaturedDietitians from '../../components/FeaturedDietitians';
import { useAuth } from '../../lib/auth';
import { loadDiscover, timeAgo, DiscoverCategory } from '../../lib/discover';

export default function WorkoutsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t, locale } = useTranslation();
  const [categories, setCategories] = useState<DiscoverCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    try {
      setCategories(await loadDiscover(force));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

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

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {profile && profile.role !== 'dietitian' && (
          <View style={{ marginTop: 16 }}>
            <FeaturedDietitians userId={profile.id} />
          </View>
        )}
        {loading && <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />}
        {!loading && categories.every((c) => c.videos.length === 0) && (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40, paddingHorizontal: 32 }}>{t('workouts.empty')}</Text>
        )}
        {categories.filter((c) => c.videos.length > 0).map((category, idx) => (
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
                    <Text style={styles.durationText}>{timeAgo(video.publishedAt, locale)}</Text>
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
