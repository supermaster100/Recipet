import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as MailComposer from "expo-mail-composer";
import { Alert, Platform } from "react-native";

import type {
  ATMWithdrawal,
  ClientTransfer,
  Exchange,
  General,
  Leg,
  MoneyTransfer,
  Receipt,
  Travel,
} from "@/db/types";
import {
  ATMDB,
  ClientTransferDB,
  ExchangeDB,
  LegDB,
  MoneyTransferDB,
  ReceiptDB,
  TravelDB,
} from "@/db/database";
import { buildCSV } from "./csvGenerator";
import { buildXLSXBase64 } from "./xlsxGenerator";

const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const TARGET_HIGH_BYTES = 350 * 1024;
const TARGET_LOW_BYTES = 150 * 1024;

export interface ExportData {
  general: General | null;
  legs: Leg[];
  travels: Travel[];
  receipts: Receipt[];
  exchanges: Exchange[];
  atmWithdrawals: ATMWithdrawal[];
  moneyTransfers: MoneyTransfer[];
  clientTransfers: ClientTransfer[];
}

export interface ValidationError {
  message: string;
  screen: string;
}

export function validateExportData(data: ExportData): ValidationError | null {
  if (!data.general || !data.general.workerNumber.trim()) {
    return { message: "General Data is not filled in (Worker Number is required).", screen: "General Data" };
  }
  if (data.receipts.length === 0) {
    return { message: "No expenses found. Please add at least one expense receipt before exporting.", screen: "Expenses" };
  }
  return null;
}

function tripDatesLabel(travels: Travel[], receipts: Receipt[]): string {
  const dates: string[] = [];
  for (const t of travels) {
    if (t.departureDate) dates.push(t.departureDate);
    if (t.returnDate) dates.push(t.returnDate);
  }
  for (const r of receipts) {
    if (r.date) dates.push(r.date);
  }
  if (dates.length === 0) return new Date().toISOString().split("T")[0] ?? "";
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? first! : `${first} to ${last}`;
}

interface PhotoEntry {
  originalUri: string;
  exportName: string;
  attachmentUri: string;
}

function buildPhotoEntries(data: ExportData, cacheDir: string): PhotoEntry[] {
  const entries: PhotoEntry[] = [];
  const seen = new Set<string>();

  function add(uri: string | null, prefix: string, id: number) {
    if (!uri || seen.has(uri)) return;
    seen.add(uri);
    const exportName = `${prefix}_${id}.jpg`;
    entries.push({ originalUri: uri, exportName, attachmentUri: `${cacheDir}${exportName}` });
  }

  for (const r of data.receipts) add(r.photo, "receipt", r.id);
  for (const t of data.travels) add(t.photo, "hotel", t.id);
  for (const x of data.exchanges) add(x.photo, "exchange", x.id);
  for (const a of data.atmWithdrawals) add(a.photo, "atm", a.id);
  for (const m of data.moneyTransfers) add(m.photo, "mtransfer", m.id);
  for (const c of data.clientTransfers) add(c.photo, "ctransfer", c.id);

  return entries;
}

async function compressToFile(originalUri: string, destUri: string, targetBytes: number): Promise<void> {
  const qual = targetBytes <= TARGET_LOW_BYTES ? 0.3 : 0.6;
  const res = await ImageManipulator.manipulateAsync(
    originalUri,
    [{ resize: { width: 1200 } }],
    { compress: qual, format: ImageManipulator.SaveFormat.JPEG }
  );
  await FileSystem.moveAsync({ from: res.uri, to: destUri });
}

async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && "size" in info ? (info.size ?? 0) : 0;
  } catch {
    return 0;
  }
}

