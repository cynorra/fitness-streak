/**
 * Turns the free-text meals of a nutrition plan into a shopping list grouped by market aisle.
 * Heuristic (keyword based, Turkish + English): good enough to save typing, not a nutrition database.
 */

export type ShoppingItem = { name: string; quantity: string };
export type ShoppingGroup = { category: CategoryId; items: ShoppingItem[] };
export type CategoryId = 'protein' | 'dairy' | 'produce' | 'grains' | 'nuts' | 'other';

const CATEGORY_KEYWORDS: Record<Exclude<CategoryId, 'other'>, string[]> = {
  protein: ['tavuk', 'hindi', 'somon', 'levrek', 'balık', 'balik', 'ton ', 'ton$', 'köfte', 'kofte', 'bonfile', 'dana', 'kıyma', 'kiyma', 'et ', 'whey', 'protein tozu', 'chicken', 'turkey', 'salmon', 'fish', 'tuna', 'beef', 'steak', 'meatball', 'shrimp', 'karides'],
  dairy: ['yumurta', 'süt', 'sut', 'yoğurt', 'yogurt', 'peynir', 'lor', 'kefir', 'cacık', 'cacik', 'ayran', 'egg', 'milk', 'cheese', 'cottage', 'tereyağı'],
  produce: ['domates', 'salatalık', 'salatalik', 'brokoli', 'avokado', 'elma', 'muz', 'roka', 'ıspanak', 'ispanak', 'kuşkonmaz', 'kuskonmaz', 'karnabahar', 'salata', 'patates', 'biber', 'havuç', 'havuc', 'limon', 'mantar', 'kabak', 'marul', 'maydanoz', 'portakal', 'çilek', 'cilek', 'meyve', 'sebze', 'yeşillik', 'yesillik', 'tomato', 'cucumber', 'broccoli', 'avocado', 'apple', 'banana', 'arugula', 'spinach', 'asparagus', 'cauliflower', 'salad', 'potato', 'pepper', 'carrot', 'lemon', 'mushroom', 'zucchini', 'lettuce', 'berries', 'fruit', 'veggies', 'vegetable', 'greens'],
  grains: ['yulaf', 'pirinç', 'pirinc', 'bulgur', 'ekmek', 'makarna', 'mercimek', 'nohut', 'fasulye', 'kinoa', 'tahıl', 'tahil', 'oat', 'rice', 'bread', 'pasta', 'lentil', 'chickpea', 'bean', 'quinoa', 'toast', 'tortilla', 'granola'],
  nuts: ['ceviz', 'badem', 'fındık', 'findik', 'kaju', 'kabak çekirdeği', 'çekirdek', 'cekirdek', 'zeytin', 'zeytinyağı', 'zeytinyagi', 'fıstık', 'fistik', 'tahin', 'nut', 'almond', 'walnut', 'seed', 'olive', 'peanut', 'peanut butter'],
};

// Order matters: first match wins ("zeytinyağlı salata" must land in produce, not nuts/oils).
const CATEGORY_ORDER: Exclude<CategoryId, 'other'>[] = ['protein', 'dairy', 'produce', 'nuts', 'grains'];

// Very short keywords must match a whole word ("et" must not match "omlet").
const WHOLE_WORD_ONLY = new Set(['et', 'ton', 'lor', 'nut', 'seed']);

const UNITS = '(?:kg|g|gr|gram|ml|lt|l|adet|dilim|ölçek|olcek|avuç|avuc|kase|tabak|fincan|bardak|yemek kaşığı|tatlı kaşığı|çay kaşığı|paket|cup|cups|tbsp|tsp|slice|slices|pcs|piece|pieces|scoop|scoops|handful|bowl|glass)';
// (?=\s|$) instead of \b: JS word boundaries are ASCII-only and break on units like "avuç".
const QTY_RE = new RegExp(`^(yarım|yarim|half)?\\s*(\\d+(?:[.,]\\d+)?)?\\s*(${UNITS})?(?=\\s|$)\\s*(?:of\\s+)?`, 'i');
const FILLER_RE = /^(bol|taze|sade|az|biraz|küçük|büyük|orta|tam|haşlanmış|ızgara|fırında|buğulama|süzme|a|some|fresh|plain|grilled|boiled|baked|steamed)\s+/i;

