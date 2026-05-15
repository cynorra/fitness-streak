# Streak-Fit Web (Next.js 16)

Streak-Fit, topluluk odaklı bir fitness ve motivasyon platformudur. Bu web platformu, mobil MVP ile senkronize çalışacak şekilde, yüksek performans ve SEO odaklı olarak inşa edilmiştir.

## 🚀 Özellikler

- **Dinamik Streak Takibi:** Antrenman serilerinizi koruyun ve toplulukla paylaşın.
- **Sosyal Akış (Feed):** Arkadaşlarınızın antrenmanlarını görün, Kudos (beğeni) verin ve yorum yapın.
- **Gerçek Zamanlı Mesajlaşma:** Supabase Realtime ile anlık sohbet edin.
- **Diyetisyen & Koç Yönetimi:** Uzmanlardan destek alın veya danışanlarınızı yönetin.
- **SEO Optimizasyonu:** Kullanıcı profilleri ve içerikler için dinamik metadata, sitemap ve robots.txt desteği.
- **Premium Tasarım:** Modern, hızlı ve responsive (mobil uyumlu) arayüz.

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js 16 (App Router)
- **Veritabanı & Auth:** Supabase (PostgreSQL, Realtime, SSR)
- **Styling:** Tailwind CSS 4
- **Diller:** TypeScript

## 🚦 Başlangıç

Öncelikle `.env.local` dosyasını oluşturun ve gerekli değişkenleri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Ardından geliştirme sunucusunu başlatın:

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinden uygulamaya erişebilirsiniz.

## 📱 Mobil Uygulama

Mobil uygulama için kök dizindeki Expo projesine göz atın.

---
© 2026 Streak-Fit. Tüm hakları saklıdır.
