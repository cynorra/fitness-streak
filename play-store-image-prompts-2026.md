# DietitianFit — Play Store 2026+ Görsel & Prompt Rehberi

> **Standart Hedefi:** Google Play Store 2026+ Tasarım Standartları (Material You 3+, Ultra-Clean Minimalist Glassmorphism, 3D Dynamic Device Mockups, Sinematik Işıklandırma, Yüksek Çözünürlüklü Estetik).  
> **Uyumlu AI Motorları:** Midjourney v6+, DALL-E 3, Flux 1.1 Pro / Dev, Stable Diffusion 3.5.

---

## 📌 Play Store Gereksinimleri & Boyut Tablosu

| Öğe | Boyut / Oran | Format | Not / 2026 Trendi |
|---|---|---|---|
| **App Icon** | 512 x 512 px (1:1) | 32-bit PNG | Flat değil, 3D dokulu cam/metalik alev amblemi, derinlikli gölge |
| **Feature Graphic (Öne Çıkan Görsel)** | 1024 x 500 px (~2:1) | JPEG / PNG | Sinematik vitrin, sol/sağ kenarlarda güvenli alan, metinsiz veya minimal slogan |
| **Telefon Ekran Görüntüleri (Min 4, Tercihen 6-8)** | 1080 x 2400 veya 1242 x 2688 (9:16 - 9:19.5) | PNG | 3D Çerçeveli (Bezel-less/Titanium) mockup, üstte vurucu tek satır değer önerisi, ultra-temiz arka plan |
| **Tablet Ekran Görüntüleri (Opsiyonel / Tavsiye)** | 2048 x 1536 (4:3) / 2560 x 1600 (16:10) | PNG | Geniş ekran ve dashboard görünümü |

---

## 🎨 Master Style & Negative Block (Tüm Promptlar İçin Ortak)

### Ortak Stil Parametreleri (Master Style):
```text
hyper-realistic, 8k resolution, modern 2026 mobile app aesthetic, dark charcoal-slate ambient (#0A0E17), luminous neon flame orange (#FF5500) and electric amber (#FFAA00) accents, subtle cyan-blue rim light, frosted glassmorphism elements, clean studio lighting, ray-traced ambient occlusion, subsurface scattering, elegant, ultra-crisp, premium tech look, Unreal Engine 5 render style, octane render
```

### Negatif Prompt (Negatif Blok):
```text
blurry, low quality, distorted, oversaturated, pixelated, ugly hands, extra fingers, cartoonish, childish, cheap 2D clip art, dated skeuomorphism, unreadable messy text, chaotic clutter, watermark, signature, stock photo generic smile
```

---

## 1. Uygulama İkonu (App Icon - 512x512)

### Prompt: 3D Neo-Glass Fire Streak Emblem
> **Kullanım:** Midjourney veya Flux için `--ar 1:1`
```text
App icon design, modern stylized fitness streak flame inside a rounded square app container, 3D frosted glass and polished anodized titanium texture, translucent flame made of molten orange energy and glowing ember core, deep dark obsidian background, micro-reflections, volumetric ambient lighting, minimal futuristic emblem, high precision CAD render, 8k --ar 1:1 --v 6.1 --style raw
```

---

## 2. Feature Graphic (Öne Çıkan Görsel - 1024x500)

### Prompt A: Sinematik Gece Antrenmanı & Yüzen 3D Arayüz (Kahraman Görsel)
> **Kullanım:** `--ar 2:1` (Daha sonra 1024x500 olarak kırpılır)
```text
Play Store Feature Graphic banner, wide cinematic 2:1 composition. On the left side, an athletic person in sleek black gym wear catching their breath after an intense workout in a moody high-tech gym, subtle sweat, rim lit by warm amber light. In the center-right, a floating borderless futuristic titanium smartphone displaying a vibrant streak interface with an incandescent flame number '42' and glass activity rings. Volumetric light rays, soft floating fire embers, dark midnight blue atmosphere, ample empty negative space on the left and right borders for UI overlay, octane render, photorealistic 8k --ar 2:1 --v 6.1
```

### Prompt B: 3D Geometrik & Vitrin Tarzı (Soyut / Premium Brand)
```text
Play Store Feature Graphic composition, 1024x500 panoramic ratio. High-end 3D product showcase on a dark reflective stage: two sleek titanium smartphones tilted dynamically, showing vibrant fitness progress graphs and dietitian consultation chat cards with frosted glass blur. A brilliant sculpted glass flame sculpture radiates glowing orange light between the phones. Smooth gradients of deep navy and charcoal, clean studio lighting, minimal, zero cluttered text, hyper-clean commercial render --ar 2:1 --v 6.1
```

