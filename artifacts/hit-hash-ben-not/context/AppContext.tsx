import * as SQLite from "expo-sqlite";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import {
  ATMDB,
  BudgetDB,
  ClientTransferDB,
  ExchangeDB,
  LegDB,
  MoneyTransferDB,
  ReceiptDB,
  TravelDB,
  GeneralDB,
  getDatabase,
  getTrashItems,
} from "@/db/database";
import type {
  ATMWithdrawal,
  Budget,
  ClientTransfer,
  Exchange,
  General,
  Leg,
  MoneyTransfer,
  Receipt,
  Travel,
  TrashItem,
} from "@/db/types";
import { runForegroundHealthCheck } from "@/db/dataProtection";
import { cleanupExpiredPhotos } from "@/db/photoStorage";

type Database = SQLite.SQLiteDatabase | null;

interface AppContextValue {
  db: Database;
  isDbReady: boolean;
  general: General | null;
  receipts: Receipt[];
  travels: Travel[];
  legs: Leg[];
  exchanges: Exchange[];
  atmWithdrawals: ATMWithdrawal[];
  budgets: Budget[];
  moneyTransfers: MoneyTransfer[];
  clientTransfers: ClientTransfer[];
  trashItems: TrashItem[];
  refreshGeneral: () => Promise<void>;
  refreshReceipts: () => Promise<void>;
  refreshTravels: () => Promise<void>;
  refreshLegs: () => Promise<void>;
  refreshExchanges: () => Promise<void>;
  refreshATM: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshMoneyTransfers: () => Promise<void>;
  refreshClientTransfers: () => Promise<void>;
  refreshTrash: () => Promise<void>;
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
  const [atmWithdrawals, setAtmWithdrawals] = useState<ATMWithdrawal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [moneyTransfers, setMoneyTransfers] = useState<MoneyTransfer[]>([]);
  const [clientTransfers, setClientTransfers] = useState<ClientTransfer[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

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

  const refreshATM = useCallback(async () => {
    const data = await ATMDB.getAll();
    setAtmWithdrawals(data);
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

  const refreshTrash = useCallback(async () => {
    const data = await getTrashItems();
    setTrashItems(data);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshGeneral(),
      refreshReceipts(),
      refreshTravels(),
      refreshLegs(),
      refreshExchanges(),
      refreshATM(),
      refreshBudgets(),
      refreshMoneyTransfers(),
      refreshClientTransfers(),
      refreshTrash(),
    ]);
  }, [refreshGeneral, refreshReceipts, refreshTravels, refreshLegs, refreshExchanges, refreshATM, refreshBudgets, refreshMoneyTransfers, refreshClientTransfers, refreshTrash]);

  const runStartupCleanup = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const expiredReceipts = await ReceiptDB.purgeExpired();
      const expiredExchanges = await ExchangeDB.purgeExpired();
      const allExpired = [...expiredReceipts, ...expiredExchanges];
      if (allExpired.length > 0) {
        await cleanupExpiredPhotos(allExpired);
      }
    } catch {}
  }, []);

  useEffect(() => {
    getDatabase()
      .then(async (database: SQLite.SQLiteDatabase | null) => {
        if (Platform.OS !== "web" && database !== null) {
          setDb(database);
          dbRef.current = database;
          await runForegroundHealthCheck(database);
        }
        setIsDbReady(true);
        await refreshAll();
        await runStartupCleanup();
      })
      .catch((err: unknown) => {
        console.error("Database init error:", err);
        setIsDbReady(true);
      });
  }, [refreshAll, runStartupCleanup]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (nextState === "active" && dbRef.current) {
          await runForegroundHealthCheck(dbRef.current).catch(() => {});
          await refreshAll().catch(() => {});
        }
      }
    );
    return () => subscription.remove();
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
        atmWithdrawals,
        budgets,
        moneyTransfers,
        clientTransfers,
        trashItems,
        refreshGeneral,
        refreshReceipts,
        refreshTravels,
        refreshLegs,
        refreshExchanges,
        refreshATM,
        refreshBudgets,
        refreshMoneyTransfers,
        refreshClientTransfers,
        refreshTrash,
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
