import * as SQLite from "expo-sqlite";
import type {
  Budget,
  Exchange,
  General,
  Leg,
  Receipt,
  ReceiptType,
  Travel,
} from "./types";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("hithasbbennot.db");
  await initDatabase(_db);
  return _db;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS General (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workerNumber TEXT NOT NULL DEFAULT '',
      division TEXT NOT NULL DEFAULT '',
      month INTEGER NOT NULL DEFAULT 1,
      year INTEGER NOT NULL DEFAULT 2025,
      costCenter TEXT NOT NULL DEFAULT ''
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budgetNumber INTEGER NOT NULL DEFAULT 0,
      budgetNumberName TEXT NOT NULL DEFAULT ''
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'OTHER',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      date TEXT NOT NULL DEFAULT '',
      numberOfPeople INTEGER NOT NULL DEFAULT 1,
      division TEXT NOT NULL DEFAULT '',
      costCenter TEXT NOT NULL DEFAULT '',
      selfDeclaration INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      photo TEXT,
      budget TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      export INTEGER NOT NULL DEFAULT 0
    );
  `);
  await db.execAsync(
    `ALTER TABLE Receipts ADD COLUMN budget TEXT NOT NULL DEFAULT ''`
  ).catch(() => {});  

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Exchanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL DEFAULT '',
      amountSpent REAL NOT NULL DEFAULT 0,
      spentCurrency TEXT NOT NULL DEFAULT 'USD',
      amountReceived REAL NOT NULL DEFAULT 0,
      receivedCurrency TEXT NOT NULL DEFAULT 'ILS',
      note TEXT NOT NULL DEFAULT '',
      photo TEXT,
      status TEXT NOT NULL DEFAULT '',
      export INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Legs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      departureDate TEXT NOT NULL DEFAULT '',
      departureHour TEXT NOT NULL DEFAULT '',
      departureCountry TEXT NOT NULL DEFAULT '',
      departureCity TEXT NOT NULL DEFAULT '',
      arrivalDate TEXT NOT NULL DEFAULT '',
      arrivalHour TEXT NOT NULL DEFAULT '',
      arrivalCountry TEXT NOT NULL DEFAULT '',
      arrivalCity TEXT NOT NULL DEFAULT ''
    );
  `);

  const legMigrations = [
    "ALTER TABLE Legs ADD COLUMN departureDate TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN departureHour TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN departureCountry TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN departureCity TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN arrivalDate TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN arrivalHour TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN arrivalCountry TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE Legs ADD COLUMN arrivalCity TEXT NOT NULL DEFAULT ''",
  ];
  for (const sql of legMigrations) {
    try { await db.execAsync(sql); } catch (_) { /* column already exists */ }
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Travels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lId INTEGER DEFAULT 0,
      num INTEGER NOT NULL DEFAULT 1,
      departure TEXT NOT NULL DEFAULT '',
      departureDate TEXT NOT NULL DEFAULT '',
      departureHour TEXT NOT NULL DEFAULT '',
      departureCountry TEXT NOT NULL DEFAULT '',
      departureCity TEXT NOT NULL DEFAULT '',
      arrival TEXT NOT NULL DEFAULT '',
      returnDate TEXT NOT NULL DEFAULT '',
      arrivalHour TEXT NOT NULL DEFAULT '',
      arrivalCountry TEXT NOT NULL DEFAULT '',
      arrivalCity TEXT NOT NULL DEFAULT '',
      budget REAL NOT NULL DEFAULT 0,
      placeOfStaying TEXT NOT NULL DEFAULT '',
      nights INTEGER NOT NULL DEFAULT 0,
      arbitraryLocation TEXT NOT NULL DEFAULT '',
      ratePerNight REAL NOT NULL DEFAULT 0,
      currencyPN TEXT NOT NULL DEFAULT 'USD',
      breakfast INTEGER NOT NULL DEFAULT 0,
      paymentMethod TEXT NOT NULL DEFAULT '',
      hotelExtraFees REAL NOT NULL DEFAULT 0,
      currencyHEF TEXT NOT NULL DEFAULT 'USD',
      description TEXT NOT NULL DEFAULT '',
      photo TEXT,
      export INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (lId) REFERENCES Legs(id) ON DELETE CASCADE
    );
  `);
}

function toGeneral(r: Record<string, unknown>): General {
  return {
    id: r["id"] as number,
    workerNumber: r["workerNumber"] as string,
    division: r["division"] as string,
    month: r["month"] as number,
    year: r["year"] as number,
    costCenter: r["costCenter"] as string,
  };
}

function toReceipt(r: Record<string, unknown>): Receipt {
  return {
    id: r["id"] as number,
    type: r["type"] as ReceiptType,
    amount: r["amount"] as number,
    currency: r["currency"] as Receipt["currency"],
    date: r["date"] as string,
    numberOfPeople: r["numberOfPeople"] as number,
    division: r["division"] as string,
    costCenter: r["costCenter"] as string,
    selfDeclaration: (r["selfDeclaration"] as number) === 1,
    note: r["note"] as string,
    photo: r["photo"] as string | null,
    budget: (r["budget"] as string) ?? "",
    status: r["status"] as string,
    export: (r["export"] as number) === 1,
  };
}

function toExchange(r: Record<string, unknown>): Exchange {
  return {
    id: r["id"] as number,
    date: r["date"] as string,
    amountSpent: r["amountSpent"] as number,
    spentCurrency: r["spentCurrency"] as Exchange["spentCurrency"],
    amountReceived: r["amountReceived"] as number,
    receivedCurrency: r["receivedCurrency"] as Exchange["receivedCurrency"],
    note: r["note"] as string,
    photo: r["photo"] as string | null,
    status: r["status"] as string,
    export: (r["export"] as number) === 1,
  };
}

function toLeg(r: Record<string, unknown>): Leg {
  return {
    id: r["id"] as number,
    type: r["type"] as string,
    status: r["status"] as string,
    departureDate: (r["departureDate"] as string) ?? "",
    departureHour: (r["departureHour"] as string) ?? "",
    departureCountry: (r["departureCountry"] as string) ?? "",
    departureCity: (r["departureCity"] as string) ?? "",
    arrivalDate: (r["arrivalDate"] as string) ?? "",
    arrivalHour: (r["arrivalHour"] as string) ?? "",
    arrivalCountry: (r["arrivalCountry"] as string) ?? "",
    arrivalCity: (r["arrivalCity"] as string) ?? "",
  };
}

function toTravel(r: Record<string, unknown>): Travel {
  return {
    id: r["id"] as number,
    lId: r["lId"] as number,
    num: r["num"] as number,
    departure: r["departure"] as string,
    departureDate: r["departureDate"] as string,
    departureHour: r["departureHour"] as string,
    departureCountry: r["departureCountry"] as string,
    departureCity: r["departureCity"] as string,
    arrival: r["arrival"] as string,
    returnDate: r["returnDate"] as string,
    arrivalHour: r["arrivalHour"] as string,
    arrivalCountry: r["arrivalCountry"] as string,
    arrivalCity: r["arrivalCity"] as string,
    budget: r["budget"] as number,
    placeOfStaying: r["placeOfStaying"] as string,
    nights: r["nights"] as number,
    arbitraryLocation: r["arbitraryLocation"] as string,
    ratePerNight: r["ratePerNight"] as number,
    currencyPN: r["currencyPN"] as Travel["currencyPN"],
    breakfast: (r["breakfast"] as number) === 1,
    paymentMethod: r["paymentMethod"] as string,
    hotelExtraFees: r["hotelExtraFees"] as number,
    currencyHEF: r["currencyHEF"] as Travel["currencyHEF"],
    description: r["description"] as string,
    photo: r["photo"] as string | null,
    export: (r["export"] as number) === 1,
  };
}

function toBudget(r: Record<string, unknown>): Budget {
  return {
    id: r["id"] as number,
    budgetNumber: r["budgetNumber"] as number,
    budgetNumberName: r["budgetNumberName"] as string,
  };
}

export const GeneralDB = {
  async get(): Promise<General | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM General LIMIT 1"
    );
    return row ? toGeneral(row) : null;
  },
  async upsert(data: Omit<General, "id">): Promise<void> {
    const db = await getDatabase();
    const existing = await GeneralDB.get();
    if (existing) {
      await db.runAsync(
        "UPDATE General SET workerNumber=?, division=?, month=?, year=?, costCenter=? WHERE id=?",
        [data.workerNumber, data.division, data.month, data.year, data.costCenter, existing.id]
      );
    } else {
      await db.runAsync(
        "INSERT INTO General (workerNumber, division, month, year, costCenter) VALUES (?, ?, ?, ?, ?)",
        [data.workerNumber, data.division, data.month, data.year, data.costCenter]
      );
    }
  },
};

export const ReceiptDB = {
  async getAll(): Promise<Receipt[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Receipts WHERE status != 'deleted' ORDER BY date DESC, id DESC"
    );
    return rows.map(toReceipt);
  },
  async insert(r: Omit<Receipt, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO Receipts (type, amount, currency, date, numberOfPeople, division, costCenter, selfDeclaration, note, photo, budget, status, export)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.type, r.amount, r.currency, r.date, r.numberOfPeople, r.division, r.costCenter,
       r.selfDeclaration ? 1 : 0, r.note, r.photo ?? null, r.budget ?? "", r.status, r.export ? 1 : 0]
    );
    return res.lastInsertRowId;
  },
  async update(r: Receipt): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE Receipts SET type=?, amount=?, currency=?, date=?, numberOfPeople=?, division=?, costCenter=?, selfDeclaration=?, note=?, photo=?, budget=?, status=?, export=? WHERE id=?`,
      [r.type, r.amount, r.currency, r.date, r.numberOfPeople, r.division, r.costCenter,
       r.selfDeclaration ? 1 : 0, r.note, r.photo ?? null, r.budget ?? "", r.status, r.export ? 1 : 0, r.id]
    );
  },
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE Receipts SET status='deleted' WHERE id = ?", [id]);
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Receipts WHERE id = ?", [id]);
  },
};

