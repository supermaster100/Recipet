import type { ATMWithdrawal, Budget, CashWalletEntry, CostCenter, ClientTransfer, Exchange, General, Leg, MoneyTransfer, Receipt, Travel, TrashItem } from "./types";

const KEYS = {
  general: "hhbn_general",
  receipts: "hhbn_receipts",
  cashWallet: "hhbn_cash_wallet",
  exchanges: "hhbn_exchanges",
  legs: "hhbn_legs",
  travels: "hhbn_travels",
  atm: "hhbn_atm",
  costCenters: "hhbn_cost_centers",
  moneyTransfers: "hhbn_money_transfers",
  clientTransfers: "hhbn_client_transfers",
  seq: (table: string) => `hhbn_seq_${table}`,
};

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(table: string): number {
  const seqKey = KEYS.seq(table);
  const current = parseInt(localStorage.getItem(seqKey) ?? "0", 10);
  const next = current + 1;
  localStorage.setItem(seqKey, String(next));
  return next;
}

function loadSingle<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveSingle<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export async function getDatabase(): Promise<Record<string, never>> {
  return {};
}

export const GeneralDB = {
  async get(): Promise<General | null> {
    return loadSingle<General>(KEYS.general);
  },
  async upsert(data: Omit<General, "id">): Promise<void> {
    const existing = loadSingle<General>(KEYS.general);
    const id = existing?.id ?? nextId("general");
    saveSingle<General>(KEYS.general, { id, ...data });
  },
};

export const ReceiptDB = {
  async getAll(): Promise<Receipt[]> {
    return load<Receipt>(KEYS.receipts)
      .filter((r) => r.deleted_at == null)
      .sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id);
  },
  async getDeleted(): Promise<Receipt[]> {
    return load<Receipt>(KEYS.receipts)
      .filter((r) => r.deleted_at != null)
      .sort((a, b) => (b.deleted_at! > a.deleted_at! ? 1 : -1));
  },
  async insert(r: Omit<Receipt, "id">): Promise<number> {
    const rows = load<Receipt>(KEYS.receipts);
    const id = nextId("receipts");
    rows.push({ id, ...r, deleted_at: null });
    save(KEYS.receipts, rows);
    return id;
  },
  async update(r: Receipt): Promise<void> {
    const rows = load<Receipt>(KEYS.receipts);
    const idx = rows.findIndex((x) => x.id === r.id);
    if (idx !== -1) rows[idx] = r;
    save(KEYS.receipts, rows);
  },
  async softDelete(id: number): Promise<void> {
    const rows = load<Receipt>(KEYS.receipts);
    const idx = rows.findIndex((x) => x.id === id);
    if (idx !== -1) rows[idx] = { ...rows[idx], deleted_at: new Date().toISOString() };
    save(KEYS.receipts, rows);
  },
  async restore(id: number): Promise<void> {
    const rows = load<Receipt>(KEYS.receipts);
    const idx = rows.findIndex((x) => x.id === id);
    if (idx !== -1) rows[idx] = { ...rows[idx], deleted_at: null };
    save(KEYS.receipts, rows);
  },
  async hardDelete(id: number): Promise<void> {
    const rows = load<Receipt>(KEYS.receipts).filter((x) => x.id !== id);
    save(KEYS.receipts, rows);
  },
  async purgeExpired(): Promise<Array<{ photo: string | null; deleted_at: string | null }>> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const rows = load<Receipt>(KEYS.receipts);
    const expired = rows.filter((r) => r.deleted_at != null && r.deleted_at < cutoff);
    const kept = rows.filter((r) => !(r.deleted_at != null && r.deleted_at < cutoff));
    save(KEYS.receipts, kept);
    return expired.map((r) => ({ photo: r.photo, deleted_at: r.deleted_at }));
  },
  async delete(id: number): Promise<void> {
    return ReceiptDB.softDelete(id);
  },
};

