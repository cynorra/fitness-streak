# -*- coding: utf-8 -*-
"""Writes play-store-release-notes.txt (13 locales, <=500 chars each) and play-store-listing-en-US.md for 1.0.10 (vc13)."""
import csv, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

NOTES = {
"en-US": "🎉 Meet DietitianFit — the new name of your streak app, now built around real dietitians.\n\n✅ New Dietitians tab: browse rated dietitians, send a request, book appointments\n✅ Dietitian profiles with reviews and trust score\n✅ \"My Dietitian\" card on your home screen\n✅ Top dietitians leaderboard\n✅ New icon, fresh look and fixes",
"tr-TR": "🎉 DietitianFit ile tanış — seri uygulamanın yeni adı, artık gerçek diyetisyenlerle!\n\n✅ Yeni Diyetisyen sekmesi: puanlı diyetisyenleri incele, talep gönder, randevu al\n✅ Yorum ve güven puanlı diyetisyen profilleri\n✅ Ana ekranda \"Diyetisyenim\" kartı\n✅ En güvenilir diyetisyenler tablosu\n✅ Yeni simge, yeni görünüm ve düzeltmeler",
"de-DE": "🎉 Willkommen bei DietitianFit — der neue Name deiner Streak-App, jetzt mit echten Ernährungsberatern!\n\n✅ Neuer Tab: Berater mit Bewertungen entdecken, anfragen, Termine buchen\n✅ Berater-Profile mit Rezensionen und Vertrauenswert\n✅ Karte \"Mein Berater\" auf dem Startbildschirm\n✅ Rangliste der besten Berater\n✅ Neues Icon, frisches Design und Fehlerbehebungen",
"fr-FR": "🎉 Découvrez DietitianFit — le nouveau nom de votre appli de séries, désormais avec de vrais diététiciens !\n\n✅ Nouvel onglet : diététiciens notés, demandes et rendez-vous\n✅ Profils avec avis et score de confiance\n✅ Carte « Mon diététicien » sur l'accueil\n✅ Classement des meilleurs diététiciens\n✅ Nouvelle icône, nouveau look et correctifs",
"es-ES": "🎉 Conoce DietitianFit — el nuevo nombre de tu app de rachas, ahora con dietistas reales.\n\n✅ Nueva pestaña: dietistas valorados, solicitudes y citas\n✅ Perfiles con reseñas y puntuación de confianza\n✅ Tarjeta \"Mi dietista\" en la pantalla de inicio\n✅ Ranking de mejores dietistas\n✅ Nuevo icono, nuevo diseño y correcciones",
"pt-BR": "🎉 Conheça o DietitianFit — o novo nome do seu app de sequências, agora com nutricionistas de verdade!\n\n✅ Nova aba: nutricionistas avaliados, pedidos e consultas\n✅ Perfis com avaliações e nota de confiança\n✅ Cartão \"Meu nutricionista\" na tela inicial\n✅ Ranking dos melhores nutricionistas\n✅ Novo ícone, novo visual e correções",
"it-IT": "🎉 Scopri DietitianFit — il nuovo nome della tua app di serie, ora con dietisti reali!\n\n✅ Nuova scheda: dietisti con valutazioni, richieste e appuntamenti\n✅ Profili con recensioni e punteggio di fiducia\n✅ Scheda \"Il mio dietista\" nella home\n✅ Classifica dei migliori dietisti\n✅ Nuova icona, nuovo look e correzioni",
"nl-NL": "🎉 Maak kennis met DietitianFit — de nieuwe naam van je streak-app, nu met echte diëtisten!\n\n✅ Nieuw tabblad: beoordeelde diëtisten, aanvragen en afspraken\n✅ Profielen met reviews en vertrouwensscore\n✅ Kaart \"Mijn diëtist\" op het startscherm\n✅ Ranglijst van beste diëtisten\n✅ Nieuw icoon, frisse look en verbeteringen",
"ru-RU": "🎉 Знакомьтесь: DietitianFit — новое имя вашего приложения для серий, теперь с настоящими диетологами!\n\n✅ Новая вкладка: диетологи с рейтингом, заявки и записи\n✅ Профили с отзывами и рейтингом доверия\n✅ Карточка «Мой диетолог» на главном экране\n✅ Рейтинг лучших диетологов\n✅ Новая иконка, новый вид и исправления",
"ar": "🎉 تعرّف على DietitianFit — الاسم الجديد لتطبيق السلاسل، الآن مع أخصائيي تغذية حقيقيين!\n\n✅ تبويب جديد: أخصائيون بتقييمات وطلبات ومواعيد\n✅ ملفات تعريف مع مراجعات ودرجة ثقة\n✅ بطاقة \"أخصائي التغذية الخاص بي\" في الشاشة الرئيسية\n✅ قائمة أفضل أخصائيي التغذية\n✅ أيقونة جديدة ومظهر جديد وإصلاحات",
"ja-JP": "🎉 DietitianFitが登場 — 連続記録アプリの新しい名前、本物の栄養士と一緒に！\n\n✅ 新しい栄養士タブ：評価付き栄養士の閲覧、依頼、予約\n✅ レビューと信頼スコア付きのプロフィール\n✅ ホームに「マイ栄養士」カード\n✅ 人気栄養士ランキング\n✅ 新アイコン、新デザイン、不具合修正",
"ko-KR": "🎉 DietitianFit을 만나보세요 — 연속 기록 앱의 새 이름, 이제 진짜 영양사와 함께!\n\n✅ 새 영양사 탭: 평점 영양사 탐색, 요청, 예약\n✅ 리뷰와 신뢰 점수가 있는 프로필\n✅ 홈 화면의 \"내 영양사\" 카드\n✅ 인기 영양사 순위\n✅ 새 아이콘, 새 디자인, 오류 수정",
"id": "🎉 Kenalkan DietitianFit — nama baru aplikasi streak-mu, kini bersama ahli gizi sungguhan!\n\n✅ Tab baru: ahli gizi berating, permintaan, dan janji temu\n✅ Profil dengan ulasan dan skor kepercayaan\n✅ Kartu \"Ahli Gizi Saya\" di layar utama\n✅ Peringkat ahli gizi terbaik\n✅ Ikon baru, tampilan segar, dan perbaikan",
}

with open(os.path.join(ROOT, "play-store-release-notes.txt"), "w", encoding="utf-8", newline="\n") as f:
    for loc, text in NOTES.items():
        assert len(text) <= 500, (loc, len(text))
        f.write(f"<{loc}>\n{text}\n</{loc}>\n\n")

rows = {r[0]: r for r in csv.reader(open(os.path.join(ROOT, "store-assets", "play-store-listings-all-languages.csv"), encoding="utf-8", newline=""))}
en = rows["en-US"]
md = f"""# DietitianFit — Play Store Listing (en-US)

Generated from `store-assets/play-store-listings-all-languages.csv` (source: `scripts/store-listing/`).

## App title (30 char limit)
```
{en[1]}
```

## Short description (80 char limit)
```
{en[2]}
```

## Full description (4000 char limit)
```
{en[3]}
```

## Release name (internal, Play Console only)
```
1.0.10 (13) - DietitianFit
```

## Release notes / What's New (500 char limit)
```
{NOTES['en-US']}
```

## Notes
- `versionName "1.0.10"` / `versionCode 13` in `android/app/build.gradle` and `app.json`.
- Package name stays `com.vitatribe.fitness.spor.diyet.diyetisyen` (renaming would create a new Play app).
"""
with open(os.path.join(ROOT, "play-store-listing-en-US.md"), "w", encoding="utf-8") as f:
    f.write(md)
print("ok")
