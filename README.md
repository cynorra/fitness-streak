# Streak-Fit MVP

Minimal, çalışan bir streak-temelli fitness uygulaması iskeleti.

## Stack
- **Expo + React Native** (iOS + Android tek kod)
- **Expo Router** (file-based routing)
- **Supabase** (auth + Postgres + realtime)
- **TypeScript**

## Kurulum (sırayla)

### 1. Ön gereksinimler
- Node.js 20+ kurulu olmalı: `node -v`
- Telefonuna **Expo Go** uygulamasını indir (App Store / Play Store)

### 2. Projeyi kur
```bash
npx create-expo-app@latest streak-fit --template tabs
cd streak-fit
```

Sonra bu repodaki dosyaları üzerine kopyala (klasör yapısına dikkat).

### 3. Bağımlılıkları yükle
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill date-fns
```

### 4. Supabase kur
1. https://supabase.com → ücretsiz hesap aç → yeni proje oluştur (region: **Frankfurt** seç, KVKK için)
2. Project Settings → API → `URL` ve `anon public` key'i kopyala
3. `.env` dosyası oluştur:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 5. Veritabanı şemasını kur
Supabase Dashboard → SQL Editor → `supabase/schema.sql` içeriğini yapıştır → Run

### 6. Çalıştır
```bash
npx expo start
```
Terminaldeki QR kodu Expo Go ile tara.

## Ne çalışıyor?
- ✅ Email/şifre ile kayıt + giriş
- ✅ Antrenman logla (tip + süre)
- ✅ Streak otomatik hesaplanır (kullanıcının saat dilimine göre, 04:00 reset)
- ✅ Arkadaş ekle (username ile)
- ✅ Arkadaşların streak'ini gör, "alkışla" (kudos)
- ✅ Haftalık özet ekranı

## Ne YOK (bilerek)
- ❌ Antrenör eşleştirme (Faz 3)
- ❌ Challenge'lar (Faz 2)
- ❌ Beslenme takibi
- ❌ Video içerik
- ❌ Ödeme

## Sonraki adımlar
1. Telefonunda çalıştır, kendi kullanıcınla test et
2. 3-5 arkadaşına ver, 1 hafta kullansınlar
3. Geri bildirim al, ne işe yaramıyor onu sil, neyi seviyorlar onu büyüt
