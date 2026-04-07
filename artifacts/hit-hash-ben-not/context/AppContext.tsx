import * as SQLite from "expo-sqlite";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

import {
  BudgetDB,
  ClientTransferDB,
  ExchangeDB,
  LegDB,
  MoneyTransferDB,
  ReceiptDB,
  TravelDB,
  GeneralDB,
  getDatabase,
} from "@/db/database";
import type {
  Budget,
  ClientTransfer,
  Exchange,
  General,
  Leg,
  MoneyTransfer,
  Receipt,
  Travel,
} from "@/db/types";

type Database = SQLite.SQLiteDatabase | null;

interface AppContextValue {
  db: Database;
  isDbReady: boolean;
  general: General | null;
  receipts: Receipt[];
  travels: Travel[];
  legs: Leg[];
  exchanges: Exchange[];
  budgets: Budget[];
  moneyTransfers: MoneyTransfer[];
  clientTransfers: ClientTransfer[];
  refreshGeneral: () => Promise<void>;
  refreshReceipts: () => Promise<void>;
  refreshTravels: () => Promise<void>;
  refreshLegs: () => Promise<void>;
  refreshExchanges: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshMoneyTransfers: () => Promise<void>;
  refreshClientTransfers: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [general, setGeneral] = useState<General | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [travels, setTravels] = useState<Travel[]>([]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [moneyTransfers, setMoneyTransfers] = useState<MoneyTransfer[]>([]);
  const [clientTransfers, setClientTransfers] = useState<ClientTransfer[]>([]);

  const refreshGeneral = useCallback(async () => {
    const data = await GeneralDB.get();
    setGeneral(data);
  }, []);

  const refreshReceipts = useCallback(async () => {
    const data = await ReceiptDB.getAll();
    setReceipts(data);
  }, []);

  const refreshTravels = useCallback(async () => {
    const data = await TravelDB.getAll();
    setTravels(data);
  }, []);

  const refreshLegs = useCallback(async () => {
    const data = await LegDB.getAll();
    setLegs(data);
  }, []);

  const refreshExchanges = useCallback(async () => {
    const data = await ExchangeDB.getAll();
    setExchanges(data);
  }, []);

  const refreshBudgets = useCallback(async () => {
    const data = await BudgetDB.getAll();
    setBudgets(data);
  }, []);

  const refreshMoneyTransfers = useCallback(async () => {
    const data = await MoneyTransferDB.getAll();
    setMoneyTransfers(data);
  }, []);

  const refreshClientTransfers = useCallback(async () => {
    const data = await ClientTransferDB.getAll();
    setClientTransfers(data);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshGeneral(),
      refreshReceipts(),
      refreshTravels(),
      refreshLegs(),
      refreshExchanges(),
      refreshBudgets(),
      refreshMoneyTransfers(),
      refreshClientTransfers(),
    ]);
  }, [refreshGeneral, refreshReceipts, refreshTravels, refreshLegs, refreshExchanges, refreshBudgets, refreshMoneyTransfers, refreshClientTransfers]);

  useEffect(() => {
    getDatabase()
      .then((database: SQLite.SQLiteDatabase | null) => {
        if (Platform.OS !== "web" && database !== null) {
          setDb(database);
        }
        setIsDbReady(true);
        return refreshAll();
      })
      .catch((err: unknown) => {
        console.error("Database init error:", err);
        setIsDbReady(true);
      });
  }, [refreshAll]);

  return (
    <AppContext.Provider
      value={{
        db,
        isDbReady,
        general,
        receipts,
        travels,
        legs,
        exchanges,
        budgets,
        moneyTransfers,
        clientTransfers,
        refreshGeneral,
        refreshReceipts,
        refreshTravels,
        refreshLegs,
        refreshExchanges,
        refreshBudgets,
        refreshMoneyTransfers,
        refreshClientTransfers,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
