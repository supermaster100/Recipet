import { Platform } from "react-native";
import type { Currency } from "@/db/types";

export interface LineItem {
  description: string;
  amount: number | null;
}

export interface OcrResult {
  rawText: string;
  detectedCurrency: Currency | null;
  detectedAmount: number | null;
  detectedDate: string | null;
  detectedLanguage: string | null;
  detectedMerchant: string | null;
  lineItems: LineItem[];
  confidence: "high" | "medium" | "low";
}

export async function extractTextFromImage(imageUri: string): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("OCR is not supported on web. Please enter details manually.");
  }

  try {
    const TextRecognition = (await import("@react-native-ml-kit/text-recognition")).default;
    const result = await TextRecognition.recognize(imageUri);
    return result.text ?? "";
  } catch {
    throw new Error("Could not read text from image. Please enter details manually.");
  }
}

const CURRENCY_SYMBOL_MAP: { pattern: RegExp; currency: Currency }[] = [
  { pattern: /₪|NIS\b|ILS\b/i, currency: "ILS" },
  { pattern: /€|EUR\b/i, currency: "EUR" },
  { pattern: /£|GBP\b/i, currency: "GBP" },
  { pattern: /CHF\b/, currency: "CHF" },
  { pattern: /\$C|CAD\b|C\$/, currency: "CAD" },
  { pattern: /\$A|AUD\b|A\$/, currency: "AUD" },
  { pattern: /CNY\b|RMB\b|元/, currency: "CNY" },
  { pattern: /AED\b|د\.إ|DH\b/i, currency: "AED" },
  { pattern: /₴|UAH\b/i, currency: "UAH" },
  { pattern: /Kč|CZK\b/i, currency: "CZK" },
  { pattern: /Ft\b|HUF\b/i, currency: "HUF" },
  { pattern: /DKK\b/, currency: "DKK" },
  { pattern: /NOK\b/, currency: "NOK" },
  { pattern: /SEK\b/, currency: "SEK" },
  { pattern: /zł|PLN\b/i, currency: "PLN" },
  { pattern: /RON\b|lei\b/i, currency: "RON" },
  { pattern: /лв|BGN\b/i, currency: "BGN" },
  { pattern: /kn\b|HRK\b/i, currency: "HRK" },
  { pattern: /₽|RUB\b/i, currency: "RUB" },
  { pattern: /₺|TRY\b/i, currency: "TRY" },
  { pattern: /₹|INR\b/i, currency: "INR" },
  { pattern: /S\$|SGD\b/, currency: "SGD" },
  { pattern: /NZ\$|NZD\b/, currency: "NZD" },
  { pattern: /R\$|BRL\b/, currency: "BRL" },
  { pattern: /MX\$|MXN\b/, currency: "MXN" },
  { pattern: /ZAR\b/, currency: "ZAR" },
  { pattern: /ISK\b/, currency: "ISK" },
  { pattern: /RSD\b|din\b/i, currency: "RSD" },
  { pattern: /฿|THB\b/i, currency: "THB" },
  { pattern: /¥|JPY\b/i, currency: "JPY" },
  { pattern: /\$(?!\s*[A-Z])/, currency: "USD" },
];

export function detectCurrencyFromText(text: string): Currency | null {
  for (const { pattern, currency } of CURRENCY_SYMBOL_MAP) {
    if (pattern.test(text)) {
      return currency;
    }
  }
  return null;
}

const TOTAL_LINE_PATTERNS = [
  /(?:grand\s+total|total\s+due|amount\s+due|total\s+amount|לתשלום|סה"כ|סה״כ|to\s+pay|sum\s+total|net\s+total)\s*[:\-]?\s*([0-9]+[.,][0-9]{1,2})/gi,
  /(?:total|סך\s+הכל)\s*[:\-]?\s*([0-9]+[.,][0-9]{1,2})/gi,
  /([0-9]{1,6}[.,][0-9]{2})\s*(?:₪|\$|€|£|₽|₺|฿|₴|₹|CHF|USD|EUR|GBP|ILS|TRY|RUB|UAH|INR)/g,
  /(?:₪|\$|€|£|₽|₺|฿|₴|₹)\s*([0-9]{1,6}[.,][0-9]{2})/g,
];

export function detectAmountFromText(text: string): number | null {
  const candidates: { val: number; priority: number }[] = [];

  TOTAL_LINE_PATTERNS.forEach((pattern, idx) => {
    const priority = TOTAL_LINE_PATTERNS.length - idx;
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null) {
      const raw = (match[1] ?? "").replace(",", ".");
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0 && val < 1_000_000) {
        candidates.push({ val, priority });
      }
    }
  });

  if (candidates.length === 0) {
    const allNumbers = [...text.matchAll(/\b([0-9]{1,6}[.,][0-9]{2})\b/g)]
      .map((m) => parseFloat((m[1] ?? "").replace(",", ".")))
      .filter((n) => !isNaN(n) && n > 0);
    if (allNumbers.length > 0) {
      return Math.max(...allNumbers);
    }
    return null;
  }

  candidates.sort((a, b) => b.priority - a.priority || b.val - a.val);
  return candidates[0]?.val ?? null;
}