---

## 3. Ekran Görüntüleri Arka Plan & Sahne Promptları (Phone Screenshots - 9:16 / 9:19.5)

*İpucu: Bu görselleri oluşturduktan sonra Figma/Canva veya web araçlarıyla üzerine uygulama ekranınızı ve kısa başlıklarınızı yerleştirebilirsiniz.*

### Ekran 1: "Never Break the Chain" — Seri & Alışkanlık Takibi
* **Kavram:** Günlük alev serisi, motivasyon ve disiplin.
* **Prompt:**
```text
Vertical 9:16 commercial app mockup background, an ultra-modern smartphone floating at a dynamic 15-degree angle, displaying a glowing 30-day streak calendar with an intense fiery flame icon on screen. Dramatic dark navy background with subtle orange laser grid lines and soft floating glass cards. Cinematic soft depth of field, premium tech marketing presentation, empty clean space at top for headline text, 8k, photorealistic --ar 9:16 --v 6.1
```
* **Önerilen Ekran Başlığı (Header):**  
  *EN:* `BUILD YOUR DAILY STREAK`  
  *TR:* `SERİNİ ASLA BOZMA, ALIŞKANLIK KAZAN`

---

### Ekran 2: "Social Accountability" — Arkadaşlar & Canlı Aktivite Akışı
* **Kavram:** Topluluk, arkadaşların antrenmanları ve "Kudos" etkileşimi.
* **Prompt:**
```text
Vertical 9:16 mobile presentation, a futuristic borderless phone held by a young athletic runner in an urban park during golden hour dusk. The screen glows brightly showing a social fitness feed with friend avatars, kudos badges, and workout cards. Natural rim lighting, soft city lights bokeh in background, vibrant yet authentic lifestyle feel, top section has dark vignette for clean title placement --ar 9:16 --v 6.1
```
* **Önerilen Ekran Başlığı (Header):**  
  *EN:* `TRAIN WITH FRIENDS & SEND KUDOS`  
  *TR:* `ARKADAŞLARINLA YARIŞ, KUDOS GÖNDER`

---

### Ekran 3: "Compete & Climb" — Canlı Liderlik Tablosu
* **Kavram:** Haftalık rekabet, skor tablosu, motivasyon.
* **Prompt:**
```text
Vertical 9:16 high-tech UI visual, a sleek phone screen showcasing a competitive fitness leaderboard with glowing 1st, 2nd, and 3rd place podium badges in gold, silver, and neon orange. Dark charcoal carbon fiber texture background with floating 3D geometric glass rings and subtle trophy light reflections. Clean modern graphic composition, sharp focus, 8k --ar 9:16 --v 6.1
```
* **Önerilen Ekran Başlığı (Header):**  
  *EN:* `CLIMB THE WEEKLY LEADERBOARD`  
  *TR:* `HAFTALIK LİDERLİK TABLOSUNDA YÜKSEL`

---

### Ekran 4: "Real Dietitians, Real Results" — Uzman Diyetisyen & Beslenme
* **Kavram:** Birebir diyetisyen randevuları, kişiselleştirilmiş makro/öğün planları.
* **Prompt:**
```text
Vertical 9:16 aesthetic composition. Aesthetic top-down flat lay: an elegant smartphone showing a verified dietitian profile and personalized nutrition macro plan, placed on a dark slate surface beside a fresh colorful healthy gourmet bowl (avocado, quinoa, salmon) and a matte black water bottle. Soft warm lighting, studio depth of field, premium wellness aesthetic, plenty of clean top space for copy --ar 9:16 --v 6.1
```
* **Önerilen Ekran Başlığı (Header):**  
  *EN:* `BOOK CERTIFIED DIETITIANS`  
  *TR:* `UZMAN DİYETİSYENLERLE BİREBİR ÇALIŞ`

---

### Ekran 5: "Direct Messaging" — Anlık Sohbet & Plan Yönetimi
* **Kavram:** Diyetisyenle kesintisiz iletişim ve soru-cevap.
* **Prompt:**
```text
Vertical 9:16 mobile presentation, isometric view of a sleek smartphone with frosted translucent glass chat bubbles hovering effortlessly above the screen, conveying direct messaging with a nutrition coach. Glowing micro-icons for voice notes and PDF meal plans. Dark minimalist gradient background with soft orange ambient glow, ultra-clean UI presentation --ar 9:16 --v 6.1
```
* **Önerilen Ekran Başlığı (Header):**  
  *EN:* `INSTANT CHAT & PERSONAL GUIDANCE`  
  *TR:* `ANLIK MESAJLAŞMA VE ÖZEL DESTEK`