function categorize(name: string): CategoryId {
  const text = name.toLocaleLowerCase('tr');
  const words = text.split(/\s+/);
  for (const cat of CATEGORY_ORDER) {
    const hit = CATEGORY_KEYWORDS[cat].some((raw) => {
      const k = raw.replace(/\$$/, '').trim();
      if (k.includes(' ')) return text.includes(k);
      // Stems match word starts (tavuk → tavuğu not needed; "yeşillikli" starts with "yeşillik").
      return words.some((w) => (WHOLE_WORD_ONLY.has(k) ? w === k : w.startsWith(k)));
    });
    if (hit) return cat;
  }
  return 'other';
}

function parseToken(raw: string): { name: string; qty: number | null; unit: string } | null {
  let token = raw.trim().replace(/^[-•*\d]+\.\s+/, '').replace(/[.:]+$/, '').trim();
  if (token.length < 2) return null;

  const m = token.match(QTY_RE);
  let qty: number | null = null;
  let unit = '';
  if (m) {
    if (m[2]) qty = parseFloat(m[2].replace(',', '.'));
    else if (m[1]) qty = 0.5;
    if (m[3]) unit = m[3].toLowerCase();
    token = token.slice(m[0].length);
  }
  // Drop leading descriptors ("bol", "taze", ...) up to a few times.
  for (let i = 0; i < 2; i++) token = token.replace(FILLER_RE, '');
  token = token.replace(/\s+/g, ' ').trim();
  if (token.length < 2) return null;
  // Skip prep/instruction-only fragments.
  if (/^(ile|with|and|ve|veya|or)$/i.test(token)) return null;
  return { name: token.charAt(0).toLocaleUpperCase('tr') + token.slice(1), qty, unit };
}

const normUnit = (u: string) => (['gr', 'gram'].includes(u) ? 'g' : ['lt'].includes(u) ? 'l' : u);

export function buildShoppingList(mealContents: string[]): ShoppingGroup[] {
  type Agg = { name: string; sums: Map<string, number>; count: number };
  const byKey = new Map<string, Agg>();

  for (const content of mealContents) {
    const cleaned = content
      .replace(/\([^)]*\)/g, ' ') // "(2 tam, 1 beyaz)" would otherwise be split into bogus items
      .replace(/\s+(ile|with)\s+/gi, ',')
      .replace(/\s+(ve|and)\s+/gi, ',')
      .replace(/\s+\+\s+/g, ',');
    for (const raw of cleaned.split(/[,\n;/]+/)) {
      const item = parseToken(raw);
      if (!item) continue;
      const key = item.name.toLocaleLowerCase('tr');
      const agg = byKey.get(key) || { name: item.name, sums: new Map<string, number>(), count: 0 };
      agg.count += 1;
      if (item.qty !== null) {
        const u = normUnit(item.unit);
        agg.sums.set(u, (agg.sums.get(u) || 0) + item.qty);
      }
      byKey.set(key, agg);
    }
  }

  const groups = new Map<CategoryId, ShoppingItem[]>();
  for (const agg of byKey.values()) {
    const fmt = (q: number) => (q === 0.5 ? '½' : String(Math.round(q * 10) / 10));
    const parts = [...agg.sums.entries()].map(([u, q]) => `${fmt(q)}${u ? (u.length <= 2 ? '' : ' ') + u : ''}`);
    const quantity = parts.length ? parts.join(' + ') : agg.count > 1 ? `×${agg.count}` : '';
    const cat = categorize(agg.name);
    groups.set(cat, [...(groups.get(cat) || []), { name: agg.name, quantity }]);
  }

  const order: CategoryId[] = ['produce', 'protein', 'dairy', 'grains', 'nuts', 'other'];
  return order
    .filter((c) => groups.has(c))
    .map((c) => ({ category: c, items: groups.get(c)!.sort((a, b) => a.name.localeCompare(b.name, 'tr')) }));
}
