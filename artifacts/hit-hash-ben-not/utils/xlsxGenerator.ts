import * as XLSX from "xlsx";
import type { Exchange, General, Leg, Receipt, Travel, ATMWithdrawal, MoneyTransfer, ClientTransfer } from "@/db/types";

function photoName(path: string | null, uriToName: Map<string, string>): string {
  if (!path) return "";
  return uriToName.get(path) ?? (path.split("/").pop() ?? "");
}

export function buildXLSXBase64(
  general: General | null,
  legs: Leg[],
  travels: Travel[],
  receipts: Receipt[],
  exchanges: Exchange[],
  atmWithdrawals: ATMWithdrawal[],
  moneyTransfers: MoneyTransfer[],
  clientTransfers: ClientTransfer[],
  uriToName: Map<string, string> = new Map(),
): string {
  const wb = XLSX.utils.book_new();

  const generalData = general
    ? [[general.workerNumber, general.division, general.month, general.year, general.costCenter]]
    : [];
  const wsGeneral = XLSX.utils.aoa_to_sheet([
    ["WorkerNumber", "Division", "Month", "Year", "CostCenter"],
    ...generalData,
  ]);
  XLSX.utils.book_append_sheet(wb, wsGeneral, "General");

  const wsLegs = XLSX.utils.aoa_to_sheet([
    ["Type", "DepartureDate", "DepartureHour", "DepartureCountry", "DepartureCity", "ArrivalDate", "ArrivalHour", "ArrivalCountry", "ArrivalCity"],
    ...legs.map((l) => [l.type, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
      l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsLegs, "Legs");

  const wsTravels = XLSX.utils.aoa_to_sheet([
    ["Num", "Departure", "DepartureDate", "DepartureHour", "DepartureCountry", "DepartureCity",
      "Arrival", "ReturnDate", "ArrivalHour", "ArrivalCountry", "ArrivalCity",
      "PlaceOfStaying", "Nights", "RatePerNight", "CurrencyPN", "Breakfast", "PaymentMethod",
      "HotelExtraFees", "CurrencyHEF", "Description", "Photo"],
    ...travels.map((t) => [t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
      t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity, t.placeOfStaying, t.nights, t.ratePerNight,
      t.currencyPN, t.breakfast ? "YES" : "NO", t.paymentMethod, t.hotelExtraFees, t.currencyHEF,
      t.description, photoName(t.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsTravels, "Hotel Nights");

  const wsReceipts = XLSX.utils.aoa_to_sheet([
    ["Type", "Amount", "Currency", "Date", "NumberOfPeople", "Division", "CostCenter",
      "SelfDeclaration", "Note", "Budget", "Photo"],
    ...receipts.map((e) => [e.type, e.amount, e.currency, e.date, e.numberOfPeople,
      e.division, e.costCenter, e.selfDeclaration ? "YES" : "NO", e.note, e.budget, photoName(e.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsReceipts, "Expenses");

  const wsExchanges = XLSX.utils.aoa_to_sheet([
    ["Date", "AmountSpent", "SpentCurrency", "AmountReceived", "ReceivedCurrency", "Note", "Photo"],
    ...exchanges.map((x) => [x.date, x.amountSpent, x.spentCurrency, x.amountReceived, x.receivedCurrency, x.note, photoName(x.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsExchanges, "Exchanges");

  const wsATM = XLSX.utils.aoa_to_sheet([
    ["Date", "CardLastFour", "Amount", "Currency", "Photo"],
    ...atmWithdrawals.map((a) => [a.date, a.cardLastFour, a.amount, a.currency, photoName(a.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsATM, "ATM Withdrawals");

  const wsMoneyTransfers = XLSX.utils.aoa_to_sheet([
    ["ReceiptName", "GiverName", "WorkerNumber", "Date", "Amount", "Currency", "Photo"],
    ...moneyTransfers.map((m) => [m.receiptName, m.giverName, m.workerNumber, m.date, m.amount, m.currency, photoName(m.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsMoneyTransfers, "Money Transfers");

  const wsClientTransfers = XLSX.utils.aoa_to_sheet([
    ["ClientName", "GiverName", "Date", "Amount", "Currency", "Photo"],
    ...clientTransfers.map((c) => [c.clientName, c.giverName, c.date, c.amount, c.currency, photoName(c.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsClientTransfers, "Client Transfers");

  return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
}