export function detectDateFromText(text: string): string | null {
  const patterns: { re: RegExp; order: "dmy" | "ymd" | "mdy" }[] = [
    { re: /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/, order: "ymd" },
    { re: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/, order: "dmy" },
    { re: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/, order: "dmy" },
  ];

  for (const { re, order } of patterns) {
    const match = re.exec(text);
    if (!match) continue;
    const g1 = match[1] ?? "";
    const g2 = match[2] ?? "";
    const g3 = match[3] ?? "";

    let year: number, month: number, day: number;

    if (order === "ymd") {
      year = parseInt(g1);
      month = parseInt(g2);
      day = parseInt(g3);
    } else {
      day = parseInt(g1);
      month = parseInt(g2);
      const rawYear = parseInt(g3);
      year = g3.length === 2 ? (rawYear < 50 ? 2000 + rawYear : 1900 + rawYear) : rawYear;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    if (year < 2000 || year > 2100) continue;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

export function detectMerchantFromText(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const SKIP_PATTERNS = [
    /^\d+$/,
    /^(receipt|חשבונית|קבלה|invoice|bill|order|tax|vat|מע"מ)/i,
    /^(date|תאריך|time|שעה|no\.|מספר|ref|phone|tel|fax)/i,
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/,
    /^[+\-\*\/=]+$/,
  ];

  for (const line of lines.slice(0, 6)) {
    const skip = SKIP_PATTERNS.some((p) => p.test(line));
    if (!skip && line.length >= 2 && line.length <= 60) {
      const cleaned = line.replace(/[^a-zA-Z\u0590-\u05FF\u0600-\u06FF\s&''.,\-]/g, "").trim();
      if (cleaned.length >= 2) return cleaned;
    }
  }
  return null;
}

export function extractLineItems(text: string): LineItem[] {
  const items: LineItem[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const TOTAL_INDICATOR = /(?:total|subtotal|tax|vat|discount|tip|מע"מ|סה"כ|הנחה|שרות)/i;

  for (const line of lines) {
    if (TOTAL_INDICATOR.test(line)) continue;
    const amountMatch = line.match(/([0-9]+[.,][0-9]{1,2})\s*$/) ?? line.match(/^\s*([0-9]+[.,][0-9]{1,2})/);
    if (amountMatch) {
      const amount = parseFloat((amountMatch[1] ?? "").replace(",", "."));
      const description = line
        .replace(amountMatch[0], "")
        .replace(/[x×]\s*\d+(\.\d+)?/i, "")
        .trim();
      if (description.length > 0 && !isNaN(amount) && amount > 0) {
        items.push({ description, amount });
      }
    }
  }

  return items.slice(0, 10);
}

function detectScriptLanguage(text: string): string | null {
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return null;
}

const LANGUAGE_CURRENCY_MAP: Record<string, Currency> = {
  he: "ILS",
  ar: "AED",
  ja: "JPY",
  zh: "CNY",
  ru: "RUB",
  uk: "UAH",
  th: "THB",
  hi: "INR",
};

export function getCurrencyFromLanguage(langCode: string | null): Currency | null {
  if (!langCode) return null;
  return LANGUAGE_CURRENCY_MAP[langCode] ?? null;
}

export async function analyzeReceiptImage(imageUri: string): Promise<OcrResult> {
  let rawText = "";
  let confidence: "high" | "medium" | "low" = "low";

  try {
    rawText = await extractTextFromImage(imageUri);
  } catch {
    return {
      rawText: "",
      detectedCurrency: null,
      detectedAmount: null,
      detectedDate: null,
      detectedLanguage: null,
      detectedMerchant: null,
      lineItems: [],
      confidence: "low",
    };
  }

  const currencyFromText = detectCurrencyFromText(rawText);
  const amount = detectAmountFromText(rawText);
  const date = detectDateFromText(rawText);
  const langCode = detectScriptLanguage(rawText);
  const merchant = detectMerchantFromText(rawText);
  const lineItems = extractLineItems(rawText);

  const currencyFromLang = getCurrencyFromLanguage(langCode);
  const detectedCurrency = currencyFromText ?? currencyFromLang ?? null;

  if (detectedCurrency && amount) {
    confidence = "high";
  } else if (detectedCurrency || amount) {
    confidence = "medium";
  }

  return {
    rawText,
    detectedCurrency,
    detectedAmount: amount,
    detectedDate: date,
    detectedLanguage: langCode,
    detectedMerchant: merchant,
    lineItems,
    confidence,
  };
}
