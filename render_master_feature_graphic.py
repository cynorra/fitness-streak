import base64
import os
from playwright.sync_api import sync_playwright

with open('assets/icon.png', 'rb') as f:
    icon_b64 = base64.b64encode(f.read()).decode('utf-8')

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Feature Graphic</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html, body {{
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #06080c;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }}
  
  .stage {{
    position: relative;
    width: 1024px;
    height: 500px;
    background: radial-gradient(circle at 18% 40%, rgba(249, 115, 22, 0.16) 0%, transparent 45%),
                radial-gradient(circle at 82% 30%, rgba(16, 185, 129, 0.18) 0%, transparent 50%),
                radial-gradient(circle at 60% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 45%),
                linear-gradient(135deg, #090c10 0%, #06080c 50%, #040507 100%);
  }}

  /* High tech ambient grid */
  .grid {{
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.85) 30%, transparent 80%);
  }}

  /* Left Hero Content */
  .left-hero {{
    position: absolute;
    left: 64px;
    top: 0;
    bottom: 0;
    width: 480px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 10;
  }}

  .badge-row {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(249, 115, 22, 0.12);
    border: 1px solid rgba(249, 115, 22, 0.35);
    padding: 6px 14px;
    border-radius: 999px;
    margin-bottom: 18px;
    width: fit-content;
  }}
  .badge-row .flame {{ font-size: 15px; }}
  .badge-row span {{
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #fb923c;
  }}

  .brand-title {{
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 14px;
  }}
  .brand-icon {{
    width: 62px;
    height: 62px;
    border-radius: 17px;
    box-shadow: 0 10px 25px rgba(249, 115, 22, 0.35), 0 0 0 1.5px rgba(255,255,255,0.12);
    overflow: hidden;
    flex-shrink: 0;
  }}
  .brand-icon img {{
    width: 100%;
    height: 100%;
    display: block;
  }}
  .brand-name {{
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -1.5px;
    color: #ffffff;
    line-height: 1;
  }}
  .brand-name span {{
    color: #10b981;
  }}

  .headline {{
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -1.2px;
    line-height: 1.15;
    color: #f1f5f9;
    margin-bottom: 12px;
  }}
  .headline .gradient-text {{
    background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .headline .gradient-green {{
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .subhead {{
    font-size: 16px;
    font-weight: 600;
    line-height: 1.45;
    color: #94a3b8;
    margin-bottom: 24px;
    max-width: 440px;
  }}

  .features-strip {{
    display: flex;
    gap: 10px;
    align-items: center;
  }}
  .feature-chip {{
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 7px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
  }}
  .feature-chip .dot {{
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }}
  .dot.orange {{ background: #f97316; box-shadow: 0 0 8px #f97316; }}
  .dot.emerald {{ background: #10b981; box-shadow: 0 0 8px #10b981; }}
  .dot.purple {{ background: #818cf8; box-shadow: 0 0 8px #818cf8; }}

  /* Right Visual: 2 Floating 3D Phones */
  .right-visual {{
    position: absolute;
    right: 28px;
    top: 0;
    bottom: 0;
    width: 470px;
  }}

  .phone-mockup {{
    position: absolute;
    width: 240px;
    height: 480px;
    border-radius: 38px;
    padding: 7px;
    background: linear-gradient(145deg, #333842, #14171d 45%, #222630);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 0 1.5px rgba(255,255,255,0.08);
  }}
  .phone-screen {{
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 32px;
    background: #090c10;
    overflow: hidden;
  }}

  /* Phone 1: Streak Counter & Flame */
  .phone-1 {{
    left: 20px;
    top: 35px;
    transform: rotate(-6deg) scale(0.96);
    z-index: 5;
  }}
  .p1-content {{
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }}
  .notch {{
    width: 70px;
    height: 14px;
    background: #000000;
    border-radius: 0 0 10px 10px;
    margin-bottom: 20px;
  }}
  .streak-bubble {{
    width: 100%;
    background: linear-gradient(145deg, rgba(249, 115, 22, 0.14), rgba(249, 115, 22, 0.04));
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 24px;
    padding: 18px 12px;
    margin-bottom: 14px;
    box-shadow: 0 12px 30px rgba(249, 115, 22, 0.15);
  }}
  .big-flame {{
    font-size: 34px;
    margin-bottom: 2px;
    filter: drop-shadow(0 4px 12px rgba(249, 115, 22, 0.5));
  }}
  .streak-num {{
    font-size: 58px;
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -2px;
    color: #ffffff;
  }}
  .streak-lbl {{
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #fb923c;
    text-transform: uppercase;
    margin-top: 6px;
  }}
  .p1-days {{
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 4px;
    margin-top: 10px;
  }}
  .p1-d {{
    flex: 1;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 11px;
    font-weight: 900;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35);
  }}
  .p1-stat-card {{
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }}
  .stat-l {{ font-size: 11px; font-weight: 700; color: #94a3b8; }}
  .stat-v {{ font-size: 14px; font-weight: 800; color: #34d399; }}

  /* Phone 2: Dietitian & Booking */
  .phone-2 {{
    right: 15px;
    top: 75px;
    transform: rotate(7deg) scale(0.92);
    z-index: 3;
    opacity: 0.92;
  }}
  .p2-content {{
    padding: 24px 14px;
  }}
  .p2-hdr {{
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
    color: #94a3b8;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 16px;
  }}
  .diet-card {{
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 18px;
    padding: 12px;
    margin-bottom: 10px;
  }}
  .diet-row {{
    display: flex;
    gap: 10px;
    align-items: center;
  }}
  .diet-av {{
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981, #047857);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 14px;
  }}
  .diet-info {{ flex: 1; }}
  .diet-name {{ font-size: 12px; font-weight: 800; color: #f8fafc; }}
  .diet-tag {{ font-size: 10px; font-weight: 700; color: #34d399; margin-top: 2px; }}
  .diet-btn {{
    width: 100%;
    margin-top: 10px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #04251b;
    font-weight: 800;
    font-size: 11px;
    padding: 8px;
    text-align: center;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  }}

  /* Floating Trust Tag */
  .float-badge {{
    position: absolute;
    bottom: 45px;
    right: 215px;
    z-index: 12;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 10px 16px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  }}
  .float-badge .ic-star {{
    font-size: 18px;
    color: #fbbf24;
  }}
  .float-badge .t1 {{ font-size: 12px; font-weight: 800; color: #ffffff; }}
  .float-badge .t2 {{ font-size: 10px; font-weight: 600; color: #94a3b8; }}

</style>
</head>
<body>
<div class="stage">
  <div class="grid"></div>

  <div class="left-hero">
    <div class="badge-row">
      <span class="flame">🔥</span>
      <span>HABIT & FITNESS TRACKER</span>
    </div>

    <div class="brand-title">
      <div class="brand-icon">
        <img src="data:image/png;base64,{icon_b64}" alt="StreakFit" />
      </div>
      <div class="brand-name">Streak<span>Fit</span></div>
    </div>

    <div class="headline">
      Build a streak<br>
      you <span class="gradient-text">won't break.</span>
    </div>

    <div class="subhead">
      Daily workout streaks, certified dietitian booking, and social fitness motivation — all in one.
    </div>

    <div class="features-strip">
      <div class="feature-chip">
        <span class="dot orange"></span>
        Streak Tracking
      </div>
      <div class="feature-chip">
        <span class="dot emerald"></span>
        Expert Dietitians
      </div>
      <div class="feature-chip">
        <span class="dot purple"></span>
        Social Fitness
      </div>
    </div>
  </div>

  <div class="right-visual">
    <!-- Phone 1 (Foreground) -->
    <div class="phone-mockup phone-1">
      <div class="phone-screen">
        <div class="p1-content">
          <div class="notch"></div>
          <div class="streak-bubble">
            <div class="big-flame">🔥</div>
            <div class="streak-num">47</div>
            <div class="streak-lbl">Day Streak</div>
          </div>
          <div class="p1-days">
            <div class="p1-d">M</div>
            <div class="p1-d">T</div>
            <div class="p1-d">W</div>
            <div class="p1-d">T</div>
            <div class="p1-d">F</div>
            <div class="p1-d">S</div>
          </div>
          <div class="p1-stat-card">
            <span class="stat-l">Longest Streak</span>
            <span class="stat-v">62 Days</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Phone 2 (Background) -->
    <div class="phone-mockup phone-2">
      <div class="phone-screen">
        <div class="p2-content">
          <div class="notch"></div>
          <div class="p2-hdr">Certified Experts</div>
          <div class="diet-card">
            <div class="diet-row">
              <div class="diet-av">DR</div>
              <div class="diet-info">
                <div class="diet-name">Dr. Elena Cruz</div>
                <div class="diet-tag">Sports Nutrition</div>
              </div>
            </div>
            <div class="diet-btn">Book 1-on-1</div>
          </div>
          <div class="diet-card" style="opacity: 0.8;">
            <div class="diet-row">
              <div class="diet-av" style="background: linear-gradient(135deg, #818cf8, #4f46e5);">MC</div>
              <div class="diet-info">
                <div class="diet-name">Maya Chen, RD</div>
                <div class="diet-tag" style="color: #a5b4fc;">Weight Loss</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Badge -->
    <div class="float-badge">
      <span class="ic-star">★</span>
      <div>
        <div class="t1">Science-Backed Habits</div>
        <div class="t2">100% Habit Consistency</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
"""

html_path = os.path.abspath("store-assets/feature-graphic-master.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Saved HTML template. Rendering with Playwright to exact 1024x500 PNG...")

targets = [
    "store-assets/feature-graphic-1024x500.png",
    "store-assets/en-US/feature-graphic-1024x500.png",
    "store-assets/en-US/v2/feature-graphic-1024x500.png",
    "store-assets/en-US/feature-graphic/feature-graphic-1024x500.png"
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1024, "height": 500}, device_scale_factor=1.0)
    page.goto(f"file:///{html_path}")
    page.wait_for_timeout(1000)
    
    # Take screenshot of the exact stage
    screenshot_bytes = page.locator(".stage").screenshot()
    
    for t in targets:
        os.makedirs(os.path.dirname(t), exist_ok=True)
        with open(t, "wb") as f_out:
            f_out.write(screenshot_bytes)
        print(f"Generated: {t} ({len(screenshot_bytes)} bytes)")
        
    browser.close()

print("Master Feature Graphic generation completed!")