export const ExchangeDB = {
  async getAll(): Promise<Exchange[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Exchanges ORDER BY date DESC, id DESC"
    );
    return rows.map(toExchange);
  },
  async insert(e: Omit<Exchange, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO Exchanges (date, amountSpent, spentCurrency, amountReceived, receivedCurrency, note, photo, status, export)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.date, e.amountSpent, e.spentCurrency, e.amountReceived, e.receivedCurrency,
       e.note, e.photo ?? null, e.status, e.export ? 1 : 0]
    );
    return res.lastInsertRowId;
  },
  async update(e: Exchange): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE Exchanges SET date=?, amountSpent=?, spentCurrency=?, amountReceived=?, receivedCurrency=?, note=?, photo=?, status=?, export=? WHERE id=?`,
      [e.date, e.amountSpent, e.spentCurrency, e.amountReceived, e.receivedCurrency,
       e.note, e.photo ?? null, e.status, e.export ? 1 : 0, e.id]
    );
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Exchanges WHERE id = ?", [id]);
  },
};

export const LegDB = {
  async getAll(): Promise<Leg[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>("SELECT * FROM Legs");
    return rows.map(toLeg);
  },
  async getFirst(): Promise<Leg | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>("SELECT * FROM Legs ORDER BY id ASC LIMIT 1");
    return row ? toLeg(row) : null;
  },
  async upsertSingleton(l: Omit<Leg, "id">): Promise<Leg> {
    const db = await getDatabase();
    const existing = await LegDB.getFirst();
    if (existing) {
      await db.runAsync(
        `UPDATE Legs SET type=?, status=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrivalDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=? WHERE id=?`,
        [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
         l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity, existing.id]
      );
      return { ...l, id: existing.id };
    } else {
      const res = await db.runAsync(
        `INSERT INTO Legs (type, status, departureDate, departureHour, departureCountry, departureCity, arrivalDate, arrivalHour, arrivalCountry, arrivalCity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
         l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]
      );
      return { ...l, id: res.lastInsertRowId };
    }
  },
  async insert(l: Omit<Leg, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO Legs (type, status, departureDate, departureHour, departureCountry, departureCity, arrivalDate, arrivalHour, arrivalCountry, arrivalCity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
       l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]
    );
    return res.lastInsertRowId;
  },
  async update(l: Leg): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE Legs SET type=?, status=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrivalDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=? WHERE id=?`,
      [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
       l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity, l.id]
    );
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Legs WHERE id = ?", [id]);
  },
};

export const TravelDB = {
  async getAll(): Promise<Travel[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Travels ORDER BY id ASC"
    );
    return rows.map(toTravel);
  },
  async getByLegId(lId: number): Promise<Travel[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Travels WHERE lId = ? ORDER BY id ASC", [lId]
    );
    return rows.map(toTravel);
  },
  async getById(id: number): Promise<Travel | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM Travels WHERE id = ?", [id]
    );
    return row ? toTravel(row) : null;
  },
  async insert(t: Omit<Travel, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO Travels (lId, num, departure, departureDate, departureHour, departureCountry, departureCity, arrival, returnDate, arrivalHour, arrivalCountry, arrivalCity, budget, placeOfStaying, nights, arbitraryLocation, ratePerNight, currencyPN, breakfast, paymentMethod, hotelExtraFees, currencyHEF, description, photo, export)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.lId, t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
       t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity, t.budget, t.placeOfStaying,
       t.nights, t.arbitraryLocation, t.ratePerNight, t.currencyPN, t.breakfast ? 1 : 0, t.paymentMethod,
       t.hotelExtraFees, t.currencyHEF, t.description, t.photo ?? null, t.export ? 1 : 0]
    );
    return res.lastInsertRowId;
  },
  async update(t: Travel): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE Travels SET lId=?, num=?, departure=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrival=?, returnDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=?, budget=?, placeOfStaying=?, nights=?, arbitraryLocation=?, ratePerNight=?, currencyPN=?, breakfast=?, paymentMethod=?, hotelExtraFees=?, currencyHEF=?, description=?, photo=?, export=? WHERE id=?`,
      [t.lId, t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
       t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity, t.budget, t.placeOfStaying,
       t.nights, t.arbitraryLocation, t.ratePerNight, t.currencyPN, t.breakfast ? 1 : 0, t.paymentMethod,
       t.hotelExtraFees, t.currencyHEF, t.description, t.photo ?? null, t.export ? 1 : 0, t.id]
    );
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Travels WHERE id = ?", [id]);
  },
};

export const BudgetDB = {
  async getAll(): Promise<Budget[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>("SELECT * FROM Budgets");
    return rows.map(toBudget);
  },
  async insert(b: Omit<Budget, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      "INSERT INTO Budgets (budgetNumber, budgetNumberName) VALUES (?, ?)",
      [b.budgetNumber, b.budgetNumberName]
    );
    return res.lastInsertRowId;
  },
  async update(b: Budget): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE Budgets SET budgetNumber=?, budgetNumberName=? WHERE id=?",
      [b.budgetNumber, b.budgetNumberName, b.id]
    );
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM Budgets WHERE id = ?", [id]);
  },
};
