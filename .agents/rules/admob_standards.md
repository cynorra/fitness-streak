# AdMob Reklam Standartları ve Entegrasyon Kuralları

Bu kural, mobil uygulamalarda Google AdMob (`react-native-google-mobile-ads`) entegrasyonu yapılırken zorunludur:

## 1. Sadece Resmi Canlı Reklam Birimleri (Strictly No TestIds)
* Kod içinde hiçbir koşulda (DEV / geliştirme modu dahil) `TestIds.BANNER`, `TestIds.INTERSTITIAL` veya Google'ın demo reklam ID'leri KULLANILMAYACAKTIR.
* Her zaman doğrudan `.env` dosyasındaki veya projede tanımlanan gerçek resmi AdMob ID'leri (`ca-app-pub-...`) kullanılmalıdır.

## 2. Tüm Cihazlarla Tam Uyum (Universal Adaptive Anchoring)
* Banner reklamlarında sabit piksel boyutu kullanılmamalıdır.
* Mutlaka `BannerAdSize.ANCHORED_ADAPTIVE_BANNER` kullanılmalıdır.
* Küçük telefonlardan katlanabilir cihazlara ve tabletlere kadar taşma/bozulma olmaması için `useWindowDimensions()` ile container'a `{ maxWidth: width, overflow: 'hidden' }` tanımlanmalıdır.

## 3. Sıfır Hata ve Temiz Arayüz (Silent Failover)
* Reklam envanteri bulunamadığında (`ERROR_CODE_NO_FILL / Hata 3`) veya ağ hatası alındığında kullanıcıya asla hata mesajı, alert veya sahte reklam kutusu gösterilmemelidir.
* Bileşen sessizce `return null;` yaparak arayüz kaymasını ve çirkin boşlukları engellemelidir.

## 4. Geçiş Reklamları (Interstitial) Yaşam Döngüsü
* Geçiş reklamları kullanıcı butona basmadan önce arka planda önceden yüklenmelidir (`preload`).
* Reklam kapatıldığında (`AdEventType.CLOSED`), bir sonraki gösterim için hemen yenisi yüklenmelidir.
