import * as FileSystem from "expo-file-system/legacy";

const PHOTO_DIR = `${FileSystem.documentDirectory}receipts/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export function normalizeUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith("file://") || uri.startsWith("http")) return uri;
  if (uri.startsWith("content://") || uri.startsWith("ph://")) return uri;
  return `file://${uri}`;
}

export async function savePhotoToLocal(sourceUri: string): Promise<string> {
  if (!sourceUri) return "";
  await ensureDir();
  const ext = sourceUri.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "heic", "heif", "webp"].includes(ext) ? ext : "jpg";
  const fileName = `receipt_${Date.now()}.${safeExt}`;
  const dest = `${PHOTO_DIR}${fileName}`;
  const normalizedSource = normalizeUri(sourceUri);
  await FileSystem.copyAsync({ from: normalizedSource, to: dest });
  return dest;
}

export async function deletePhotoFromLocal(path: string): Promise<void> {
  if (!path) return;
  try {
    const normalized = normalizeUri(path);
    const info = await FileSystem.getInfoAsync(normalized);
    if (info.exists) {
      await FileSystem.deleteAsync(normalized, { idempotent: true });
    }
  } catch {
  }
}

export function getPhotoUri(path: string): string {
  if (!path) return "";
  if (path.startsWith("file://") || path.startsWith("http")) return path;
  return `file://${path}`;
}

export async function getAllLocalPhotos(): Promise<string[]> {
  await ensureDir();
  const dir = await FileSystem.readDirectoryAsync(PHOTO_DIR);
  return dir
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .map((f) => `${PHOTO_DIR}${f}`);
}

export async function getImageDate(path: string): Promise<string | null> {
  if (!path) return null;
  try {
    const info = await FileSystem.getInfoAsync(path, { md5: false });
    if (!info.exists) return null;
    const modTime = (info as { modificationTime?: number }).modificationTime;
    if (modTime) {
      return new Date(modTime * 1000).toISOString().split("T")[0] ?? null;
    }
  } catch {
  }
  return null;
}
