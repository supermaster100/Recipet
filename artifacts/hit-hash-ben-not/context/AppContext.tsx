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
  ExchangeDB,
  LegDB,
  ReceiptDB,
  TravelDB,
  GeneralDB,
  getDatabase,
} from "@/db/database";
import type {
  Budget,
  Exchange,
  General,
  Leg,
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
  refreshGeneral: () => Promise<void>;
  refreshReceipts: () => Promise<void>;
  refreshTravels: () => Promise<void>;
  refreshLegs: () => Promise<void>;
  refreshExchanges: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
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

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshGeneral(),
      refreshReceipts(),
      refreshTravels(),
      refreshLegs(),
      refreshExchanges(),
      refreshBudgets(),
    ]);
  }, [refreshGeneral, refreshReceipts, refreshTravels, refreshLegs, refreshExchanges, refreshBudgets]);

  useEffect(() => {
    getDatabase()
      .then((database) => {
        if (Platform.OS !== "web") {
          setDb(database as SQLite.SQLiteDatabase);
        }
        setIsDbReady(true);
        return refreshAll();
      })
      .catch((err) => {
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
        refreshGeneral,
        refreshReceipts,
        refreshTravels,
        refreshLegs,
        refreshExchanges,
        refreshBudgets,
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
