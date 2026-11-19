import os
from PIL import Image

src_dir = r"store-assets\ekran-görüntüleri"
base_out = r"store-assets\ekran-görüntüleri-temiz"

# Target scales for devices.
# Google Play Store rule:
# - Minimum dimension: 320px
# - Maximum dimension: 3840px
# - Aspect ratio must not be greater than 2:1 (max_side / min_side <= 2.0)
# - No need to force a fixed 9:16 or 16:10 box with blurred borders! 
# Play Store accepts any aspect ratio under 2:1, portrait or landscape!

targets = {
    "phone": {
        # Scale to crisp high-res while keeping exact original aspect ratio:
        # For portrait: target height 1920 or 2048
        # For landscape: target width 1920 or 2048
        # For square: 1080 x 1080
        "portrait_long": 1920,
        "landscape_long": 1920,
        "square_side": 1080,
    },
    "tablet-7in": {
        "portrait_long": 1920,
        "landscape_long": 1920,
        "square_side": 1200,
    },
    "tablet-10in": {
        "portrait_long": 2560,
        "landscape_long": 2560,
        "square_side": 1600,
    }
}

files = [f for f in sorted(os.listdir(src_dir)) if os.path.isfile(os.path.join(src_dir, f))]

for device_type, config in targets.items():
    out_dir = os.path.join(base_out, device_type)
    os.makedirs(out_dir, exist_ok=True)
    
    for idx, f in enumerate(files, 1):
        in_path = os.path.join(src_dir, f)
        base_name = os.path.splitext(f)[0]
        
        with Image.open(in_path) as im:
            rgb_im = im.convert("RGB")
            w, h = rgb_im.size
            
            # Check aspect ratio
            max_side = max(w, h)
            min_side = min(w, h)
            
            # Play store max aspect ratio is 2:1.
            # If slightly above 2.0 (like 1024x506 which is 2.0237:1), clamp to 2:1 cleanly without blur:
            if max_side / min_side > 2.0:
                if w > h:
                    # Landscape: crop width slightly to make aspect exactly 2.0 (or 16:9)
                    new_w = int(h * 1.99)
                    left = (w - new_w) // 2
                    rgb_im = rgb_im.crop((left, 0, left + new_w, h))
                else:
                    new_h = int(w * 1.99)
                    top = (h - new_h) // 2
                    rgb_im = rgb_im.crop((0, top, w, top + new_h))
                w, h = rgb_im.size
            
            # Now scale up cleanly using Lanczos to sharp high-res store target
            if w == h:
                target_w = config["square_side"]
                target_h = config["square_side"]
            elif h > w:
                target_h = config["portrait_long"]
                target_w = int(round(w * (target_h / h)))
                # ensure even dimensions
                if target_w % 2 != 0: target_w += 1
            else:
                target_w = config["landscape_long"]
                target_h = int(round(h * (target_w / w)))
                if target_h % 2 != 0: target_h += 1
            
            resized = rgb_im.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            out_file = f"{idx:02d}_{base_name}_{target_w}x{target_h}.png"
            out_path = os.path.join(out_dir, out_file)
            resized.save(out_path, format="PNG", optimize=True)
            print(f"[{device_type}] {out_file} (Original: {im.size} -> Resized: {target_w}x{target_h})")

print("Done successfully!")
