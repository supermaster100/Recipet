import * as SQLite from "expo-sqlite";
import type {
  Budget,
  Exchange,
  ExpenseCategory,
  GeneralExpense,
  Hotel,
  Leg,
  Travel,
  TripReceipt,
} from "./types";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("hithasbbennot.db");
  await initDatabase(db);
  return db;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS general_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      category TEXT NOT NULL DEFAULT 'OTHER',
      division TEXT NOT NULL DEFAULT '',
      costCenter TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      receiptPath TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS travels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      purpose TEXT NOT NULL DEFAULT '',
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS legs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travelId INTEGER NOT NULL,
      departureDate TEXT NOT NULL DEFAULT '',
      departureHour TEXT NOT NULL DEFAULT '',
      departureCountry TEXT NOT NULL DEFAULT '',
      departureCity TEXT NOT NULL DEFAULT '',
      arrivalDate TEXT NOT NULL DEFAULT '',
      arrivalHour TEXT NOT NULL DEFAULT '',
      arrivalCountry TEXT NOT NULL DEFAULT '',
      arrivalCity TEXT NOT NULL DEFAULT '',
      transport TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (travelId) REFERENCES travels(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travelId INTEGER NOT NULL,
      checkIn TEXT NOT NULL,
      checkOut TEXT NOT NULL,
      hotelName TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      pricePerNight REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      nights INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (travelId) REFERENCES travels(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS trip_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travelId INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      category TEXT NOT NULL DEFAULT 'OTHER',
      division TEXT NOT NULL DEFAULT '',
      costCenter TEXT NOT NULL DEFAULT '',
      selfDeclaration INTEGER NOT NULL DEFAULT 0,
      receiptPath TEXT,
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (travelId) REFERENCES travels(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exchanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      fromCurrency TEXT NOT NULL DEFAULT 'USD',
      toCurrency TEXT NOT NULL DEFAULT 'ILS',
      amountFrom REAL NOT NULL DEFAULT 0,
      rate REAL NOT NULL DEFAULT 1,
      amountTo REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      UNIQUE(category, month, year)
    );
  `);
}

function rowToGeneralExpense(row: Record<string, unknown>): GeneralExpense {
  return {
    id: row["id"] as number,
    date: row["date"] as string,
    month: row["month"] as number,
    year: row["year"] as number,
    description: row["description"] as string,
    amount: row["amount"] as number,
    currency: row["currency"] as GeneralExpense["currency"],
    category: row["category"] as ExpenseCategory,
    division: row["division"] as string,
    costCenter: row["costCenter"] as string,
    notes: row["notes"] as string,
    receiptPath: row["receiptPath"] as string | null,
    createdAt: row["createdAt"] as string,
  };
}

function rowToExchange(row: Record<string, unknown>): Exchange {
  return {
    id: row["id"] as number,
    date: row["date"] as string,
    fromCurrency: row["fromCurrency"] as Exchange["fromCurrency"],
    toCurrency: row["toCurrency"] as Exchange["toCurrency"],
    amountFrom: row["amountFrom"] as number,
    rate: row["rate"] as number,
    amountTo: row["amountTo"] as number,
    description: row["description"] as string,
    createdAt: row["createdAt"] as string,
  };
}

function rowToTravel(row: Record<string, unknown>): Travel {
  return {
    id: row["id"] as number,
    name: row["name"] as string,
    purpose: row["purpose"] as string,
    startDate: row["startDate"] as string,
    endDate: row["endDate"] as string,
    createdAt: row["createdAt"] as string,
  };
}

function rowToLeg(row: Record<string, unknown>): Leg {
  return {
    id: row["id"] as number,
    travelId: row["travelId"] as number,
    departureDate: row["departureDate"] as string,
    departureHour: row["departureHour"] as string,
    departureCountry: row["departureCountry"] as string,
    departureCity: row["departureCity"] as string,
    arrivalDate: row["arrivalDate"] as string,
    arrivalHour: row["arrivalHour"] as string,
    arrivalCountry: row["arrivalCountry"] as string,
    arrivalCity: row["arrivalCity"] as string,
    transport: row["transport"] as string,
  };
}

function rowToHotel(row: Record<string, unknown>): Hotel {
  return {
    id: row["id"] as number,
    travelId: row["travelId"] as number,
    checkIn: row["checkIn"] as string,
    checkOut: row["checkOut"] as string,
    hotelName: row["hotelName"] as string,
    city: row["city"] as string,
    country: row["country"] as string,
    pricePerNight: row["pricePerNight"] as number,
    currency: row["currency"] as Hotel["currency"],
    nights: row["nights"] as number,
  };
}

function rowToTripReceipt(row: Record<string, unknown>): TripReceipt {
  return {
    id: row["id"] as number,
    travelId: row["travelId"] as number,
    date: row["date"] as string,
    description: row["description"] as string,
    amount: row["amount"] as number,
    currency: row["currency"] as TripReceipt["currency"],
    category: row["category"] as ExpenseCategory,
    division: row["division"] as string,
    costCenter: row["costCenter"] as string,
    selfDeclaration: (row["selfDeclaration"] as number) === 1,
    receiptPath: row["receiptPath"] as string | null,
    notes: row["notes"] as string,
    createdAt: row["createdAt"] as string,
  };
}

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row["id"] as number,
    category: row["category"] as ExpenseCategory,
    month: row["month"] as number,
    year: row["year"] as number,
    amount: row["amount"] as number,
    currency: row["currency"] as Budget["currency"],
  };
}

export const GeneralExpenseDB = {
  async getAll(): Promise<GeneralExpense[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM general_expenses ORDER BY date DESC, id DESC"
    );
    return rows.map(rowToGeneralExpense);
  },

  async getByMonthYear(month: number, year: number): Promise<GeneralExpense[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM general_expenses WHERE month = ? AND year = ? ORDER BY date DESC, id DESC",
      [month, year]
    );
    return rows.map(rowToGeneralExpense);
  },

  async insert(expense: Omit<GeneralExpense, "id" | "createdAt">): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO general_expenses (date, month, year, description, amount, currency, category, division, costCenter, notes, receiptPath)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.date,
        expense.month,
        expense.year,
        expense.description,
        expense.amount,
        expense.currency,
        expense.category,
        expense.division,
        expense.costCenter,
        expense.notes,
        expense.receiptPath ?? null,
      ]
    );
    return result.lastInsertRowId;
  },

  async update(expense: Omit<GeneralExpense, "createdAt">): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE general_expenses SET date=?, month=?, year=?, description=?, amount=?, currency=?, category=?, division=?, costCenter=?, notes=?, receiptPath=? WHERE id=?`,
      [
        expense.date,
        expense.month,
        expense.year,
        expense.description,
        expense.amount,
        expense.currency,
        expense.category,
        expense.division,
        expense.costCenter,
        expense.notes,
        expense.receiptPath ?? null,
        expense.id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM general_expenses WHERE id = ?", [id]);
  },
};

export const TravelDB = {
  async getAll(): Promise<Travel[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM travels ORDER BY startDate DESC"
    );
    return rows.map(rowToTravel);
  },

  async getById(id: number): Promise<Travel | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM travels WHERE id = ?",
      [id]
    );
    return row ? rowToTravel(row) : null;
  },

  async insert(travel: Omit<Travel, "id" | "createdAt">): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO travels (name, purpose, startDate, endDate) VALUES (?, ?, ?, ?)`,
      [travel.name, travel.purpose, travel.startDate, travel.endDate]
    );
    return result.lastInsertRowId;
  },

  async update(travel: Omit<Travel, "createdAt">): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE travels SET name=?, purpose=?, startDate=?, endDate=? WHERE id=?`,
      [travel.name, travel.purpose, travel.startDate, travel.endDate, travel.id]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM travels WHERE id = ?", [id]);
  },
};

