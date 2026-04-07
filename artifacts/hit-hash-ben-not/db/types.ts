export type Currency =
  | "ILS" | "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD" | "CNY" | "AED";

export type ReceiptType =
  | "MEALS"
  | "ACCOMMODATION"
  | "TRANSPORT"
  | "OFFICE_SUPPLIES"
  | "ENTERTAINMENT"
  | "COMMUNICATION"
  | "OTHER";

export const RECEIPT_TYPES: { key: ReceiptType; label: string }[] = [
  { key: "MEALS", label: "Meals & Food" },
  { key: "ACCOMMODATION", label: "Accommodation" },
  { key: "TRANSPORT", label: "Transport" },
  { key: "OFFICE_SUPPLIES", label: "Office Supplies" },
  { key: "ENTERTAINMENT", label: "Entertainment" },
  { key: "COMMUNICATION", label: "Communication" },
  { key: "OTHER", label: "Other" },
];

export const CURRENCIES: Currency[] = [
  "ILS", "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "AED",
];

export interface General {
  id: number;
  workerNumber: string;
  division: string;
  month: number;
  year: number;
  costCenter: string;
}

export interface Budget {
  id: number;
  budgetNumber: number;
  budgetNumberName: string;
}

export interface Receipt {
  id: number;
  type: ReceiptType;
  amount: number;
  currency: Currency;
  date: string;
  numberOfPeople: number;
  division: string;
  costCenter: string;
  selfDeclaration: boolean;
  note: string;
  photo: string | null;
  photo_checksum: string | null;
  budget: string;
  status: string;
  export: boolean;
  deleted_at: string | null;
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
  date: string;
  amount: number;
  currency: Currency;
  photo: string | null;
  createdAt: string;
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
}
