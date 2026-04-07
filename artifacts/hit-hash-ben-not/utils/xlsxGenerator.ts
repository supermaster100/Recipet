import * as XLSX from "xlsx";
import type { CashWalletEntry, CostCenter, Exchange, General, Leg, Receipt, Travel, ATMWithdrawal, MoneyTransfer, ClientTransfer } from "@/db/types";
import { formatCostCenter } from "@/db/types";

function costCenterLabel(value: string, costCenters: CostCenter[]): string {
  const found = costCenters.find((c) => {
    const formatted = formatCostCenter(c);
    return formatted === value || c.name === value;
  });
  if (found) return formatCostCenter(found);
  return value;
}

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
  cashWalletEntries: CashWalletEntry[] = [],
  costCenters: CostCenter[] = [],
): string {
  const wb = XLSX.utils.book_new();

  const wsGeneral = XLSX.utils.aoa_to_sheet([
    ["WorkerNumber", "Month", "Year", "CostCenter"],
    ...(general ? [[general.workerNumber, general.month, general.year, general.costCenter]] : []),
  ]);
  XLSX.utils.book_append_sheet(wb, wsGeneral, "General");

  const wsLegs = XLSX.utils.aoa_to_sheet([
    ["Type", "DepartureDate", "DepartureHour", "DepartureCountry", "DepartureCity", "ArrivalDate", "ArrivalHour", "ArrivalCountry", "ArrivalCity"],
    ...legs.map((l) => [l.type, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
      l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsLegs, "Legs");

  const wsTravels = XLSX.utils.aoa_to_sheet([
    ["Num", "DepartureDate", "DepartureCountry", "DepartureCity", "ReturnDate", "ArrivalCountry", "ArrivalCity",
      "PlaceOfStaying", "Nights", "RatePerNight", "CurrencyPN", "Breakfast", "PaymentMethod",
      "HotelExtraFees", "CurrencyHEF", "Description", "Photo"],
    ...travels.map((t) => [t.num, t.departureDate, t.departureCountry, t.departureCity,
      t.returnDate, t.arrivalCountry, t.arrivalCity, t.placeOfStaying, t.nights, t.ratePerNight,
      t.currencyPN, t.breakfast ? "YES" : "NO", t.paymentMethod, t.hotelExtraFees, t.currencyHEF,
      t.description, pn(t.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsTravels, "Hotel Nights");

  const wsReceipts = XLSX.utils.aoa_to_sheet([
    ["Type", "Amount", "Currency", "Date", "NumberOfPeople", "Division", "CostCenter",
      "SelfDeclaration", "Note", "PaymentMethod", "Photo"],
    ...receipts.map((e) => [e.type, e.amount, e.currency, e.date, e.numberOfPeople,
      e.division, costCenterLabel(e.costCenter, costCenters), e.selfDeclaration ? "YES" : "NO", e.note, e.paymentMethod ?? "card", pn(e.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsReceipts, "Expenses");

  const wsExchanges = XLSX.utils.aoa_to_sheet([
    ["Date", "AmountSpent", "SpentCurrency", "AmountReceived", "ReceivedCurrency", "Note", "Photo"],
    ...exchanges.map((x) => [x.date, x.amountSpent, x.spentCurrency, x.amountReceived, x.receivedCurrency, x.note, pn(x.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsExchanges, "Exchanges");

  const wsATM = XLSX.utils.aoa_to_sheet([
    ["Date", "CardLastFour", "Amount", "Currency", "Photo"],
    ...atmWithdrawals.map((a) => [a.date, a.cardLastFour, a.amount, a.currency, pn(a.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsATM, "ATM Withdrawals");

  const wsMoneyTransfers = XLSX.utils.aoa_to_sheet([
    ["ReceiptName", "GiverName", "WorkerNumber", "Date", "Amount", "Currency", "Photo"],
    ...moneyTransfers.map((m) => [m.receiptName, m.giverName, m.workerNumber, m.date, m.amount, m.currency, pn(m.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsMoneyTransfers, "Money Transfers");

  const wsClientTransfers = XLSX.utils.aoa_to_sheet([
    ["ClientName", "GiverName", "Date", "Amount", "Currency", "Photo"],
    ...clientTransfers.map((c) => [c.clientName, c.giverName, c.date, c.amount, c.currency, pn(c.photo, uriToName)]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsClientTransfers, "Client Transfers");

  if (cashWalletEntries.length > 0) {
    const wsCashWallet = XLSX.utils.aoa_to_sheet([
      ["EntryType", "Currency", "Amount", "Note", "Date"],
      ...cashWalletEntries.map((w) => [
        w.entryType,
        w.currency,
        w.amount,
        w.note,
        w.createdAt.split("T")[0] ?? w.createdAt,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsCashWallet, "Cash Wallet Ledger");

    const balances: Record<string, number> = {};
    for (const w of cashWalletEntries) {
      balances[w.currency] = (balances[w.currency] ?? 0) + w.amount;
    }
    const wsCashBalances = XLSX.utils.aoa_to_sheet([
      ["Currency", "Balance"],
      ...Object.entries(balances).map(([currency, balance]) => [currency, parseFloat(balance.toFixed(2))]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsCashBalances, "Cash Balances");
  }

  return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
}
