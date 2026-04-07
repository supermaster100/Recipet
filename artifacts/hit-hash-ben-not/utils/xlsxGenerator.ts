import * as XLSX from "xlsx";
import type { Exchange, General, Leg, Receipt, Travel, ATMWithdrawal, MoneyTransfer, ClientTransfer } from "@/db/types";

function pn(path: string | null, uriToName: Map<string, string>): string {
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
  const rows: unknown[][] = [];

  if (general) {
    rows.push(["G", general.workerNumber, general.division, general.month, general.year, general.costCenter]);
  }

  for (const l of legs) {
    rows.push(["T", l.type, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
      l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]);
  }

  for (const t of travels) {
    rows.push(["H", t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
      t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity,
      t.placeOfStaying, t.nights, t.ratePerNight, t.currencyPN, t.breakfast ? "YES" : "NO",
      t.paymentMethod, t.hotelExtraFees, t.currencyHEF, t.description, pn(t.photo, uriToName)]);
  }

  for (const e of receipts) {
    rows.push(["E", e.type, e.amount, e.currency, e.date, e.numberOfPeople,
      e.division, e.costCenter, e.selfDeclaration ? "YES" : "NO", e.note, e.budget, pn(e.photo, uriToName)]);
  }

  for (const x of exchanges) {
    rows.push(["X", x.date, x.amountSpent, x.spentCurrency, x.amountReceived, x.receivedCurrency, x.note, pn(x.photo, uriToName)]);
  }

  for (const a of atmWithdrawals) {
    rows.push(["ATM", a.date, a.cardLastFour, a.amount, a.currency, pn(a.photo, uriToName)]);
  }

  for (const m of moneyTransfers) {
    rows.push(["MT", m.receiptName, m.giverName, m.workerNumber, m.date, m.amount, m.currency, pn(m.photo, uriToName)]);
  }

  for (const c of clientTransfers) {
    rows.push(["CT", c.clientName, c.giverName, c.date, c.amount, c.currency, pn(c.photo, uriToName)]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Row", "Field1", "Field2", "Field3", "Field4", "Field5", "Field6", "Field7", "Field8", "Field9", "Field10", "Field11", "Field12", "Field13", "Field14", "Field15", "Field16", "Field17", "Field18", "Field19", "Field20", "Field21"],
    ...rows,
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");

  return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
}
