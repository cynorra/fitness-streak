# Play Store & Marketing — 87 Languages Listing Documentation

This repository and project maintain an 87-language store listing catalog, ensuring full international coverage on the Google Play Store.

## Key Files:
- `store-assets/play-store-listings-all-languages.csv`: UTF-8 BOM CSV containing all 87 locales, titles, short descriptions, and full descriptions.
- `generate_listings_csv.py`: Master compilation script that ensures all constraints pass.
- `part_1.py`, `part_2.py`, `part_3.py`: Modular regional language definitions.

## Google Play Validation Rules:
1. **Title**: <= 30 characters
2. **Short Description**: <= 80 characters
3. **Full Description**: <= 4000 characters

## Supported Locales (87 Total):
`en-US`, `tr-TR`, `es-ES`, `de-DE`, `fr-FR`, `pt-BR`, `it-IT`, `ru-RU`, `ar`, `ja-JP`, `ko-KR`, `es-419`, `es-US`, `pt-PT`, `fr-CA`, `zh-CN`, `zh-TW`, `zh-HK`, `hi-IN`, `id`, `nl-NL`, `pl-PL`, `sv-SE`, `uk`, `vi`, `th`, `el-GR`, `cs-CZ`, `hu-HU`, `ro`, `fi-FI`, `da-DK`, `no-NO`, `en-GB`, `en-CA`, `en-AU`, `en-IN`, `af`, `am`, `sq`, `az-AZ`, `eu-ES`, `be`, `bn-BD`, `my-MM`, `bg`, `hy-AM`, `et`, `fa`, `fa-AE`, `fa-AF`, `fa-IR`, `fil`, `gl-ES`, `gu`, `ka-GE`, `hr`, `kn-IN`, `ca`, `kk`, `km-KH`, `ky-KG`, `lo-LA`, `lv`, `lt`, `mk-MK`, `ml-IN`, `ms`, `ms-MY`, `mr-IN`, `mn-MN`, `ne-NP`, `pa`, `rm`, `si-LK`, `sk`, `sl`, `sw`, `sr`, `ta-IN`, `te-IN`, `ur`, `zu`, `iw-IL`, `is-IS`, `en-SG`, `en-ZA`.