export const LegDB = {
  async getByTravelId(travelId: number): Promise<Leg[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM legs WHERE travelId = ? ORDER BY departureDate, departureHour",
      [travelId]
    );
    return rows.map(rowToLeg);
  },

  async insert(leg: Omit<Leg, "id">): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO legs (travelId, departureDate, departureHour, departureCountry, departureCity, arrivalDate, arrivalHour, arrivalCountry, arrivalCity, transport)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leg.travelId,
        leg.departureDate,
        leg.departureHour,
        leg.departureCountry,
        leg.departureCity,
        leg.arrivalDate,
        leg.arrivalHour,
        leg.arrivalCountry,
        leg.arrivalCity,
        leg.transport,
      ]
    );
    return result.lastInsertRowId;
  },

  async update(leg: Leg): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE legs SET travelId=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrivalDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=?, transport=? WHERE id=?`,
      [
        leg.travelId,
        leg.departureDate,
        leg.departureHour,
        leg.departureCountry,
        leg.departureCity,
        leg.arrivalDate,
        leg.arrivalHour,
        leg.arrivalCountry,
        leg.arrivalCity,
        leg.transport,
        leg.id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM legs WHERE id = ?", [id]);
  },
};

export const HotelDB = {
  async getByTravelId(travelId: number): Promise<Hotel[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM hotels WHERE travelId = ? ORDER BY checkIn",
      [travelId]
    );
    return rows.map(rowToHotel);
  },

  async insert(hotel: Omit<Hotel, "id">): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO hotels (travelId, checkIn, checkOut, hotelName, city, country, pricePerNight, currency, nights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hotel.travelId,
        hotel.checkIn,
        hotel.checkOut,
        hotel.hotelName,
        hotel.city,
        hotel.country,
        hotel.pricePerNight,
        hotel.currency,
        hotel.nights,
      ]
    );
    return result.lastInsertRowId;
  },

  async update(hotel: Hotel): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE hotels SET travelId=?, checkIn=?, checkOut=?, hotelName=?, city=?, country=?, pricePerNight=?, currency=?, nights=? WHERE id=?`,
      [
        hotel.travelId,
        hotel.checkIn,
        hotel.checkOut,
        hotel.hotelName,
        hotel.city,
        hotel.country,
        hotel.pricePerNight,
        hotel.currency,
        hotel.nights,
        hotel.id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM hotels WHERE id = ?", [id]);
  },
};

