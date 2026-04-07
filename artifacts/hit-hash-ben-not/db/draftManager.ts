import AsyncStorage from "@react-native-async-storage/async-storage";

export type DraftKey = "add-expense" | "add-exchange" | "add-travel";

export async function saveDraft<T extends object>(key: DraftKey, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`draft:${key}`, JSON.stringify(data));
  } catch {}
}

export async function loadDraft<T extends object>(key: DraftKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`draft:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearDraft(key: DraftKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(`draft:${key}`);
  } catch {}
}
