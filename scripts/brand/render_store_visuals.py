# Renders store-assets/en-US/v2/*.html to PNG (1080x1920 screens, 1024x500 feature graphic).
import glob, os
from playwright.sync_api import sync_playwright
d = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "store-assets", "en-US", "v2"))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for f in sorted(glob.glob(os.path.join(d, "*.html"))):
        name = os.path.basename(f)[:-5]
        fg = name == "feature-graphic"
        w, h = (1024, 500) if fg else (1080, 1920)
        pg.set_viewport_size({"width": w, "height": h})
        pg.goto("file:///" + f.replace("\\", "/")); pg.wait_for_timeout(500)
        pg.screenshot(path=os.path.join(d, f"{name}-{w}x{h}.png"))
        print("rendered", name)
    b.close()
