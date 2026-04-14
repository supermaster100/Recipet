export type Currency =
  | "ILS" | "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD" | "CNY" | "AED"
  | "UAH" | "CZK" | "HUF" | "DKK" | "NOK" | "SEK" | "PLN" | "RON" | "BGN" | "HRK"
  | "RUB" | "TRY" | "INR" | "SGD" | "NZD" | "BRL" | "MXN" | "ZAR" | "ISK" | "RSD" | "THB";

export type ReceiptType =
  | "HOSTING_CLIENTS"
  | "HOSTING_MYSELF"
  | "HOSTING_TEAMMATES"
  | "HANGING_OUT_CLIENT"
  | "OVERHEAD"
  | "TAXI"
  | "TRAIN"
  | "FLIGHT"
  | "GIFT"
  | "HOTEL";

export const RECEIPT_TYPES: { key: ReceiptType; label: string }[] = [
  { key: "HOSTING_CLIENTS", label: "Hosting Clients" },
  { key: "HOSTING_MYSELF", label: "Hosting Myself" },
  { key: "HOSTING_TEAMMATES", label: "Hosting Teammates" },
  { key: "HANGING_OUT_CLIENT", label: "Hanging Out with Client" },
  { key: "OVERHEAD", label: "Overhead" },
  { key: "TAXI", label: "Taxi" },
  { key: "TRAIN", label: "Train" },
  { key: "FLIGHT", label: "Flight" },
  { key: "GIFT", label: "Gift" },
  { key: "HOTEL", label: "Hotel" },
];

const OLD_TO_NEW_TYPE: Record<string, ReceiptType> = {
  MEALS: "HOSTING_MYSELF",
  ACCOMMODATION: "HOTEL",
  TRANSPORT: "TAXI",
  OFFICE_SUPPLIES: "OVERHEAD",
  ENTERTAINMENT: "HANGING_OUT_CLIENT",
  COMMUNICATION: "OVERHEAD",
  OTHER: "OVERHEAD",
};

export function migrateReceiptType(raw: string): ReceiptType {
  if (RECEIPT_TYPES.some((r) => r.key === raw)) return raw as ReceiptType;
  return OLD_TO_NEW_TYPE[raw] ?? "OVERHEAD";
}

export const CURRENCIES: Currency[] = [
  "ILS", "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "AED",
];

export const EXCHANGE_CURRENCIES: Currency[] = [
  "EUR", "USD", "UAH", "CZK", "HUF", "DKK", "CHF",
  "AED", "AUD", "BGN", "BRL", "CAD", "CNY", "GBP", "HRK", "ILS", "INR",
  "ISK", "JPY", "MXN", "NOK", "NZD", "PLN", "RON", "RSD", "RUB", "SEK",
  "SGD", "THB", "TRY", "ZAR",
];

export interface General {
  id: number;
  workerNumber: string;
  month: number;
  year: number;
}

export interface CostCenter {
  id: number;
  number: string;
  name: string;
}

export function formatCostCenter(c: Pick<CostCenter, "number" | "name"> & { number?: string }): string {
  const num = c.number ?? "";
  if (num && c.name) return `${num} — ${c.name}`;
  return c.name || num || "";
}

export type PaymentMethod = "cash" | "card";

export interface Receipt {
  id: number;
  type: ReceiptType;
  amount: number;
  currency: Currency;
  date: string;
  numberOfPeople: number;
  costCenter: string;
  selfDeclaration: boolean;
  note: string;
  photo: string | null;
  photo_checksum: string | null;
  budget: string;
  status: string;
  export: boolean;
  deleted_at: string | null;
  paymentMethod: PaymentMethod;
}

export type CashWalletEntryType =
  | "initial"
  | "expense_cash"
  | "atm_withdrawal"
  | "money_transfer_in"
  | "client_transfer_out"
  | "manual_adjustment"
  | "exchange_in"
  | "exchange_out";

export interface CashWalletEntry {
  id: number;
  currency: Currency;
  amount: number;
  entryType: CashWalletEntryType;
  refId: number | null;
  refTable: string | null;
  note: string;
  createdAt: string;
}

export interface Exchange {
  id: number;
  date: string;
  amountSpent: number;
  spentCurrency: Currency;
  amountReceived: number;
  receivedCurrency: Currency;
  note: string;
  photo: string | null;
  photo_checksum: string | null;
  status: string;
  export: boolean;
  deleted_at: string | null;
}

export interface ATMWithdrawal {
  id: number;
  date: string;
  cardLastFour: string;
  amount: number;
  currency: Currency;
  photo: string | null;
  createdAt: string;
  deleted_at: string | null;
}

export interface Leg {
  id: number;
  type: string;
  status: string;
  departureDate: string;
  departureHour: string;
  departureCountry: string;
  departureCity: string;
  arrivalDate: string;
  arrivalHour: string;
  arrivalCountry: string;
  arrivalCity: string;
  deleted_at: string | null;
}

export interface Travel {
  id: number;
  lId: number | null;
  num: number;
  departure: string;
  departureDate: string;
  departureHour: string;
  departureCountry: string;
  departureCity: string;
  arrival: string;
  returnDate: string;
  arrivalHour: string;
  arrivalCountry: string;
  arrivalCity: string;
  budget: number;
  placeOfStaying: string;
  nights: number;
  arbitraryLocation: string;
  ratePerNight: number;
  currencyPN: Currency;
  breakfast: boolean;
  paymentMethod: string;
  hotelExtraFees: number;
  currencyHEF: Currency;
  description: string;
  photo: string | null;
  photo_checksum: string | null;
  export: boolean;
  deleted_at: string | null;
}

export interface TrashItem {
  id: number;
  tableSource: "Receipts" | "Exchanges";
  type: string;
  amount: number;
  currency: string;
  date: string;
  deleted_at: string;
  photo: string | null;
}

export interface MoneyTransfer {
  id: number;
  receiptName: string;
  giverName: string;
  workerNumber: string;
  receiverName: string;
  receiverWorkerNumber: string;
  date: string;
  amount: number;
  currency: Currency;
  photo: string | null;
  createdAt: string;
  deleted_at: string | null;
}

export interface ClientTransfer {
  id: number;
  clientName: string;
  giverName: string;
  date: string;
  amount: number;
  currency: Currency;
  photo: string | null;
  createdAt: string;
  deleted_at: string | null;
}
