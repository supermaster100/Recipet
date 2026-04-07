export type Currency = "ILS" | "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "CAD" | "AUD" | "CNY" | "AED";

export type ExpenseCategory =
  | "MEALS"
  | "ACCOMMODATION"
  | "TRANSPORT"
  | "OFFICE_SUPPLIES"
  | "ENTERTAINMENT"
  | "COMMUNICATION"
  | "OTHER";

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string }[] = [
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

export interface GeneralExpense {
  id: number;
  date: string;
  month: number;
  year: number;
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  division: string;
  costCenter: string;
  notes: string;
  receiptPath: string | null;
  createdAt: string;
}

export interface Travel {
  id: number;
  name: string;
  purpose: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Leg {
  id: number;
  travelId: number;
  departureDate: string;
  departureHour: string;
  departureCountry: string;
  departureCity: string;
  arrivalDate: string;
  arrivalHour: string;
  arrivalCountry: string;
  arrivalCity: string;
  transport: string;
}

export interface Hotel {
  id: number;
  travelId: number;
  checkIn: string;
  checkOut: string;
  hotelName: string;
  city: string;
  country: string;
  pricePerNight: number;
  currency: Currency;
  nights: number;
}

export interface TripReceipt {
  id: number;
  travelId: number;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  division: string;
  costCenter: string;
  selfDeclaration: boolean;
  receiptPath: string | null;
  notes: string;
  createdAt: string;
}

export interface Exchange {
  id: number;
  date: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  amountFrom: number;
  rate: number;
  amountTo: number;
  description: string;
  createdAt: string;
}

export interface Budget {
  id: number;
  category: ExpenseCategory;
  month: number;
  year: number;
  amount: number;
  currency: Currency;
}

export interface TravelWithDetails extends Travel {
  legs: Leg[];
  hotels: Hotel[];
  receipts: TripReceipt[];
}
