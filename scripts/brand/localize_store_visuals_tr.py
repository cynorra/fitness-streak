# -*- coding: utf-8 -*-
"""Builds store-assets/tr-TR/v2 (Turkish store screenshots + feature graphic) from the en-US v2 HTML and renders PNGs."""
import glob, os, re, shutil
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "store-assets", "en-US", "v2")
DST = os.path.join(ROOT, "store-assets", "tr-TR", "v2")

TR = {
 # 01 dietitians
 "Certified dietitians": "Onaylı diyetisyenler", "Real dietitians.": "Gerçek diyetisyenler.", "Real plans.": "Gerçek planlar.",
 "Find a verified dietitian, book an appointment and get a plan built around you.": "Onaylı bir diyetisyen bul, randevu al ve sana özel plan hazırlansın.",
 "FIND A DIETITIAN": "DİYETİSYEN BUL", "Search name or specialty...": "İsim veya uzmanlık ara...", "Sports nutrition": "Spor beslenmesi",
 "TRUST": "GÜVEN", "Book appointment": "Randevu al", "Weight management": "Kilo yönetimi", "Appointment confirmed": "Randevu onaylandı",
 "4.9 · 212 reviews": "4.9 · 212 yorum", "4.8 · 176 reviews": "4.8 · 176 yorum", "Thu 6:30 PM · Dr. Elena Cruz": "Per 18:30 · Dr. Elena Cruz",
 # 02 streak
 "Daily streaks": "Günlük seriler", "Build a streak": "Bozmayacağın", "you": "bir seri", "won't break.": "oluştur.",
 "Log a workout, watch your chain grow and stay motivated every single day.": "Antrenmanını kaydet, zincirin büyüsün, her gün motive kal.",
 "HELLO, ALEX": "MERHABA, ALEX", "DAY STREAK": "GÜNLÜK SERİ", "Serious streak": "Ciddi seri", "LONGEST STREAK": "EN UZUN SERİ", "THIS WEEK": "BU HAFTA",
 "Leaderboard": "Liderlik", "Challenges": "Görevler", "Streak saved": "Seri korundu", "+1 day · 47 in a row": "+1 gün · üst üste 47",
 "Mia hit 30 days": "Mia 30 güne ulaştı", "Send her a 🔥": "Ona bir 🔥 gönder",
 # 03 chat plan
 "Your dietitian, in your pocket": "Diyetisyenin cebinde", "Chat. Get your plan.": "Yaz. Planını al.", "Stay on track.": "Yolda kal.",
 "Message your dietitian anytime and get a personalised nutrition plan with calorie and macro targets.": "Diyetisyenine istediğin zaman yaz, kalori ve makro hedefli kişisel beslenme planını al.",
 "Your dietitian · online": "Diyetisyenin · çevrimiçi", "Hi Alex! 👋 I built your 7-day plan around your goal and training days.": "Merhaba Alex! 👋 Hedefine ve antrenman günlerine göre 7 günlük planını hazırladım.",
 "DIET PLAN · WEEK 1": "BESLENME PLANI · HAFTA 1", "2,150 kcal / day": "2.150 kcal / gün", "By Dr. Elena": "Dr. Elena'dan",
 "PROTEIN": "PROTEİN", "CARBS": "KARBONHİDRAT", "FAT": "YAĞ", "Breakfast": "Kahvaltı", "Oats, berries &amp; whey": "Yulaf, meyve ve whey",
 "Lunch": "Öğle", "Chicken rice bowl": "Tavuklu pilav kasesi", "Dinner": "Akşam", "Salmon &amp; greens": "Somon ve yeşillik", "420 kcal": "420 kcal",
 "Love it! Can I swap lunch?": "Harika! Öğle yemeğini değiştirebilir miyim?", "Message from Dr. Elena": "Dr. Elena'dan mesaj", "“Great week, Alex! 💪”": "“Harika bir hafta, Alex! 💪”",
 # 04 friends
 "Friends &amp; community": "Arkadaşlar ve topluluk", "Train together.": "Birlikte çalış.", "Stay accountable.": "Sorumlu kal.",
 "Add friends, follow each other's streaks and keep one another going — workout after workout.": "Arkadaş ekle, birbirinizin serilerini takip edin ve her antrenmanda birbirinizi motive edin.",
 "FRIENDS": "ARKADAŞLAR", "Search username...": "Kullanıcı adı ara...", "INCOMING REQUESTS": "GELEN İSTEKLER", "Accept": "Kabul et", "FRIENDS (3)": "ARKADAŞLAR (3)",
 "Jake wants to train": "Jake seninle antrenman yapmak istiyor", "New friend request": "Yeni arkadaşlık isteği", "Mia hit 30 days!": "Mia 30 güne ulaştı!", "Cheer her on 🎉": "Ona alkış gönder 🎉",
 # 05 feed
 "Community feed": "Topluluk akışı", "Share every win.": "Her başarıyı paylaş.", "Cheer every step.": "Her adımı alkışla.",
 "Post your workouts and meals, get support from the community and learn from dietitians.": "Antrenman ve öğünlerini paylaş, topluluktan destek al, diyetisyenlerden öğren.",
 "FEED": "AKIŞ", "Share your progress...": "İlerlemeni paylaş...", "POST": "PAYLAŞ", "Today, 08:12": "Bugün, 08:12", "🩺 Dietitian": "🩺 Diyetisyen",
 "Tip of the day: aim for 25–30g of protein at breakfast to stay full until lunch. Eggs, Greek yogurt or tofu scramble all work great 🥚": "Günün ipucu: Öğlene kadar tok kalmak için kahvaltıda 25–30 g protein hedefle. Yumurta, süzme yoğurt veya tofu harika seçenekler 🥚",
 "↗ Share": "↗ Paylaş", "Today, 07:40": "Bugün, 07:40", "💪 Member": "💪 Üye", "Day 31 done! 5K run + stretching. Not breaking this chain 🔥": "31. gün tamam! 5 km koşu + esneme. Bu zinciri bozmuyorum 🔥",
 "DISTANCE": "MESAFE", "TIME": "SÜRE", "KCAL": "KCAL", "+96 cheers": "+96 alkış", "on Mia's workout": "Mia'nın antrenmanına",
 # 06 compete
 "Leaderboard &amp; challenges": "Liderlik ve görevler", "Compete with": "Kabilenle", "your tribe.": "yarış.",
 "Climb the leaderboard and join challenges from dietitians to stay motivated together.": "Liderlik tablosunda yüksel, diyetisyenlerin görevlerine katıl, birlikte motive kal.",
 "LEADERBOARD": "LİDERLİK", "You": "Sen", "ACTIVE CHALLENGE": "AKTİF GÖREV", "30 Days Sugar-Free": "30 Gün Şekersiz", "By Dr. Elena Cruz · 84 joined": "Dr. Elena Cruz · 84 katılımcı",
 "12 days left": "12 gün kaldı", "Progress · 18 / 30 days of meal logs": "İlerleme · 18 / 30 gün öğün kaydı", "Join": "Katıl", "You moved up!": "Yükseldin!", "#6 → #5 this week": "Bu hafta #6 → #5",
 # 07 nutrition
 "Nutrition tracking": "Beslenme takibi", "Track meals,": "Öğünleri,", "water &amp;": "suyu ve", "fasting.": "orucu takip et.",
 "Log what you eat, hit your calorie and macro targets and keep your dietitian in the loop.": "Ne yediğini kaydet, kalori ve makro hedeflerine ulaş, diyetisyenini her zaman haberdar et.",
 "TODAY'S MEALS": "BUGÜNKÜ ÖĞÜNLER", "OF 2,150 KCAL": "/ 2.150 KCAL", "MACROS": "MAKROLAR", "Protein": "Protein", "112 / 160g": "112 / 160 g", "Carbs": "Karbonhidrat",
 "148 / 230g": "148 / 230 g", "Fat": "Yağ", "41 / 62g": "41 / 62 g", "💧 WATER": "💧 SU", "⏱ FASTING": "⏱ ORUÇ", "16:8 · ends 6:00 PM": "16:8 · 18:00'de biter",
 "Dietitian reviewed": "Diyetisyen inceledi", "“Perfect protein today!”": "“Bugün protein harika!”",
 # 08 progress
 "Progress &amp; GPS": "İlerleme ve GPS", "See your progress.": "İlerlemeni gör.", "Own your goals.": "Hedeflerini sahiplen.",
 "Track weekly activity, record outdoor runs with GPS and watch your numbers improve.": "Haftalık aktiviteni izle, dış mekan koşularını GPS ile kaydet, rakamlarının gelişmesini izle.",
 "ANALYTICS": "ANALİZ", "WORKOUTS": "ANTRENMAN", "▲ 20% vs last month": "▲ geçen aya göre %20", "ACTIVE MIN": "AKTİF DK", "▲ 12% vs last month": "▲ geçen aya göre %12",
 "6 / 7 days": "6 / 7 gün", "Morning Run": "Sabah Koşusu", "PACE": "TEMPO", "5:31 /km": "5:31 /km", "New personal best": "Yeni kişisel rekor", "Longest run · 5.2 km": "En uzun koşu · 5,2 km",
 # feature graphic
 "Book certified dietitians, track gym &amp; workouts, keep streaks with friends.": "Onaylı diyetisyenlerle çalış, spor salonu ve antrenmanını takip et, arkadaşlarınla seri tut.",
 "Real workouts.": "Gerçek antrenman.", "Dietitians": "Diyetisyenler", "Streaks": "Seriler",
}