export const ExchangeDB = {
  async getAll(): Promise<Exchange[]> {
    return load<Exchange>(KEYS.exchanges)
      .filter((e) => e.deleted_at == null)
      .sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id);
  },
  async getDeleted(): Promise<Exchange[]> {
    return load<Exchange>(KEYS.exchanges)
      .filter((e) => e.deleted_at != null)
      .sort((a, b) => (b.deleted_at! > a.deleted_at! ? 1 : -1));
  },
  async insert(e: Omit<Exchange, "id">): Promise<number> {
    const rows = load<Exchange>(KEYS.exchanges);
    const id = nextId("exchanges");
    rows.push({ id, ...e, deleted_at: null });
    save(KEYS.exchanges, rows);
    return id;
  },
  async update(e: Exchange): Promise<void> {
    const rows = load<Exchange>(KEYS.exchanges);
    const idx = rows.findIndex((x) => x.id === e.id);
    if (idx !== -1) rows[idx] = e;
    save(KEYS.exchanges, rows);
  },
  async softDelete(id: number): Promise<void> {
    const rows = load<Exchange>(KEYS.exchanges);
    const idx = rows.findIndex((x) => x.id === id);
    if (idx !== -1) rows[idx] = { ...rows[idx], deleted_at: new Date().toISOString() };
    save(KEYS.exchanges, rows);
  },
  async restore(id: number): Promise<void> {
    const rows = load<Exchange>(KEYS.exchanges);
    const idx = rows.findIndex((x) => x.id === id);
    if (idx !== -1) rows[idx] = { ...rows[idx], deleted_at: null };
    save(KEYS.exchanges, rows);
  },
  async hardDelete(id: number): Promise<void> {
    const rows = load<Exchange>(KEYS.exchanges).filter((x) => x.id !== id);
    save(KEYS.exchanges, rows);
  },
  async purgeExpired(): Promise<Array<{ photo: string | null; deleted_at: string | null }>> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const rows = load<Exchange>(KEYS.exchanges);
    const expired = rows.filter((e) => e.deleted_at != null && e.deleted_at < cutoff);
    const kept = rows.filter((e) => !(e.deleted_at != null && e.deleted_at < cutoff));
    save(KEYS.exchanges, kept);
    return expired.map((e) => ({ photo: e.photo, deleted_at: e.deleted_at }));
  },
  async delete(id: number): Promise<void> {
    return ExchangeDB.softDelete(id);
  },
};

export const ATMDB = {
  async getAll(): Promise<ATMWithdrawal[]> {
    return load<ATMWithdrawal>(KEYS.atm)
      .sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id);
  },
  async getById(id: number): Promise<ATMWithdrawal | null> {
    return load<ATMWithdrawal>(KEYS.atm).find((a) => a.id === id) ?? null;
  },
  async insert(a: Omit<ATMWithdrawal, "id">): Promise<number> {
    const rows = load<ATMWithdrawal>(KEYS.atm);
    const id = nextId("atm");
    rows.push({ id, ...a });
    save(KEYS.atm, rows);
    return id;
  },
  async update(a: ATMWithdrawal): Promise<void> {
    const rows = load<ATMWithdrawal>(KEYS.atm);
    const idx = rows.findIndex((x) => x.id === a.id);
    if (idx !== -1) rows[idx] = a;
    save(KEYS.atm, rows);
  },
  async delete(id: number): Promise<void> {
    const rows = load<ATMWithdrawal>(KEYS.atm).filter((x) => x.id !== id);
    save(KEYS.atm, rows);
  },
};

