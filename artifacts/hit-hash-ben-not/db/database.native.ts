import * as SQLite from "expo-sqlite";
import type {
  Budget,
  ClientTransfer,
  Exchange,
  General,
  Leg,
  MoneyTransfer,
  Receipt,
  ReceiptType,
  Travel,
  TrashItem,
} from "./types";
import { runMigrationWithRollback, takeBackup } from "./dataProtection";

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
      photo_checksum TEXT,
      budget TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      export INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT
    );
  `);

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
      photo_checksum TEXT,
      status TEXT NOT NULL DEFAULT '',
      export INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT
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
      arrivalCity TEXT NOT NULL DEFAULT '',
      deleted_at TEXT
    );
  `);


  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS MoneyTransfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiptName TEXT NOT NULL DEFAULT '',
      giverName TEXT NOT NULL DEFAULT '',
      workerNumber TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      photo TEXT,
      createdAt TEXT NOT NULL DEFAULT ''
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ClientTransfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL DEFAULT '',
      giverName TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'ILS',
      photo TEXT,
      createdAt TEXT NOT NULL DEFAULT ''
    );
  `);


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
      photo_checksum TEXT,
      export INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      FOREIGN KEY (lId) REFERENCES Legs(id) ON DELETE CASCADE
    );
  `);

  await runSchemaMigrations(db);
}

async function runSchemaMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await takeBackup("pre_schema_migration").catch(() => {});
  await runMigrationWithRollback(db, async () => {
    await db.execAsync(`ALTER TABLE Receipts ADD COLUMN budget TEXT NOT NULL DEFAULT ''`).catch(() => {});
    await db.execAsync(`ALTER TABLE Receipts ADD COLUMN photo_checksum TEXT`).catch(() => {});
    await db.execAsync(`ALTER TABLE Receipts ADD COLUMN deleted_at TEXT`).catch(() => {});
    await db.execAsync(`ALTER TABLE Exchanges ADD COLUMN photo_checksum TEXT`).catch(() => {});
    await db.execAsync(`ALTER TABLE Exchanges ADD COLUMN deleted_at TEXT`).catch(() => {});
    const legMigrations = [
      "ALTER TABLE Legs ADD COLUMN departureDate TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN departureHour TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN departureCountry TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN departureCity TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN arrivalDate TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN arrivalHour TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN arrivalCountry TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN arrivalCity TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE Legs ADD COLUMN deleted_at TEXT",
    ];
    for (const sql of legMigrations) {
      await db.execAsync(sql).catch(() => {});
    }
    await db.execAsync(`ALTER TABLE Travels ADD COLUMN photo_checksum TEXT`).catch(() => {});
    await db.execAsync(`ALTER TABLE Travels ADD COLUMN deleted_at TEXT`).catch(() => {});
  });
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
    photo_checksum: (r["photo_checksum"] as string | null) ?? null,
    budget: (r["budget"] as string) ?? "",
    status: r["status"] as string,
    export: (r["export"] as number) === 1,
    deleted_at: (r["deleted_at"] as string | null) ?? null,
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
    photo_checksum: (r["photo_checksum"] as string | null) ?? null,
    status: r["status"] as string,
    export: (r["export"] as number) === 1,
    deleted_at: (r["deleted_at"] as string | null) ?? null,
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
    deleted_at: (r["deleted_at"] as string | null) ?? null,
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
    photo_checksum: (r["photo_checksum"] as string | null) ?? null,
    export: (r["export"] as number) === 1,
    deleted_at: (r["deleted_at"] as string | null) ?? null,
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
    await db.withTransactionAsync(async () => {
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
    });
  },
};

