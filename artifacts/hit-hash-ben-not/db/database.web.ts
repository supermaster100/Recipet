import type { Budget, ClientTransfer, Exchange, General, Leg, MoneyTransfer, Receipt, Travel } from "./types";

export async function getDatabase(): Promise<null> {
  return null;
}

export const GeneralDB = {
  get: (): Promise<General | null> => Promise.resolve(null),
  upsert: (_d: Omit<General, "id">): Promise<void> => Promise.resolve(),
};

export const ReceiptDB = {
  getAll: (): Promise<Receipt[]> => Promise.resolve([]),
  insert: (_r: Omit<Receipt, "id">): Promise<number> => Promise.resolve(0),
  update: (_r: Receipt): Promise<void> => Promise.resolve(),
  softDelete: (_id: number): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const ExchangeDB = {
  getAll: (): Promise<Exchange[]> => Promise.resolve([]),
  insert: (_e: Omit<Exchange, "id">): Promise<number> => Promise.resolve(0),
  update: (_e: Exchange): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const LegDB = {
  getAll: (): Promise<Leg[]> => Promise.resolve([]),
  getFirst: (): Promise<Leg | null> => Promise.resolve(null),
  upsertSingleton: (_l: Omit<Leg, "id">): Promise<Leg> =>
    Promise.resolve({ id: 0, ..._l } as Leg),
  insert: (_l: Omit<Leg, "id">): Promise<number> => Promise.resolve(0),
  update: (_l: Leg): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const TravelDB = {
  getAll: (): Promise<Travel[]> => Promise.resolve([]),
  getById: (_id: number): Promise<Travel | null> => Promise.resolve(null),
  getByLegId: (_legId: number): Promise<Travel[]> => Promise.resolve([]),
  insert: (_t: Omit<Travel, "id">): Promise<number> => Promise.resolve(0),
  update: (_t: Travel): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const BudgetDB = {
  getAll: (): Promise<Budget[]> => Promise.resolve([]),
  insert: (_b: Omit<Budget, "id">): Promise<number> => Promise.resolve(0),
  update: (_b: Budget): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const MoneyTransferDB = {
  getAll: (): Promise<MoneyTransfer[]> => Promise.resolve([]),
  insert: (_m: Omit<MoneyTransfer, "id">): Promise<number> => Promise.resolve(0),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const ClientTransferDB = {
  getAll: (): Promise<ClientTransfer[]> => Promise.resolve([]),
  insert: (_c: Omit<ClientTransfer, "id">): Promise<number> => Promise.resolve(0),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};