export const LegDB = {
  async getAll(): Promise<Leg[]> {
    return load<Leg>(KEYS.legs).filter((l) => l.deleted_at == null);
  },
  async getFirst(): Promise<Leg | null> {
    const legs = load<Leg>(KEYS.legs).filter((l) => l.deleted_at == null);
    return legs[0] ?? null;
  },
  async upsertSingleton(l: Omit<Leg, "id">): Promise<Leg> {
    const rows = load<Leg>(KEYS.legs);
    const existing = rows.find((x) => x.deleted_at == null);
    if (existing) {
      const updated = { ...existing, ...l };
      const idx = rows.findIndex((x) => x.id === existing.id);
      rows[idx] = updated;
      save(KEYS.legs, rows);
      return updated;
    }
    const id = nextId("legs");
    const newLeg: Leg = { id, ...l, deleted_at: null };
    rows.push(newLeg);
    save(KEYS.legs, rows);
    return newLeg;
  },
  async insert(l: Omit<Leg, "id">): Promise<number> {
    const rows = load<Leg>(KEYS.legs);
    const id = nextId("legs");
    rows.push({ id, ...l, deleted_at: null });
    save(KEYS.legs, rows);
    return id;
  },
  async update(l: Leg): Promise<void> {
    const rows = load<Leg>(KEYS.legs);
    const idx = rows.findIndex((x) => x.id === l.id);
    if (idx !== -1) rows[idx] = l;
    save(KEYS.legs, rows);
  },
  async softDelete(id: number): Promise<void> {
    const rows = load<Leg>(KEYS.legs);
    const idx = rows.findIndex((x) => x.id === id);
    if (idx !== -1) rows[idx] = { ...rows[idx], deleted_at: new Date().toISOString() };
    save(KEYS.legs, rows);
  },
  async delete(id: number): Promise<void> {
    return LegDB.softDelete(id);
  },
};

export const TravelDB = {
  async getAll(): Promise<Travel[]> {
    return load<Travel>(KEYS.travels)
      .filter((t) => t.deleted_at == null)
      .sort((a, b) => b.departureDate > a.departureDate ? 1 : b.departureDate < a.departureDate ? -1 : b.id - a.id);
  },
  async getById(id: number): Promise<Travel | null> {
    return load<Travel>(KEYS.travels).find((t) => t.id === id) ?? null;
  },
  async getByLegId(legId: number): Promise<Travel[]> {
    return load<Travel>(KEYS.travels).filter((t) => t.lId === legId && t.deleted_at == null);
  },
  async insert(t: Omit<Travel, "id">): Promise<number> {
    const rows = load<Travel>(KEYS.travels);
    const id = nextId("travels");
    rows.push({ id, ...t, deleted_at: null });
    save(KEYS.travels, rows);
    return id;
  },
  async update(t: Travel): Promise<void> {
    const rows = load<Travel>(KEYS.travels);
    const idx = rows.findIndex((x) => x.id === t.id);
    if (idx !== -1) rows[idx] = t;
    save(KEYS.travels, rows);
  },
  async softDelete(id: number): Promise<void> {
    const rows = load<Travel>(KEYS.travels);
    const idx = rows.findIndex((x) => x.id === id);
    if (idx !== -1) rows[idx] = { ...rows[idx], deleted_at: new Date().toISOString() };
    save(KEYS.travels, rows);
  },
  async delete(id: number): Promise<void> {
    return TravelDB.softDelete(id);
  },
};

export const CostCenterDB = {
  async getAll(): Promise<CostCenter[]> {
    return load<CostCenter>(KEYS.costCenters);
  },
  async insert(c: Omit<CostCenter, "id">): Promise<number> {
    const rows = load<CostCenter>(KEYS.costCenters);
    const id = nextId("costCenters");
    rows.push({ id, ...c });
    save(KEYS.costCenters, rows);
    return id;
  },
  async update(c: CostCenter): Promise<void> {
    const rows = load<CostCenter>(KEYS.costCenters);
    const idx = rows.findIndex((x) => x.id === c.id);
    if (idx !== -1) rows[idx] = c;
    save(KEYS.costCenters, rows);
  },
  async delete(id: number): Promise<void> {
    const rows = load<CostCenter>(KEYS.costCenters).filter((x) => x.id !== id);
    save(KEYS.costCenters, rows);
  },
  async deleteAll(): Promise<void> {
    save<CostCenter>(KEYS.costCenters, []);
  },
};

