import AsyncStorage from "@react-native-async-storage/async-storage";

const RATES_KEY = "@exchange_rates_v1";
const TS_KEY = "@exchange_rates_ts_v1";
const BASE = "EUR";
const API_URL = `https://open.er-api.com/v6/latest/${BASE}`;
const TTL_MS = 24 * 60 * 60 * 1000;

export type ExchangeRates = Record<string, number>;

export async function loadCachedRates(): Promise<ExchangeRates | null> {
  try {
    const raw = await AsyncStorage.getItem(RATES_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExchangeRates;
  } catch {
    return null;
  }
}

export async function getCachedTimestamp(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(TS_KEY);
    if (!raw) return null;
    return Number(raw);
  } catch {
    return null;
  }
}

export async function isRatesStale(): Promise<boolean> {
  const ts = await getCachedTimestamp();
  if (!ts) return true;
  return Date.now() - ts > TTL_MS;
}

export async function fetchAndCacheRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: string; rates?: ExchangeRates };
    if (json.result !== "success" || !json.rates) return null;
    const rates = json.rates;
    await AsyncStorage.setItem(RATES_KEY, JSON.stringify(rates));
    await AsyncStorage.setItem(TS_KEY, String(Date.now()));
    return rates;
  } catch {
    return null;
  }
}

export async function getExchangeRates(forceRefresh = false): Promise<ExchangeRates> {
  const stale = forceRefresh || (await isRatesStale());
  if (stale) {
    const fresh = await fetchAndCacheRates();
    if (fresh) return fresh;
  }
  const cached = await loadCachedRates();
  return cached ?? {};
}

export function getRate(rates: ExchangeRates, from: string, to: string): number | null {
  if (!rates[from] || !rates[to]) return null;
  const fromInBase = 1 / rates[from];
  const toInBase = rates[to];
  return fromInBase * toInBase;
}