export const ReceiptDB = {
  async getAll(): Promise<Receipt[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Receipts WHERE deleted_at IS NULL ORDER BY date DESC, id DESC"
    );
    return rows.map(toReceipt);
  },
  async getDeleted(): Promise<Receipt[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Receipts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    return rows.map(toReceipt);
  },
  async insert(r: Omit<Receipt, "id">): Promise<number> {
    const db = await getDatabase();
    let lastId = 0;
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        `INSERT INTO Receipts (type, amount, currency, date, numberOfPeople, division, costCenter, selfDeclaration, note, photo, photo_checksum, budget, status, export, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [r.type, r.amount, r.currency, r.date, r.numberOfPeople, r.division, r.costCenter,
         r.selfDeclaration ? 1 : 0, r.note, r.photo ?? null, r.photo_checksum ?? null,
         r.budget ?? "", r.status, r.export ? 1 : 0]
      );
      lastId = res.lastInsertRowId;
    });
    return lastId;
  },
  async update(r: Receipt): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE Receipts SET type=?, amount=?, currency=?, date=?, numberOfPeople=?, division=?, costCenter=?, selfDeclaration=?, note=?, photo=?, photo_checksum=?, budget=?, status=?, export=? WHERE id=?`,
        [r.type, r.amount, r.currency, r.date, r.numberOfPeople, r.division, r.costCenter,
         r.selfDeclaration ? 1 : 0, r.note, r.photo ?? null, r.photo_checksum ?? null,
         r.budget ?? "", r.status, r.export ? 1 : 0, r.id]
      );
    });
  },
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "UPDATE Receipts SET deleted_at=? WHERE id=?",
        [new Date().toISOString(), id]
      );
    });
  },
  async restore(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE Receipts SET deleted_at=NULL WHERE id=?", [id]);
    });
  },
  async hardDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM Receipts WHERE id=?", [id]);
    });
  },
  async purgeExpired(): Promise<Array<{ photo: string | null; deleted_at: string | null }>> {
    const db = await getDatabase();
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const expired = await db.getAllAsync<Record<string, unknown>>(
      "SELECT photo, deleted_at FROM Receipts WHERE deleted_at IS NOT NULL AND deleted_at < ?",
      [cutoff]
    );
    if (expired.length > 0) {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "DELETE FROM Receipts WHERE deleted_at IS NOT NULL AND deleted_at < ?",
          [cutoff]
        );
      });
    }
    return expired.map((r) => ({ photo: r["photo"] as string | null, deleted_at: r["deleted_at"] as string | null }));
  },
  async delete(id: number): Promise<void> {
    return ReceiptDB.softDelete(id);
  },
};

export const ExchangeDB = {
  async getAll(): Promise<Exchange[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Exchanges WHERE deleted_at IS NULL ORDER BY date DESC, id DESC"
    );
    return rows.map(toExchange);
  },
  async getDeleted(): Promise<Exchange[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Exchanges WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    return rows.map(toExchange);
  },
  async insert(e: Omit<Exchange, "id">): Promise<number> {
    const db = await getDatabase();
    let lastId = 0;
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        `INSERT INTO Exchanges (date, amountSpent, spentCurrency, amountReceived, receivedCurrency, note, photo, photo_checksum, status, export, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [e.date, e.amountSpent, e.spentCurrency, e.amountReceived, e.receivedCurrency,
         e.note, e.photo ?? null, e.photo_checksum ?? null, e.status, e.export ? 1 : 0]
      );
      lastId = res.lastInsertRowId;
    });
    return lastId;
  },
  async update(e: Exchange): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE Exchanges SET date=?, amountSpent=?, spentCurrency=?, amountReceived=?, receivedCurrency=?, note=?, photo=?, photo_checksum=?, status=?, export=? WHERE id=?`,
        [e.date, e.amountSpent, e.spentCurrency, e.amountReceived, e.receivedCurrency,
         e.note, e.photo ?? null, e.photo_checksum ?? null, e.status, e.export ? 1 : 0, e.id]
      );
    });
  },
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE Exchanges SET deleted_at=? WHERE id=?", [new Date().toISOString(), id]);
    });
  },
  async restore(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE Exchanges SET deleted_at=NULL WHERE id=?", [id]);
    });
  },
  async hardDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM Exchanges WHERE id=?", [id]);
    });
  },
  async purgeExpired(): Promise<Array<{ photo: string | null; deleted_at: string | null }>> {
    const db = await getDatabase();
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const expired = await db.getAllAsync<Record<string, unknown>>(
      "SELECT photo, deleted_at FROM Exchanges WHERE deleted_at IS NOT NULL AND deleted_at < ?",
      [cutoff]
    );
    if (expired.length > 0) {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "DELETE FROM Exchanges WHERE deleted_at IS NOT NULL AND deleted_at < ?",
          [cutoff]
        );
      });
    }
    return expired.map((r) => ({ photo: r["photo"] as string | null, deleted_at: r["deleted_at"] as string | null }));
  },
  async delete(id: number): Promise<void> {
    return ExchangeDB.softDelete(id);
  },
};

