# -*- coding: utf-8 -*-
import csv
import part_1
import part_2
import part_3
import generate_listings_csv_37_backup as base_37

seen = set()
languages = []

for l in base_37.languages:
    if l['locale'] not in seen:
        seen.add(l['locale'])
        languages.append(l)

for p in (part_1.part_1 + part_2.part_2 + part_3.part_3):
    if p['locale'] not in seen:
        seen.add(p['locale'])
        languages.append(p)

out_file = r"store-assets\play-store-listings-all-languages.csv"
fieldnames = ["locale", "language_name", "title", "short_description", "full_description"]

max_title = 30
max_short = 80
max_full = 4000

for item in languages:
    locale = item["locale"]
    title = item["title"]
    short = item["short_description"]
    full = item["full_description"]
    if len(title) > max_title:
        raise ValueError(f"[{locale}] Title length {len(title)} > {max_title}: {title}")
    if len(short) > max_short:
        raise ValueError(f"[{locale}] Short description length {len(short)} > {max_short}: {short}")
    if len(full) > max_full:
        raise ValueError(f"[{locale}] Full description length {len(full)} > {max_full}")

with open(out_file, mode="w", encoding="utf-8-sig", newline="") as f_out:
    writer = csv.DictWriter(f_out, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    for row in languages:
        writer.writerow(row)

print(f"Updated and verified! Total languages: {len(languages)}")
