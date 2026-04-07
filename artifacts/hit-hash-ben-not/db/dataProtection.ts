import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";

const MIN_FREE_BYTES = 50 * 1024 * 1024;
const MAX_BACKUPS = 5;
const DB_NAME = "hithasbbennot.db";

function getBackupDir(): string {
  return (FileSystem.documentDirectory ?? "") + "HitHashBenNot/Backups/";
}

function getDbPath(): string {
  return (FileSystem.documentDirectory ?? "") + `SQLite/${DB_NAME}`;
}

export async function checkDiskSpace(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const free = await FileSystem.getFreeDiskStorageAsync();
    if (free < MIN_FREE_BYTES) {
      Alert.alert(
        "Low Storage",
        "Your device has less than 50 MB of free space. Please free up storage before saving data.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export async function runIntegrityCheck(
  db: import("expo-sqlite").SQLiteDatabase
): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const row = await db.getFirstAsync<{ integrity_check: string }>(
      "PRAGMA integrity_check"
    );
    return row?.integrity_check === "ok";
  } catch {
    return false;
  }
}

async function ensureBackupDir(): Promise<void> {
  const dir = getBackupDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function listBackups(): Promise<string[]> {
  await ensureBackupDir();
  const dir = getBackupDir();
  const files = await FileSystem.readDirectoryAsync(dir);
  return files
    .filter((f) => f.endsWith(".db"))
    .sort()
    .reverse();
}

async function pruneOldBackups(): Promise<void> {
  const backups = await listBackups();
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    const dir = getBackupDir();
    for (const f of toDelete) {
      await FileSystem.deleteAsync(dir + f, { idempotent: true });
    }
  }
}

export async function takeBackup(label?: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const hasSpace = await checkDiskSpace();
    if (!hasSpace) return null;
    await ensureBackupDir();
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const suffix = label ? `_${label}` : "";
    const destName = `backup_${ts}${suffix}.db`;
    const destPath = getBackupDir() + destName;
    const src = getDbPath();
    const srcInfo = await FileSystem.getInfoAsync(src);
    if (!srcInfo.exists) return null;
    await FileSystem.copyAsync({ from: src, to: destPath });
    const walSrc = src + "-wal";
    const walInfo = await FileSystem.getInfoAsync(walSrc);
    if (walInfo.exists) {
      await FileSystem.copyAsync({ from: walSrc, to: destPath + "-wal" }).catch(() => {});
    }
    await pruneOldBackups();
    return destPath;
  } catch {
    return null;
  }
}

export async function restoreLatestBackup(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const backups = await listBackups();
    if (backups.length === 0) return false;
    const latest = getBackupDir() + backups[0];
    const dest = getDbPath();
    await FileSystem.copyAsync({ from: latest, to: dest });
    return true;
  } catch {
    return false;
  }
}

export async function runForegroundHealthCheck(
  db: import("expo-sqlite").SQLiteDatabase
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const isHealthy = await runIntegrityCheck(db);
    if (isHealthy) {
      await takeBackup();
    } else {
      const restored = await restoreLatestBackup();
      if (restored) {
        Alert.alert(
          "Database Restored",
          "A database issue was detected and your data was automatically restored from the latest backup. Please restart the app.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Database Error",
          "A database integrity issue was detected and no backup was available. Some data may be missing.",
          [{ text: "OK" }]
        );
      }
    }
  } catch {}
}

export async function runPreMigrationBackup(): Promise<string | null> {
  return await takeBackup("pre_migration");
}

export async function runMigrationWithRollback(
  db: import("expo-sqlite").SQLiteDatabase,
  migration: () => Promise<void>
): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      await migration();
      return true;
    } catch {
      return false;
    }
  }
  const backupPath = await runPreMigrationBackup();
  try {
    await db.withTransactionAsync(async () => {
      await migration();
    });
    return true;
  } catch (err) {
    if (backupPath) {
      const dest = getDbPath();
      await FileSystem.copyAsync({ from: backupPath, to: dest }).catch(() => {});
    }
    Alert.alert(
      "Migration Failed",
      "A database update failed. Your data has been automatically restored from the backup.",
      [{ text: "OK" }]
    );
    return false;
  }
}
