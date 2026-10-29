# -*- coding: utf-8 -*-
"""Renders the DietitianFit brand mark (flame = workouts/streak, emerald leaf = dietitian/nutrition)
into app icon, adaptive icon, splash, favicon, store icon and Android mipmaps/splash drawables."""
import io, os
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

MARK = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 77" width="{w}" height="{h}">
<defs>
 <linearGradient id="fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f97316"/><stop offset=".55" stop-color="#fb923c"/><stop offset="1" stop-color="#fde68a"/></linearGradient>
 <linearGradient id="lg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#059669"/><stop offset="1" stop-color="#6ee7b7"/></linearGradient>
 <filter id="gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter>
</defs>
<path d="M33 4C35 18 52 26 52 46c0 17-9 27-20 27S12 63 12 48c0-9 5-15 9-19 1 6 4 9 7 10-3-13 0-27 5-35z" fill="#f97316" opacity=".6" filter="url(#gl)"/>
<path d="M33 4C35 18 52 26 52 46c0 17-9 27-20 27S12 63 12 48c0-9 5-15 9-19 1 6 4 9 7 10-3-13 0-27 5-35z" fill="url(#fg)"/>
<path d="M32 66C22 60 21 47 32 37c11 10 10 23 0 29z" fill="url(#lg)"/>
<path d="M32 63V44" stroke="#04251b" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
</svg>"""

def page(body, w, h, bg="transparent"):
    return f"<html><body style='margin:0;width:{w}px;height:{h}px;background:{bg};overflow:hidden'>{body}</body></html>"

def shot(pw_page, html, w, h, transparent):
    pw_page.set_viewport_size({"width": w, "height": h})
    pw_page.set_content(html)
    return Image.open(io.BytesIO(pw_page.screenshot(omit_background=transparent))).convert("RGBA")

def mark_html(size_px, extra=""):
    h = round(size_px * 77 / 64)
    return MARK.format(w=size_px, h=h)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()

    # 1) icon: dark glossy square with the mark
    bgdiv = ("<div style='width:1024px;height:1024px;background:radial-gradient(circle at 50% 38%,#1b222c 0%,#0a0d12 62%,#05070b 100%);"
             "display:flex;align-items:center;justify-content:center'>" + mark_html(560) + "</div>")
    icon = shot(pg, page(bgdiv, 1024, 1024), 1024, 1024, False).convert("RGB")

    # 2) adaptive foreground: transparent, mark inside the 66% safe zone
    fg = shot(pg, page("<div style='width:1024px;height:1024px;display:flex;align-items:center;justify-content:center'>" + mark_html(520) + "</div>", 1024, 1024),
              1024, 1024, True)

    # 3) splash: mark + wordmark + tagline on #0a0a0a
    splash_body = ("<div style='width:1024px;height:1024px;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif'>"
                   + mark_html(300) +
                   "<div style='margin-top:34px;font-size:92px;font-weight:900;letter-spacing:4px;color:#fff'>DIETITIAN<span style='color:#ff7a00'>FIT</span></div>"
                   "<div style='margin-top:18px;font-size:30px;font-weight:800;letter-spacing:7px;color:#10b981'>DIETITIANS · WORKOUTS · STREAKS</div></div>")
    splash = shot(pg, page(splash_body, 1024, 1024, "#0a0a0a"), 1024, 1024, False).convert("RGB")
    b.close()

def rounded(im, size, radius_frac):
    im = im.resize((size, size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=int(size * 4 * radius_frac), fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

def circle(im, size):
    im = im.resize((size, size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

assets = os.path.join(ROOT, "assets")
icon.save(os.path.join(assets, "icon.png"))
icon.resize((256, 256), Image.LANCZOS).save(os.path.join(assets, "favicon.png"))
fg.save(os.path.join(assets, "adaptive-icon.png"))
splash.save(os.path.join(assets, "splash.png"))
icon.resize((512, 512), Image.LANCZOS).convert("RGBA").save(os.path.join(ROOT, "store-assets", "en-US", "icon", "icon-512.png"))

# Android mipmaps (legacy square + round use the full icon; adaptive foreground uses fg).
dens = {"mdpi": (48, 108), "hdpi": (72, 162), "xhdpi": (96, 216), "xxhdpi": (144, 324), "xxxhdpi": (192, 432)}
for d, (lsz, fsz) in dens.items():
    folder = os.path.join(RES, f"mipmap-{d}")
    rounded(icon, lsz, 0.22).save(os.path.join(folder, "ic_launcher.webp"), quality=95)
    circle(icon, lsz).save(os.path.join(folder, "ic_launcher_round.webp"), quality=95)
    fg.resize((fsz, fsz), Image.LANCZOS).save(os.path.join(folder, "ic_launcher_foreground.webp"), quality=95)

# Native splash drawable (expo-splash-screen logo): 288/432/576/864/1152 px squares, mark centered on transparent.
logo = shot_logo = None
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    logo = shot(pg, page("<div style='width:1024px;height:1024px;display:flex;align-items:center;justify-content:center'>" + mark_html(560) + "</div>", 1024, 1024), 1024, 1024, True)
    b.close()
for d, sz in {"mdpi": 288, "hdpi": 432, "xhdpi": 576, "xxhdpi": 864, "xxxhdpi": 1152}.items():
    logo.resize((sz, sz), Image.LANCZOS).save(os.path.join(RES, f"drawable-{d}", "splashscreen_logo.png"))
print("brand assets written")
