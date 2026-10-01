/**
 * Food nutrition lookup via free public APIs:
 *  - Open Food Facts (packaged products, incl. Turkish brands) — https://search.openfoodfacts.org
 *  - USDA FoodData Central (generic foods, English) — needs an API key; DEMO_KEY works with low limits.
 * Values are always per 100 g.
 */

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  source: 'off' | 'usda';
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const USER_AGENT = 'VitaTribe/1.0 (support@vitatribe.com)';
const USDA_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const TIMEOUT_MS = 8000;

async function getJson(url: string, headers?: Record<string, string>): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

async function searchOpenFoodFacts(query: string, lang: string): Promise<FoodItem[]> {
  const url =
    `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}` +
    `&page_size=20&langs=${lang}&fields=code,product_name,brands,nutriments`;
  const json = await getJson(url, { 'User-Agent': USER_AGENT });

  const items: FoodItem[] = [];
  for (const hit of json?.hits ?? []) {
    const name = String(hit.product_name ?? '').trim();
    const n = hit.nutriments ?? {};
    const kcal = num(n['energy-kcal_100g']);
    const protein = num(n['proteins_100g']);
    const carbs = num(n['carbohydrates_100g']);
    const fat = num(n['fat_100g']);
    // Community data is noisy: skip entries without a name or a complete macro set.
    if (!name || kcal === null || protein === null || carbs === null || fat === null) continue;
    if (kcal > 900) continue; // physically impossible per 100 g
    items.push({
      id: `off-${hit.code}`,
      name,
      brand: Array.isArray(hit.brands) ? hit.brands.slice(0, 2).join(', ') : undefined,
      source: 'off',
      kcal: Math.round(kcal),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
    });
  }
  return items;
}

async function searchUsda(query: string): Promise<FoodItem[]> {
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}` +
    `&query=${encodeURIComponent(query)}&pageSize=15&dataType=Foundation,SR%20Legacy`;
  const json = await getJson(url);

  const items: FoodItem[] = [];
  for (const food of json?.foods ?? []) {
    const byNumber: Record<string, number> = {};
    for (const fn of food.foodNutrients ?? []) {
      const v = num(fn.value);
      if (v !== null && fn.nutrientNumber) byNumber[String(fn.nutrientNumber)] = v;
    }
    // 208 energy (kcal), 203 protein, 205 carbohydrate, 204 total fat
    const kcal = byNumber['208'];
    const protein = byNumber['203'];
    const carbs = byNumber['205'];
    const fat = byNumber['204'];
    if (!food.description || kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) continue;
    items.push({
      id: `usda-${food.fdcId}`,
      name: String(food.description),
      source: 'usda',
      kcal: Math.round(kcal),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
    });
  }
  return items;
}

/** Searches both providers in parallel. Throws only if BOTH fail (e.g. offline). */
export async function searchFoods(query: string, lang: 'tr' | 'en'): Promise<FoodItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [off, usda] = await Promise.allSettled([searchOpenFoodFacts(q, lang), searchUsda(q)]);
  if (off.status === 'rejected' && usda.status === 'rejected') {
    throw new Error('Network request failed');
  }

  const offItems = off.status === 'fulfilled' ? off.value : [];
  const usdaItems = usda.status === 'fulfilled' ? usda.value : [];

  // Interleave so generic foods (USDA) and packaged products (OFF) both show up near the top.
  const merged: FoodItem[] = [];
  const max = Math.max(offItems.length, usdaItems.length);
  for (let i = 0; i < max; i++) {
    if (usdaItems[i]) merged.push(usdaItems[i]);
    if (offItems[i]) merged.push(offItems[i]);
  }
  return merged.slice(0, 20);
}

export const scaleFood = (food: FoodItem, grams: number) => {
  const f = grams / 100;
  return {
    calories: Math.round(food.kcal * f),
    protein: round1(food.protein * f),
    carbs: round1(food.carbs * f),
    fat: round1(food.fat * f),
  };
};
