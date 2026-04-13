export const CURRENCY_NAMES: Record<string, string> = {
  ILS: "Israeli New Shekel",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound Sterling",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CNY: "Chinese Yuan Renminbi",
  AED: "UAE Dirham",
  UAH: "Ukrainian Hryvnia",
  CZK: "Czech Koruna",
  HUF: "Hungarian Forint",
  DKK: "Danish Krone",
  NOK: "Norwegian Krone",
  SEK: "Swedish Krona",
  PLN: "Polish Zloty",
  RON: "Romanian Leu",
  BGN: "Bulgarian Lev",
  HRK: "Croatian Kuna",
  RUB: "Russian Ruble",
  TRY: "Turkish Lira",
  INR: "Indian Rupee",
  SGD: "Singapore Dollar",
  NZD: "New Zealand Dollar",
  BRL: "Brazilian Real",
  MXN: "Mexican Peso",
  ZAR: "South African Rand",
  ISK: "Icelandic Krona",
  RSD: "Serbian Dinar",
  THB: "Thai Baht",
};

export function matchesCurrencySearch(code: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  if (code.toLowerCase().includes(q)) return true;
  const name = CURRENCY_NAMES[code] ?? "";
  return name.toLowerCase().includes(q);
}
