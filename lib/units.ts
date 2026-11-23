// Unit + timezone helpers. Data is always stored metric (kg, cm, ml) and UTC instants; this only formats for display.
export type Units = 'metric' | 'imperial';

export const kgToLb = (kg: number) => kg * 2.2046226218;
export const lbToKg = (lb: number) => lb / 2.2046226218;
export const cmToIn = (cm: number) => cm / 2.54;
export const mlToFlOz = (ml: number) => ml / 29.5735;

export function formatWeight(kg: number | null | undefined, units: Units = 'metric'): string {
  if (kg == null || isNaN(Number(kg))) return '-';
  return units === 'imperial' ? `${kgToLb(Number(kg)).toFixed(1)} lb` : `${Number(kg).toFixed(1)} kg`;
}

export function formatHeight(cm: number | null | undefined, units: Units = 'metric'): string {
  if (cm == null || isNaN(Number(cm))) return '-';
  if (units === 'metric') return `${Math.round(Number(cm))} cm`;
  const totalIn = Math.round(cmToIn(Number(cm)));
  return `${Math.floor(totalIn / 12)} ft ${totalIn % 12} in`;
}

export function formatWater(ml: number, units: Units = 'metric'): string {
  return units === 'imperial' ? `${Math.round(mlToFlOz(ml))} fl oz` : `${ml} ml`;
}

/** Parse a user-typed weight in the user's unit back to kg for storage. */
export function parseWeightToKg(input: string, units: Units): number | null {
  const n = parseFloat(input.replace(',', '.'));
  if (!isFinite(n) || n <= 0) return null;
  return units === 'imperial' ? lbToKg(n) : n;
}

/** Default unit guess from device locale region (US, LR, MM use imperial). */
export function defaultUnitsForRegion(region?: string | null): Units {
  return region && ['US', 'LR', 'MM'].includes(region.toUpperCase()) ? 'imperial' : 'metric';
}

export const deviceTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/** Render a UTC instant in a specific IANA timezone (e.g. "the dietitian's time"). */
export function formatInZone(iso: string, timeZone: string, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString(locale);
  }
}
