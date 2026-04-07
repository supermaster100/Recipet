import type {
  Budget,
  Exchange,
  GeneralExpense,
  Hotel,
  Leg,
  Travel,
  TripReceipt,
} from "./types";

export async function getDatabase(): Promise<null> {
  return null;
}

const noOp = async () => {};
const emptyList = async () => [];
const emptyNum = async () => 0;

export const GeneralExpenseDB = {
  getAll: (): Promise<GeneralExpense[]> => Promise.resolve([]),
  getByMonthYear: (_m: number, _y: number): Promise<GeneralExpense[]> => Promise.resolve([]),
  insert: (_e: Omit<GeneralExpense, "id" | "createdAt">): Promise<number> => Promise.resolve(0),
  update: (_e: Omit<GeneralExpense, "createdAt">): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const TravelDB = {
  getAll: (): Promise<Travel[]> => Promise.resolve([]),
  getById: (_id: number): Promise<Travel | null> => Promise.resolve(null),
  insert: (_t: Omit<Travel, "id" | "createdAt">): Promise<number> => Promise.resolve(0),
  update: (_t: Omit<Travel, "createdAt">): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const LegDB = {
  getByTravelId: (_id: number): Promise<Leg[]> => Promise.resolve([]),
  insert: (_l: Omit<Leg, "id">): Promise<number> => Promise.resolve(0),
  update: (_l: Leg): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const HotelDB = {
  getByTravelId: (_id: number): Promise<Hotel[]> => Promise.resolve([]),
  insert: (_h: Omit<Hotel, "id">): Promise<number> => Promise.resolve(0),
  update: (_h: Hotel): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const TripReceiptDB = {
  getByTravelId: (_id: number): Promise<TripReceipt[]> => Promise.resolve([]),
  insert: (_r: Omit<TripReceipt, "id" | "createdAt">): Promise<number> => Promise.resolve(0),
  update: (_r: Omit<TripReceipt, "createdAt">): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const ExchangeDB = {
  getAll: (): Promise<Exchange[]> => Promise.resolve([]),
  insert: (_e: Omit<Exchange, "id" | "createdAt">): Promise<number> => Promise.resolve(0),
  update: (_e: Omit<Exchange, "createdAt">): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};

export const BudgetDB = {
  getAll: (): Promise<Budget[]> => Promise.resolve([]),
  getByMonthYear: (_m: number, _y: number): Promise<Budget[]> => Promise.resolve([]),
  upsert: (_b: Omit<Budget, "id">): Promise<void> => Promise.resolve(),
  delete: (_id: number): Promise<void> => Promise.resolve(),
};