export async function runExport(
  data: ExportData,
  recipientEmail: string,
  clearAfter: boolean,
  includePhotos: boolean,
  onProgress: (msg: string) => void,
): Promise<"sent" | "cancelled" | "error"> {
  if (Platform.OS === "web") {
    Alert.alert("Not Supported", "Email export is only available on a real device.");
    return "error";
  }

  const cacheDir = FileSystem.cacheDirectory ?? "";
  const dateTag = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Email Not Available", "No email app is configured on this device.");
      return "error";
    }

    onProgress("Preparing files…");

    const photoEntries = includePhotos ? buildPhotoEntries(data, cacheDir) : [];
    const uriToName = new Map<string, string>(
      photoEntries.map((e) => [e.originalUri, e.exportName])
    );

    if (photoEntries.length > 0) {
      onProgress("Compressing photos (pass 1)…");
      for (const entry of photoEntries) {
        await compressToFile(entry.originalUri, entry.attachmentUri, TARGET_HIGH_BYTES).catch(() => {});
      }

      const sizes = await Promise.all(photoEntries.map((e) => getFileSize(e.attachmentUri)));
      const total = sizes.reduce((a, b) => a + b, 0);

      if (total > MAX_TOTAL_BYTES) {
        onProgress("Compressing photos (pass 2)…");
        for (const entry of photoEntries) {
          await compressToFile(entry.attachmentUri, entry.attachmentUri + ".tmp.jpg", TARGET_LOW_BYTES).catch(() => {});
          await FileSystem.moveAsync({ from: entry.attachmentUri + ".tmp.jpg", to: entry.attachmentUri }).catch(() => {});
        }

        const sizes2 = await Promise.all(photoEntries.map((e) => getFileSize(e.attachmentUri)));
        const total2 = sizes2.reduce((a, b) => a + b, 0);
        if (total2 > MAX_TOTAL_BYTES) {
          Alert.alert(
            "Too Many Photos",
            "Your export exceeds 20 MB even after maximum compression. Please split into two separate exports (e.g., first half and second half of receipts)."
          );
          for (const entry of photoEntries) {
            await FileSystem.deleteAsync(entry.attachmentUri, { idempotent: true }).catch(() => {});
          }
          return "error";
        }
      }
    }

    onProgress("Generating CSV…");
    const csvContent = buildCSV(
      data.general, data.legs, data.travels, data.receipts,
      data.exchanges, data.atmWithdrawals, data.moneyTransfers, data.clientTransfers,
      uriToName
    );

    const csvPath = `${cacheDir}expenses_${dateTag}.csv`;
    await FileSystem.writeAsStringAsync(csvPath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    onProgress("Generating Excel…");
    const xlsxB64 = buildXLSXBase64(
      data.general, data.legs, data.travels, data.receipts,
      data.exchanges, data.atmWithdrawals, data.moneyTransfers, data.clientTransfers,
      uriToName
    );
    const xlsxPath = `${cacheDir}expenses_${dateTag}.xlsx`;
    await FileSystem.writeAsStringAsync(xlsxPath, xlsxB64, { encoding: FileSystem.EncodingType.Base64 });

    onProgress("Opening email…");
    const subject = `Expenses Export – ${tripDatesLabel(data.travels, data.receipts)}`;
    const attachmentPaths = [csvPath, xlsxPath, ...photoEntries.map((e) => e.attachmentUri)];
    const result = await MailComposer.composeAsync({
      recipients: recipientEmail ? [recipientEmail] : [],
      subject,
      body: "Please find the expense report files and receipt photos attached.",
      attachments: attachmentPaths,
    });

    await FileSystem.deleteAsync(csvPath, { idempotent: true }).catch(() => {});
    await FileSystem.deleteAsync(xlsxPath, { idempotent: true }).catch(() => {});
    for (const entry of photoEntries) {
      await FileSystem.deleteAsync(entry.attachmentUri, { idempotent: true }).catch(() => {});
    }

    const wasSent = result.status === MailComposer.MailComposerStatus.SENT;

    if (wasSent && clearAfter) {
      onProgress("Clearing trip data…");
      await clearAllData(data);
    }

    if (result.status === MailComposer.MailComposerStatus.CANCELLED) return "cancelled";
    return "sent";
  } catch (err) {
    console.error("Export error:", err);
    Alert.alert("Export Failed", "Something went wrong during export. Please try again.");
    return "error";
  }
}

async function clearAllData(snapshot: ExportData): Promise<void> {
  const photoUris: string[] = [
    ...snapshot.receipts.map((r) => r.photo).filter(Boolean),
    ...snapshot.travels.map((t) => t.photo).filter(Boolean),
    ...snapshot.exchanges.map((x) => x.photo).filter(Boolean),
    ...snapshot.atmWithdrawals.map((a) => a.photo).filter(Boolean),
    ...snapshot.moneyTransfers.map((m) => m.photo).filter(Boolean),
    ...snapshot.clientTransfers.map((c) => c.photo).filter(Boolean),
  ] as string[];

  for (const r of snapshot.receipts) await ReceiptDB.softDelete(r.id).catch(() => {});
  for (const x of snapshot.exchanges) await ExchangeDB.softDelete(x.id).catch(() => {});
  for (const t of snapshot.travels) await TravelDB.softDelete(t.id).catch(() => {});
  for (const l of snapshot.legs) await LegDB.softDelete(l.id).catch(() => {});
  for (const a of snapshot.atmWithdrawals) await ATMDB.delete(a.id).catch(() => {});
  for (const m of snapshot.moneyTransfers) await MoneyTransferDB.delete(m.id).catch(() => {});
  for (const c of snapshot.clientTransfers) await ClientTransferDB.delete(c.id).catch(() => {});

  for (const uri of photoUris) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }
}
