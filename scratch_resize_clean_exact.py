import os
from PIL import Image

src_dir = r"store-assets\ekran-görüntüleri"
base_out = r"store-assets\ekran-görüntüleri-hazir"

# Targets:
# Phone: 1080 x 1920
# Tablet 7-inch: 1200 x 1920
# Tablet 10-inch: 1600 x 2560
targets = {
    "phone": (1080, 1920),
    "tablet-7in": (1200, 1920),
    "tablet-10in": (1600, 2560)
}

files = [f for f in sorted(os.listdir(src_dir)) if os.path.isfile(os.path.join(src_dir, f))]

for device_type, (target_w, target_h) in targets.items():
    out_dir = os.path.join(base_out, device_type)
    os.makedirs(out_dir, exist_ok=True)
    
    target_aspect = target_w / target_h
    
    for idx, f in enumerate(files, 1):
        in_path = os.path.join(src_dir, f)
        base_name = os.path.splitext(f)[0]
        
        with Image.open(in_path) as im:
            rgb_im = im.convert("RGB")
            w, h = rgb_im.size
            img_aspect = w / h
            
            # FIT-TO-FILL / CENTER CROP:
            # We scale the image so it FULLY covers the target box without ANY empty bars/borders.
            # Then crop the excess from the center.
            if img_aspect > target_aspect:
                # Image is wider than target: scale height to target_h, crop sides
                scale = target_h / h
                scaled_w = int(round(w * scale))
                scaled_h = target_h
                scaled_im = rgb_im.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
                
                left = (scaled_w - target_w) // 2
                cropped = scaled_im.crop((left, 0, left + target_w, target_h))
            else:
                # Image is taller or equal: scale width to target_w, crop top/bottom
                scale = target_w / w
                scaled_w = target_w
                scaled_h = int(round(h * scale))
                scaled_im = rgb_im.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
                
                top = (scaled_h - target_h) // 2
                cropped = scaled_im.crop((0, top, target_w, top + target_h))
            
            out_file = f"{idx:02d}_{base_name}_{target_w}x{target_h}.png"
            out_path = os.path.join(out_dir, out_file)
            cropped.save(out_path, format="PNG", optimize=True)
            print(f"[{device_type}] {out_file}: {cropped.size} (FULL BLEED, NO BLACK BARS, NO BLUR)")

print("SUCCESS: All images filled edge-to-edge without any black borders or blur!")
