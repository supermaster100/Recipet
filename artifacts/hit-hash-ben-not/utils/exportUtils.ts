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
  if (data.receipts.length === 0 && data.travels.length === 0) {
    return { message: "No expenses found. Please add at least one expense or hotel night.", screen: "Expenses / Trip" };
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

async function compressPhoto(uri: string, targetBytes: number): Promise<string> {
  const qual = targetBytes <= TARGET_LOW_BYTES ? 0.3 : 0.6;
  const res = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: qual, format: ImageManipulator.SaveFormat.JPEG }
  );
  return res.uri;
}

async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && "size" in info ? (info.size ?? 0) : 0;
  } catch {
    return 0;
  }
}

function allPhotos(data: ExportData): string[] {
  const paths: string[] = [];
  for (const r of data.receipts) if (r.photo) paths.push(r.photo);
  for (const t of data.travels) if (t.photo) paths.push(t.photo);
  for (const x of data.exchanges) if (x.photo) paths.push(x.photo);
  for (const a of data.atmWithdrawals) if (a.photo) paths.push(a.photo);
  for (const m of data.moneyTransfers) if (m.photo) paths.push(m.photo);
  for (const c of data.clientTransfers) if (c.photo) paths.push(c.photo);
  return paths;
}

export async function runExport(
  data: ExportData,
  recipientEmail: string,
  clearAfter: boolean,
  onProgress: (msg: string) => void,
): Promise<"sent" | "cancelled" | "error"> {
  if (Platform.OS === "web") {
    Alert.alert("Not Supported", "Email export is only available on a real device.");
    return "error";
  }

  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Email Not Available", "No email app is configured on this device.");
      return "error";
    }

    onProgress("Preparing files…");

    const photos = allPhotos(data);
    const compressedUris: string[] = [];

    if (photos.length > 0) {
      onProgress("Compressing photos (pass 1)…");
      for (const p of photos) {
        const compressed = await compressPhoto(p, TARGET_HIGH_BYTES).catch(() => p);
        compressedUris.push(compressed);
      }

      const sizes = await Promise.all(compressedUris.map((u) => getFileSize(u)));
      const total = sizes.reduce((a, b) => a + b, 0);

      if (total > MAX_TOTAL_BYTES) {
        onProgress("Compressing photos (pass 2)…");
        const recompressed: string[] = [];
        for (const u of compressedUris) {
          const r = await compressPhoto(u, TARGET_LOW_BYTES).catch(() => u);
          recompressed.push(r);
        }
        compressedUris.splice(0, compressedUris.length, ...recompressed);

        const sizes2 = await Promise.all(compressedUris.map((u) => getFileSize(u)));
        const total2 = sizes2.reduce((a, b) => a + b, 0);
        if (total2 > MAX_TOTAL_BYTES) {
          Alert.alert(
            "Too Many Photos",
            "Your export exceeds 20 MB even after maximum compression. Please split into two separate exports (e.g., first half and second half of receipts)."
          );
          return "error";
        }
      }
    }

    onProgress("Generating CSV…");
    const csvContent = buildCSV(
      data.general, data.legs, data.travels, data.receipts,
      data.exchanges, data.atmWithdrawals, data.moneyTransfers, data.clientTransfers
    );

    const cacheDir = FileSystem.cacheDirectory ?? "";
    const dateTag = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const csvPath = `${cacheDir}expenses_${dateTag}.csv`;
    await FileSystem.writeAsStringAsync(csvPath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    onProgress("Generating Excel…");
    const xlsxB64 = buildXLSXBase64(
      data.general, data.legs, data.travels, data.receipts,
      data.exchanges, data.atmWithdrawals, data.moneyTransfers, data.clientTransfers
    );
    const xlsxPath = `${cacheDir}expenses_${dateTag}.xlsx`;
    await FileSystem.writeAsStringAsync(xlsxPath, xlsxB64, { encoding: FileSystem.EncodingType.Base64 });

    onProgress("Opening email…");
    const subject = `Expenses Export – ${tripDatesLabel(data.travels, data.receipts)}`;
    const result = await MailComposer.composeAsync({
      recipients: recipientEmail ? [recipientEmail] : [],
      subject,
      body: "Please find the expense report files and receipt photos attached.",
      attachments: [csvPath, xlsxPath, ...compressedUris],
    });

    await FileSystem.deleteAsync(csvPath, { idempotent: true }).catch(() => {});
    await FileSystem.deleteAsync(xlsxPath, { idempotent: true }).catch(() => {});

    if (result.status === MailComposer.MailComposerStatus.SENT && clearAfter) {
      onProgress("Clearing trip data…");
      await clearAllData();
    }

    return result.status === MailComposer.MailComposerStatus.SENT ? "sent"
      : result.status === MailComposer.MailComposerStatus.CANCELLED ? "cancelled"
      : "sent";
  } catch (err) {
    console.error("Export error:", err);
    Alert.alert("Export Failed", "Something went wrong during export. Please try again.");
    return "error";
  }
}

async function clearAllData(): Promise<void> {
  const receipts = await ReceiptDB.getAll();
  for (const r of receipts) await ReceiptDB.softDelete(r.id).catch(() => {});

  const exchanges = await ExchangeDB.getAll();
  for (const x of exchanges) await ExchangeDB.softDelete(x.id).catch(() => {});

  const travels = await TravelDB.getAll();
  for (const t of travels) {
    if (t.deleted_at === null) {
      await TravelDB.softDelete(t.id).catch(() => {});
    }
  }

  const legs = await LegDB.getAll();
  for (const l of legs) await LegDB.softDelete(l.id).catch(() => {});

  const atm = await ATMDB.getAll();
  for (const a of atm) await ATMDB.delete(a.id).catch(() => {});

  const moneyTransfers = await MoneyTransferDB.getAll();
  for (const m of moneyTransfers) await MoneyTransferDB.delete(m.id).catch(() => {});

  const clientTransfers = await ClientTransferDB.getAll();
  for (const c of clientTransfers) await ClientTransferDB.delete(c.id).catch(() => {});
}