export const MoneyTransferDB = {
  async getAll(): Promise<MoneyTransfer[]> {
    return load<MoneyTransfer>(KEYS.moneyTransfers)
      .sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id);
  },
  async insert(m: Omit<MoneyTransfer, "id">): Promise<number> {
    const rows = load<MoneyTransfer>(KEYS.moneyTransfers);
    const id = nextId("moneyTransfers");
    rows.push({ id, ...m });
    save(KEYS.moneyTransfers, rows);
    return id;
  },
  async delete(id: number): Promise<void> {
    const rows = load<MoneyTransfer>(KEYS.moneyTransfers).filter((x) => x.id !== id);
    save(KEYS.moneyTransfers, rows);
  },
};

export const ClientTransferDB = {
  async getAll(): Promise<ClientTransfer[]> {
    return load<ClientTransfer>(KEYS.clientTransfers)
      .sort((a, b) => b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id);
  },
  async insert(c: Omit<ClientTransfer, "id">): Promise<number> {
    const rows = load<ClientTransfer>(KEYS.clientTransfers);
    const id = nextId("clientTransfers");
    rows.push({ id, ...c });
    save(KEYS.clientTransfers, rows);
    return id;
  },
  async delete(id: number): Promise<void> {
    const rows = load<ClientTransfer>(KEYS.clientTransfers).filter((x) => x.id !== id);
    save(KEYS.clientTransfers, rows);
  },
};

export const CashWalletDB = {
  async getAll(): Promise<CashWalletEntry[]> {
    return load<CashWalletEntry>(KEYS.cashWallet);
  },
  async insert(entry: Omit<CashWalletEntry, "id">): Promise<number> {
    const rows = load<CashWalletEntry>(KEYS.cashWallet);
    const id = nextId("cashWallet");
    rows.push({ id, ...entry });
    save(KEYS.cashWallet, rows);
    return id;
  },
  async deleteByRef(refId: number, refTable: string): Promise<void> {
    const rows = load<CashWalletEntry>(KEYS.cashWallet).filter(
      (e) => !(e.refId === refId && e.refTable === refTable)
    );
    save(KEYS.cashWallet, rows);
  },
  async delete(id: number): Promise<void> {
    const rows = load<CashWalletEntry>(KEYS.cashWallet).filter((e) => e.id !== id);
    save(KEYS.cashWallet, rows);
  },
  async getBalances(): Promise<Record<string, number>> {
    const rows = load<CashWalletEntry>(KEYS.cashWallet);
    const balances: Record<string, number> = {};
    for (const row of rows) {
      balances[row.currency] = (balances[row.currency] ?? 0) + row.amount;
    }
    return balances;
  },
  async clearAll(): Promise<void> {
    save(KEYS.cashWallet, []);
    localStorage.removeItem(KEYS.seq("cashWallet"));
  },
};

export async function getTrashItems(): Promise<TrashItem[]> {
  const deletedReceipts = await ReceiptDB.getDeleted();
  const deletedExchanges = await ExchangeDB.getDeleted();

  const receiptItems: TrashItem[] = deletedReceipts.map((r) => ({
    id: r.id,
    tableSource: "Receipts" as const,
    type: r.type,
    amount: r.amount,
    currency: r.currency,
    date: r.date,
    deleted_at: r.deleted_at!,
    photo: r.photo,
  }));

  const exchangeItems: TrashItem[] = deletedExchanges.map((e) => ({
    id: e.id,
    tableSource: "Exchanges" as const,
    type: "EXCHANGE",
    amount: e.amountSpent,
    currency: e.spentCurrency,
    date: e.date,
    deleted_at: e.deleted_at!,
    photo: e.photo,
  }));

  return [...receiptItems, ...exchangeItems].sort((a, b) =>
    b.deleted_at > a.deleted_at ? 1 : -1
  );
}