export const TripReceiptDB = {
  async getByTravelId(travelId: number): Promise<TripReceipt[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM trip_receipts WHERE travelId = ? ORDER BY date DESC",
      [travelId]
    );
    return rows.map(rowToTripReceipt);
  },

  async insert(receipt: Omit<TripReceipt, "id" | "createdAt">): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO trip_receipts (travelId, date, description, amount, currency, category, division, costCenter, selfDeclaration, receiptPath, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        receipt.travelId,
        receipt.date,
        receipt.description,
        receipt.amount,
        receipt.currency,
        receipt.category,
        receipt.division,
        receipt.costCenter,
        receipt.selfDeclaration ? 1 : 0,
        receipt.receiptPath ?? null,
        receipt.notes,
      ]
    );
    return result.lastInsertRowId;
  },

  async update(receipt: Omit<TripReceipt, "createdAt">): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE trip_receipts SET travelId=?, date=?, description=?, amount=?, currency=?, category=?, division=?, costCenter=?, selfDeclaration=?, receiptPath=?, notes=? WHERE id=?`,
      [
        receipt.travelId,
        receipt.date,
        receipt.description,
        receipt.amount,
        receipt.currency,
        receipt.category,
        receipt.division,
        receipt.costCenter,
        receipt.selfDeclaration ? 1 : 0,
        receipt.receiptPath ?? null,
        receipt.notes,
        receipt.id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM trip_receipts WHERE id = ?", [id]);
  },
};

export const ExchangeDB = {
  async getAll(): Promise<Exchange[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM exchanges ORDER BY date DESC, id DESC"
    );
    return rows.map(rowToExchange);
  },

  async insert(exchange: Omit<Exchange, "id" | "createdAt">): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO exchanges (date, fromCurrency, toCurrency, amountFrom, rate, amountTo, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exchange.date,
        exchange.fromCurrency,
        exchange.toCurrency,
        exchange.amountFrom,
        exchange.rate,
        exchange.amountTo,
        exchange.description,
      ]
    );
    return result.lastInsertRowId;
  },

  async update(exchange: Omit<Exchange, "createdAt">): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE exchanges SET date=?, fromCurrency=?, toCurrency=?, amountFrom=?, rate=?, amountTo=?, description=? WHERE id=?`,
      [
        exchange.date,
        exchange.fromCurrency,
        exchange.toCurrency,
        exchange.amountFrom,
        exchange.rate,
        exchange.amountTo,
        exchange.description,
        exchange.id,
      ]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM exchanges WHERE id = ?", [id]);
  },
};

export const BudgetDB = {
  async getAll(): Promise<Budget[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM budgets ORDER BY year DESC, month DESC"
    );
    return rows.map(rowToBudget);
  },

  async getByMonthYear(month: number, year: number): Promise<Budget[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM budgets WHERE month = ? AND year = ?",
      [month, year]
    );
    return rows.map(rowToBudget);
  },

  async upsert(budget: Omit<Budget, "id">): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT INTO budgets (category, month, year, amount, currency)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(category, month, year) DO UPDATE SET amount=excluded.amount, currency=excluded.currency`,
      [budget.category, budget.month, budget.year, budget.amount, budget.currency]
    );
  },

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync("DELETE FROM budgets WHERE id = ?", [id]);
  },
};
