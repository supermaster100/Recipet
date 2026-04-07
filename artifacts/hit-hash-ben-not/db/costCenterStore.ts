import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hhbn_cost_centers";

export interface SavedCostCenter {
  number: string;
  label: string;
}

export async function getSavedCostCenters(): Promise<SavedCostCenter[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCostCenter[];
  } catch {
    return [];
  }
}

export async function saveCostCenter(number: string, label?: string): Promise<void> {
  try {
    const existing = await getSavedCostCenters();
    const idx = existing.findIndex((c) => c.number === number);
    if (idx !== -1) {
      existing[idx] = { number, label: label ?? existing[idx]?.label ?? number };
    } else {
      existing.push({ number, label: label ?? number });
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {}
}

export async function updateCostCenterLabel(number: string, label: string): Promise<void> {
  await saveCostCenter(number, label);
}

export function displayLabel(cc: SavedCostCenter): string {
  return cc.label && cc.label !== cc.number ? `${cc.label} (${cc.number})` : cc.number;
}