---

### Ekran 6: "Detailed Analytics" — İlerleme, Kalori & Su Takibi
* **Kavram:** Haftalık özet, kalori açığı, su tüketimi ve streak istatistikleri.
* **Prompt:**
```text
Vertical 9:16 modern analytics visualization, floating smartphone highlighting circular progress rings for hydration, daily active calories, and weekly workout completion. Interactive neon orange and cyan glowing graphs gently protruding from the screen in 3D parallax. Dark obsidian stone backdrop, moody cinematic studio lighting, premium health tech look --ar 9:16 --v 6.1
```
* **Önerilen Ekran Başlığı (Header):**  
  *EN:* `SMART ANALYTICS & HYDRATION`  
  *TR:* `DETAYLI İSTATİSTİK VE SU TAKİBİ`

---

## 4. 2026+ Play Store Tasarım Kuralları & İpuçları

1. **Yazı Büyüklüğü & Kontrast:**
   * Google Play Store arama sonuçlarında ekran görüntüleri artık daha küçük kartlarda önizlenir.
   * Ekran başlıkları en fazla **3-5 kelime** olmalı ve **72-88pt** gibi büyük fontlarla (Inter, Plus Jakarta Sans, Outfit veya SF Pro) yazılmalıdır.
2. **Cihaz Çerçeveleri (Device Frames):**
   * 2026 standartlarında kalın çerçeveli telefonlar yerine **kavisli titanyum kenarlı, delik kameralı (punch-hole) ince çerçeveler** veya çerçevenin hafif taşarak 3D hissi verdiği stiller tercih edilmektedir.
3. **Gerçek UI ile Hibrit Üretim:**
   * AI araçlarında telefon ekranının içi genellikle bozuk yazı/ikon üretir.
   * **En iyi sonuç için:** AI ile arka plan ve 3D telefon gövdesini oluşturun, ardından ekran içine uygulamanızın gerçek ekran görüntülerini (`app/(tabs)/index.tsx`, `feed`, `dietitian`) yerleştirin.

---

## 🔄 2026-10-29 Yeniden Konumlandırma: DietitianFit (diyetisyen + spor)

Uygulama adı **DietitianFit**. Yeni logo: turuncu alev (antrenman/seri) + zümrüt yaprak (diyetisyen/beslenme). Eski "S" alev ikonu kullanılmaz.
Kanonik görseller `scripts/brand/make_brand_assets.py` (ikon/splash/mipmap) ve `scripts/brand/render_store_visuals.py` (`store-assets/en-US/v2` ekran görüntüleri + feature graphic) ile üretilir; yeni AI görseli gerekiyorsa aşağıdaki promptları kullan.

### Her görselde iki kol da görünsün
- **Sol/üst yarı:** diyetisyen (beyaz önlük, tablet, sağlıklı tabak), **sağ/alt yarı:** spor (salon, antrenman). Ortada turuncu alev + yeşil yaprak amblemi.
- Renkler: zümrüt #10B981 (diyetisyen), turuncu #F97316 (spor), koyu zemin #05070B.
- Slogan: "Real dietitians. Real workouts." Alt etiketler: Dietitians · Workouts · Streaks.

### Prompt: İkon (512x512)
```text
App icon, rounded square, deep charcoal background, glowing orange flame with a small emerald green leaf inside it, minimal flat-3D, soft glow, centered, no text --ar 1:1 --v 6.1 --style raw
```

### Prompt: Feature Graphic (1024x500)
```text
Split composition, left a friendly dietitian in a white coat holding a tablet with a colorful healthy meal plan, right an athlete training in a modern gym, orange flame with emerald leaf emblem in the center, dark charcoal background (#05070B) with emerald and orange rim light, premium 2026 app store look, wide 2:1, clean empty space for headline "Real dietitians. Real workouts." --ar 2:1 --v 6.1
```

### Prompt: Google Ads (1:1 / 1.91:1 / 4:5)
```text
Smiling dietitian and fit person side by side, healthy plate and dumbbells, phone showing app with "Find your dietitian" card, emerald and orange accents, dark premium background, space for text "Dietitian + Workout in one app" --ar 4:5 --v 6.1
```
