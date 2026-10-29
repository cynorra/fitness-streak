# -*- coding: utf-8 -*-
"""Builds the Play Console multi-language listing CSV for DietitianFit (87 locales).
Format: header Language,Title,Short description,Full description; UTF-8 no BOM; CRLF rows;
limits (code points) Title<=30, Short<=80, Full<=4000."""
import csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from content_short import SHORT_TITLES
from content_full_a import FULL_A
from content_full_b import FULL_B

FULL = {**FULL_A, **FULL_B}
BRAND = "DietitianFit"

# Locales without their own full description reuse the nearest translated one (else en-US).
FALLBACK = {
    "es-419": "es-ES", "es-US": "es-ES", "ca": "es-ES", "gl-ES": "es-ES", "eu-ES": "es-ES",
    "fr-CA": "fr-FR", "pt-PT": "pt-BR", "zh-HK": "zh-TW", "sk": "cs-CZ",
    "fa-AE": "fa", "fa-AF": "fa", "fa-IR": "fa", "ms-MY": "ms",
    "be": "ru-RU", "kk": "ru-RU", "ky-KG": "ru-RU", "mk-MK": "bg", "sr": "hr", "sl": "hr",
    "rm": "de-DE",
}
LOCALES = ("af am ar az-AZ be bg bn-BD ca cs-CZ da-DK de-DE el-GR en-AU en-CA en-GB en-IN en-SG en-US en-ZA "
           "es-419 es-ES es-US et eu-ES fa fa-AE fa-AF fa-IR fi-FI fil fr-CA fr-FR gl-ES gu hi-IN hr hu-HU hy-AM "
           "id is-IS it-IT iw-IL ja-JP ka-GE kk km-KH kn-IN ko-KR ky-KG lo-LA lt lv mk-MK ml-IN mn-MN mr-IN ms ms-MY "
           "my-MM ne-NP nl-NL no-NO pa pl-PL pt-BR pt-PT rm ro ru-RU si-LK sk sl sq sr sv-SE sw ta-IN te-IN th tr-TR "
           "uk ur vi zh-CN zh-HK zh-TW zu").split()

def build_full(d):
    parts = [d["intro"]]
    for title, bullets in d["s"]:
        parts.append(title + "\n" + "\n".join("• " + b for b in bullets))
    parts.append(d["close"])
    return "\n\n".join(parts)

rows, errors = [], []
assert len(LOCALES) == 87 and len(set(LOCALES)) == 87
for loc in LOCALES:
    tail, short = SHORT_TITLES[loc]
    title = f"{BRAND}: {tail}"
    src = loc if loc in FULL else FALLBACK.get(loc, "en-US")
    full = build_full(FULL[src])
    for name, val, lim in (("title", title, 30), ("short", short, 80), ("full", full, 4000)):
        if len(val) > lim:
            errors.append(f"[{loc}] {name} {len(val)}>{lim}: {val[:50]}")
    rows.append([loc, title, short, full])

if errors:
    print("\n".join(errors)); sys.exit(1)

out = os.path.join(os.path.dirname(__file__), "..", "..", "store-assets", "play-store-listings-all-languages.csv")
with open(out, "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, lineterminator="\r\n")
    w.writerow(["Language", "Title", "Short description", "Full description"])
    w.writerows(rows)
print("OK", len(rows), "locales ->", os.path.abspath(out))