export const LegDB = {
  async getAll(): Promise<Leg[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Legs WHERE deleted_at IS NULL"
    );
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
    let result: Leg;
    await db.withTransactionAsync(async () => {
      if (existing) {
        await db.runAsync(
          `UPDATE Legs SET type=?, status=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrivalDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=? WHERE id=?`,
          [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
           l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity, existing.id]
        );
        result = { ...l, id: existing.id };
      } else {
        const res = await db.runAsync(
          `INSERT INTO Legs (type, status, departureDate, departureHour, departureCountry, departureCity, arrivalDate, arrivalHour, arrivalCountry, arrivalCity, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
          [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
           l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]
        );
        result = { ...l, id: res.lastInsertRowId };
      }
    });
    return result!;
  },
  async insert(l: Omit<Leg, "id">): Promise<number> {
    const db = await getDatabase();
    let lastId = 0;
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        `INSERT INTO Legs (type, status, departureDate, departureHour, departureCountry, departureCity, arrivalDate, arrivalHour, arrivalCountry, arrivalCity, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
         l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity]
      );
      lastId = res.lastInsertRowId;
    });
    return lastId;
  },
  async update(l: Leg): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE Legs SET type=?, status=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrivalDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=? WHERE id=?`,
        [l.type, l.status, l.departureDate, l.departureHour, l.departureCountry, l.departureCity,
         l.arrivalDate, l.arrivalHour, l.arrivalCountry, l.arrivalCity, l.id]
      );
    });
  },
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE Legs SET deleted_at=? WHERE id=?", [new Date().toISOString(), id]);
    });
  },
  async delete(id: number): Promise<void> {
    return LegDB.softDelete(id);
  },
};

export const TravelDB = {
  async getAll(): Promise<Travel[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Travels WHERE deleted_at IS NULL ORDER BY departureDate DESC, id DESC"
    );
    return rows.map(toTravel);
  },
  async getByLegId(lId: number): Promise<Travel[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM Travels WHERE lId = ? AND deleted_at IS NULL ORDER BY id ASC", [lId]
    );
    return rows.map(toTravel);
  },
  async getById(id: number): Promise<Travel | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      "SELECT * FROM Travels WHERE id=?", [id]
    );
    return row ? toTravel(row) : null;
  },
  async insert(t: Omit<Travel, "id">): Promise<number> {
    const db = await getDatabase();
    let lastId = 0;
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        `INSERT INTO Travels (lId, num, departure, departureDate, departureHour, departureCountry, departureCity, arrival, returnDate, arrivalHour, arrivalCountry, arrivalCity, budget, placeOfStaying, nights, arbitraryLocation, ratePerNight, currencyPN, breakfast, paymentMethod, hotelExtraFees, currencyHEF, description, photo, photo_checksum, export, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [t.lId, t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
         t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity, t.budget, t.placeOfStaying,
         t.nights, t.arbitraryLocation, t.ratePerNight, t.currencyPN, t.breakfast ? 1 : 0, t.paymentMethod,
         t.hotelExtraFees, t.currencyHEF, t.description, t.photo ?? null, t.photo_checksum ?? null, t.export ? 1 : 0]
      );
      lastId = res.lastInsertRowId;
    });
    return lastId;
  },
  async update(t: Travel): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE Travels SET lId=?, num=?, departure=?, departureDate=?, departureHour=?, departureCountry=?, departureCity=?, arrival=?, returnDate=?, arrivalHour=?, arrivalCountry=?, arrivalCity=?, budget=?, placeOfStaying=?, nights=?, arbitraryLocation=?, ratePerNight=?, currencyPN=?, breakfast=?, paymentMethod=?, hotelExtraFees=?, currencyHEF=?, description=?, photo=?, photo_checksum=?, export=? WHERE id=?`,
        [t.lId, t.num, t.departure, t.departureDate, t.departureHour, t.departureCountry, t.departureCity,
         t.arrival, t.returnDate, t.arrivalHour, t.arrivalCountry, t.arrivalCity, t.budget, t.placeOfStaying,
         t.nights, t.arbitraryLocation, t.ratePerNight, t.currencyPN, t.breakfast ? 1 : 0, t.paymentMethod,
         t.hotelExtraFees, t.currencyHEF, t.description, t.photo ?? null, t.photo_checksum ?? null, t.export ? 1 : 0, t.id]
      );
    });
  },
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE Travels SET deleted_at=? WHERE id=?", [new Date().toISOString(), id]);
    });
  },
  async delete(id: number): Promise<void> {
    return TravelDB.softDelete(id);
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
    let lastId = 0;
    await db.withTransactionAsync(async () => {
      const res = await db.runAsync(
        "INSERT INTO Budgets (budgetNumber, budgetNumberName) VALUES (?, ?)",
        [b.budgetNumber, b.budgetNumberName]
      );
      lastId = res.lastInsertRowId;
    });
    return lastId;
  },
  async update(b: Budget): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "UPDATE Budgets SET budgetNumber=?, budgetNumberName=? WHERE id=?",
        [b.budgetNumber, b.budgetNumberName, b.id]
      );
    });
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM Budgets WHERE id=?", [id]);
    });
  },
};

function toMoneyTransfer(r: Record<string, unknown>): MoneyTransfer {
  return {
    id: r["id"] as number,
    receiptName: r["receiptName"] as string,
    giverName: r["giverName"] as string,
    workerNumber: r["workerNumber"] as string,
    date: r["date"] as string,
    amount: r["amount"] as number,
    currency: r["currency"] as MoneyTransfer["currency"],
    photo: r["photo"] as string | null,
    createdAt: r["createdAt"] as string,
  };
}

function toClientTransfer(r: Record<string, unknown>): ClientTransfer {
  return {
    id: r["id"] as number,
    clientName: r["clientName"] as string,
    giverName: r["giverName"] as string,
    date: r["date"] as string,
    amount: r["amount"] as number,
    currency: r["currency"] as ClientTransfer["currency"],
    photo: r["photo"] as string | null,
    createdAt: r["createdAt"] as string,
  };
}

export const MoneyTransferDB = {
  async getAll(): Promise<MoneyTransfer[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM MoneyTransfers ORDER BY date DESC, id DESC"
    );
    return rows.map(toMoneyTransfer);
  },
  async insert(m: Omit<MoneyTransfer, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO MoneyTransfers (receiptName, giverName, workerNumber, date, amount, currency, photo, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.receiptName, m.giverName, m.workerNumber, m.date, m.amount, m.currency, m.photo ?? null, m.createdAt]
    );
    return res.lastInsertRowId;
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM MoneyTransfers WHERE id = ?", [id]);
  },
};

export const ClientTransferDB = {
  async getAll(): Promise<ClientTransfer[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM ClientTransfers ORDER BY date DESC, id DESC"
    );
    return rows.map(toClientTransfer);
  },
  async insert(c: Omit<ClientTransfer, "id">): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO ClientTransfers (clientName, giverName, date, amount, currency, photo, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.clientName, c.giverName, c.date, c.amount, c.currency, c.photo ?? null, c.createdAt]
    );
    return res.lastInsertRowId;
  },
  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM ClientTransfers WHERE id = ?", [id]);
  },
};

export async function getTrashItems(): Promise<TrashItem[]> {
  const db = await getDatabase();
  const receipts = await db.getAllAsync<Record<string, unknown>>(
    "SELECT id, type, amount, currency, date, deleted_at, photo FROM Receipts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
  );
  const exchanges = await db.getAllAsync<Record<string, unknown>>(
    "SELECT id, 'EXCHANGE' as type, amountSpent as amount, spentCurrency as currency, date, deleted_at, photo FROM Exchanges WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
  );
  const receiptItems: TrashItem[] = receipts.map((r) => ({
    id: r["id"] as number,
    tableSource: "Receipts" as const,
    type: r["type"] as string,
    amount: r["amount"] as number,
    currency: r["currency"] as string,
    date: r["date"] as string,
    deleted_at: r["deleted_at"] as string,
    photo: r["photo"] as string | null,
  }));
  const exchangeItems: TrashItem[] = exchanges.map((r) => ({
    id: r["id"] as number,
    tableSource: "Exchanges" as const,
    type: "EXCHANGE",
    amount: r["amount"] as number,
    currency: r["currency"] as string,
    date: r["date"] as string,
    deleted_at: r["deleted_at"] as string,
    photo: r["photo"] as string | null,
  }));
  return [...receiptItems, ...exchangeItems].sort(
    (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
  );
}
