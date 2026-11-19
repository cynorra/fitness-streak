# -*- coding: utf-8 -*-
"""Builds the Play Console multi-language listing CSV for DietitianFit (87 locales).
Order and locales match the exact Google Play format from ezanvakti reference file.
Header: Language,Title,Short description,Full description
UTF-8 no BOM; CRLF rows;
Limits: Title<=30, Short<=80, Full<=4000."""
import csv, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from content_short import SHORT_TITLES
from content_full_a import FULL_A
from content_full_b import FULL_B
from content_full_c import FULL_C

FULL = {**FULL_A, **FULL_B, **FULL_C}
BRAND = "DietitianFit"

# Regional variants mapped to the exact base language standard
FALLBACK = {
    "en-AU": "en-US", "en-CA": "en-US", "en-GB": "en-US", "en-IN": "en-US", "en-SG": "en-US", "en-ZA": "en-US",
    "es-419": "es-ES", "es-US": "es-ES",
    "fr-CA": "fr-FR",
    "pt-PT": "pt-BR",
    "zh-HK": "zh-TW",
    "ms-MY": "ms",
    "fa-AE": "fa", "fa-AF": "fa", "fa-IR": "fa",
}

# Exact order from ezanvakti-pro-hatim reference CSV (starts with primary default en-US, then alphabetical)
EZAN_REFERENCE_ORDER = [
    "en-US", "af", "am", "ar", "az-AZ", "be", "bg", "bn-BD", "ca", "cs-CZ",
    "da-DK", "de-DE", "el-GR", "en-AU", "en-CA", "en-GB", "en-IN", "en-SG", "en-ZA",
    "es-419", "es-ES", "es-US", "et", "eu-ES", "fa", "fa-AE", "fa-AF", "fa-IR",
    "fi-FI", "fil", "fr-CA", "fr-FR", "gl-ES", "gu", "hi-IN", "hr", "hu-HU",
    "hy-AM", "id", "is-IS", "it-IT", "iw-IL", "ja-JP", "ka-GE", "kk", "km-KH",
    "kn-IN", "ko-KR", "ky-KG", "lo-LA", "lt", "lv", "mk-MK", "ml-IN", "mn-MN",
    "mr-IN", "ms", "ms-MY", "my-MM", "ne-NP", "nl-NL", "no-NO", "pa", "pl-PL",
    "pt-BR", "pt-PT", "rm", "ro", "ru-RU", "si-LK", "sk", "sl", "sq", "sr",
    "sv-SE", "sw", "ta-IN", "te-IN", "th", "tr-TR", "uk", "ur", "vi", "zh-CN",
    "zh-HK", "zh-TW", "zu"
]

def build_full(d):
    parts = [d["intro"]]
    for title, bullets in d["s"]:
        parts.append(title + "\n" + "\n".join("• " + b for b in bullets))
    parts.append(d["close"])
    return "\n\n".join(parts)

def generate():
    rows = []
    errors = []
    assert len(EZAN_REFERENCE_ORDER) == 87
    assert len(set(EZAN_REFERENCE_ORDER)) == 87

    for loc in EZAN_REFERENCE_ORDER:
        if loc not in SHORT_TITLES:
            errors.append(f"Missing in SHORT_TITLES: {loc}")
            continue

        tail, short = SHORT_TITLES[loc]
        title = f"{BRAND}: {tail}"

        src = loc if loc in FULL else FALLBACK.get(loc)
        if not src or src not in FULL:
            errors.append(f"Missing FULL translation or fallback for: {loc}")
            continue

        full = build_full(FULL[src])

        # Verification of limits
        for name, val, lim in (("title", title, 30), ("short", short, 80), ("full", full, 4000)):
            if len(val) > lim:
                errors.append(f"[{loc}] {name} length {len(val)} > {lim}: {val[:60]}")

        rows.append([loc, title, short, full])

    if errors:
        print(f"FAILED with {len(errors)} errors:")
        for err in errors:
            print(" -", err)
        sys.exit(1)

    out_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "store-assets", "play-store-listings-all-languages.csv"),
        os.path.join(os.path.dirname(__file__), "..", "..", "store-assets", "google_play_exact_match_all.csv")
    ]

    for out in out_paths:
        with open(out, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, lineterminator="\r\n")
            w.writerow(["Language", "Title", "Short description", "Full description"])
            w.writerows(rows)
        print("OK", len(rows), "locales written ->", os.path.abspath(out))

if __name__ == "__main__":
    generate()
