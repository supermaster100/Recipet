import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const PHOTO_ROOT = (FileSystem.documentDirectory ?? "") + "HitHashBenNot/Photos/";
const PHOTO_EXPIRY_DAYS = 90;

export function getCategoryFolderName(type: string): string {
  const map: Record<string, string> = {
    MEALS: "Meals",
    ACCOMMODATION: "Accommodation",
    TRANSPORT: "Transport",
    OFFICE_SUPPLIES: "OfficeSupplies",
    ENTERTAINMENT: "Entertainment",
    COMMUNICATION: "Communication",
    OTHER: "Other",
    EXCHANGE: "Exchange",
    TRAVEL: "Travel",
  };
  return map[type] ?? "Other";
}

export async function savePhotoToOrganizedStorage(
  sourceUri: string,
  category: string
): Promise<string | null> {
  if (Platform.OS === "web") return sourceUri;
  try {
    const hasSpace = await checkDiskSpaceForPhoto();
    if (!hasSpace) return null;
    const folderName = getCategoryFolderName(category);
    const dir = PHOTO_ROOT + folderName + "/";
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    const ext = sourceUri.split(".").pop()?.split("?")[0] ?? "jpg";
    const uuid = generateUUID();
    const destPath = `${dir}${uuid}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });
    return destPath;
  } catch {
    return null;
  }
}

export async function savePhotoToGallery(uri: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const MediaLibrary = await import("expo-media-library").catch(() => null);
    if (!MediaLibrary) return false;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") return false;
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    return false;
  }
}

export async function computeFileChecksum(uri: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const CryptoDigest = await import("expo-crypto").catch(() => null);
    if (!CryptoDigest) return null;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64" as FileSystem.EncodingType,
    });
    const digest = await CryptoDigest.digestStringAsync(
      CryptoDigest.CryptoDigestAlgorithm.SHA256,
      content
    );
    return digest;
  } catch {
    return null;
  }
}

export async function validatePhotoFile(
  uri: string,
  expectedChecksum: string | null
): Promise<"ok" | "missing" | "corrupted"> {
  if (Platform.OS === "web") return "ok";
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return "missing";
    if (!expectedChecksum) return "ok";
    const actual = await computeFileChecksum(uri);
    if (!actual) return "ok";
    return actual === expectedChecksum ? "ok" : "corrupted";
  } catch {
    return "missing";
  }
}

export async function cleanupExpiredPhotos(
  permanentlyDeletedPhotos: Array<{ photo: string | null; deleted_at: string | null }>
): Promise<void> {
  if (Platform.OS === "web") return;
  const cutoff = Date.now() - PHOTO_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  for (const record of permanentlyDeletedPhotos) {
    if (!record.photo) continue;
    const deletedAt = record.deleted_at ? new Date(record.deleted_at).getTime() : 0;
    if (deletedAt > 0 && deletedAt < cutoff && record.photo.includes("HitHashBenNot/Photos/")) {
      await FileSystem.deleteAsync(record.photo, { idempotent: true }).catch(() => {});
    }
  }
}

async function checkDiskSpaceForPhoto(): Promise<boolean> {
  try {
    const MIN_FREE_BYTES = 50 * 1024 * 1024;
    const free = await FileSystem.getFreeDiskStorageAsync();
    return free >= MIN_FREE_BYTES;
  } catch {
    return true;
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