# Feature graphic: shorter headline so it fits the 1024x500 canvas.
TR_FG = {"Workouts": "Antrenman", "Real dietitians.": "Gerçek diyetisyen.", "Real workouts.": "Gerçek spor.",
         "Book certified dietitians, track gym & workouts, keep streaks with friends.": "Diyetisyenle çalış, antrenmanını takip et, arkadaşlarınla seri tut."}

def translate(html, table=TR):
    # replace text nodes only (between > and <), exact match after strip
    def rep(m):
        raw = m.group(1)
        t = raw.strip()
        return ">" + raw.replace(t, table[t]) + "<" if t in table else m.group(0)
    return re.sub(r">([^<>]+)<", rep, html)

os.makedirs(DST, exist_ok=True)
for f in os.listdir(SRC):
    if f.endswith((".css", ".js")):
        shutil.copy(os.path.join(SRC, f), os.path.join(DST, f))
for f in glob.glob(os.path.join(SRC, "*.html")):
    s = open(f, encoding="utf-8").read()
    fg = os.path.basename(f) == "feature-graphic.html"
    s = translate(s, {**TR, **TR_FG} if fg else TR).replace('<html>', '<html lang="tr">')
    open(os.path.join(DST, os.path.basename(f)), "w", encoding="utf-8").write(s)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for f in sorted(glob.glob(os.path.join(DST, "*.html"))):
        name = os.path.basename(f)[:-5]
        w, h = (1024, 500) if name == "feature-graphic" else (1080, 1920)
        pg.set_viewport_size({"width": w, "height": h})
        pg.goto("file:///" + f.replace("\\", "/")); pg.wait_for_timeout(500)
        pg.screenshot(path=os.path.join(DST, f"{name}-{w}x{h}.png"))
    b.close()
print("tr-TR visuals ok")
