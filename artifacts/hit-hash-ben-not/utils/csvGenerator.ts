import type { Exchange, General, Leg, Receipt, Travel, ATMWithdrawal, MoneyTransfer, ClientTransfer } from "@/db/types";

function esc(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function row(...fields: unknown[]): string {
  return fields.map(esc).join(",");
}

function photoName(path: string | null, uriToName: Map<string, string>): string {
  if (!path) return "";
  return uriToName.get(path) ?? (path.split("/").pop() ?? "");
}

export function buildCSV(
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
  const lines: string[] = [];

  lines.push("# Hit-hash-Ben-not — Expense Export");
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("# GENERAL");
  lines.push("Row,WorkerNumber,Division,Month,Year,CostCenter");
  if (general) {
    lines.push(row("G", general.workerNumber, general.division, general.month, general.year, general.costCenter));
  }
  lines.push("");

  lines.push("# TRIP LEGS (Transport)");
  lines.push("Row,Type,DepartureDate,DepartureHour,DepartureCountry,DepartureCity,ArrivalDate,ArrivalHour,ArrivalCountry,ArrivalCity");
  for (const l of legs) {
    lines.push(row("T", l.type, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
      l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity));
  }
  lines.push("");

  lines.push("# HOTEL NIGHTS");
  lines.push("Row,Num,Departure,DepartureDate,DepartureHour,DepartureCountry,DepartureCity,Arrival,ReturnDate,ArrivalHour,ArrivalCountry,ArrivalCity,PlaceOfStaying,Nights,RatePerNight,CurrencyPN,Breakfast,PaymentMethod,HotelExtraFees,CurrencyHEF,Description,Photo");
  for (const t of travels) {
    lines.push(row("H", t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
      t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity,
      t.placeOfStaying, t.nights, t.ratePerNight, t.currencyPN, t.breakfast ? "YES" : "NO",
      t.paymentMethod, t.hotelExtraFees, t.currencyHEF, t.description, photoName(t.photo, uriToName)));
  }
  lines.push("");

  lines.push("# EXPENSES");
  lines.push("Row,Type,Amount,Currency,Date,NumberOfPeople,Division,CostCenter,SelfDeclaration,Note,Budget,Photo");
  for (const e of receipts) {
    lines.push(row("E", e.type, e.amount, e.currency, e.date, e.numberOfPeople,
      e.division, e.costCenter, e.selfDeclaration ? "YES" : "NO", e.note, e.budget, photoName(e.photo, uriToName)));
  }
  lines.push("");

  lines.push("# EXCHANGES");
  lines.push("Row,Date,AmountSpent,SpentCurrency,AmountReceived,ReceivedCurrency,Note,Photo");
  for (const x of exchanges) {
    lines.push(row("X", x.date, x.amountSpent, x.spentCurrency, x.amountReceived, x.receivedCurrency, x.note, photoName(x.photo, uriToName)));
  }
  lines.push("");

  lines.push("# ATM WITHDRAWALS");
  lines.push("Row,Date,CardLastFour,Amount,Currency,Photo");
  for (const a of atmWithdrawals) {
    lines.push(row("ATM", a.date, a.cardLastFour, a.amount, a.currency, photoName(a.photo, uriToName)));
  }
  lines.push("");

  lines.push("# MONEY TRANSFERS");
  lines.push("Row,ReceiptName,GiverName,WorkerNumber,Date,Amount,Currency,Photo");
  for (const m of moneyTransfers) {
    lines.push(row("MT", m.receiptName, m.giverName, m.workerNumber, m.date, m.amount, m.currency, photoName(m.photo, uriToName)));
  }
  lines.push("");

  lines.push("# CLIENT TRANSFERS");
  lines.push("Row,ClientName,GiverName,Date,Amount,Currency,Photo");
  for (const c of clientTransfers) {
    lines.push(row("CT", c.clientName, c.giverName, c.date, c.amount, c.currency, photoName(c.photo, uriToName)));
  }

  return lines.join("\n");
}
