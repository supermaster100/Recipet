import * as FileSystem from "expo-file-system/legacy";

const PHOTO_DIR = `${FileSystem.documentDirectory}receipts/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function savePhotoToLocal(sourceUri: string): Promise<string> {
  if (!sourceUri) return "";
  await ensureDir();
  const ext = sourceUri.split(".").pop()?.split("?")[0] ?? "jpg";
  const fileName = `receipt_${Date.now()}.${ext}`;
  const dest = `${PHOTO_DIR}${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function deletePhotoFromLocal(path: string): Promise<void> {
  if (!path) return;
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
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
