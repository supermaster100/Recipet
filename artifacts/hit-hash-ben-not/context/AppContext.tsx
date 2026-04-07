import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  BudgetDB,
  ExchangeDB,
  GeneralExpenseDB,
  TravelDB,
  getDatabase,
} from "@/db/database";
import type {
  Budget,
  Exchange,
  GeneralExpense,
  Travel,
} from "@/db/types";

interface AppContextValue {
  isDbReady: boolean;
  expenses: GeneralExpense[];
  travels: Travel[];
  exchanges: Exchange[];
  budgets: Budget[];
  refreshExpenses: () => Promise<void>;
  refreshTravels: () => Promise<void>;
  refreshExchanges: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [expenses, setExpenses] = useState<GeneralExpense[]>([]);
  const [travels, setTravels] = useState<Travel[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const refreshExpenses = useCallback(async () => {
    const data = await GeneralExpenseDB.getAll();
    setExpenses(data);
  }, []);

  const refreshTravels = useCallback(async () => {
    const data = await TravelDB.getAll();
    setTravels(data);
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
      refreshExpenses(),
      refreshTravels(),
      refreshExchanges(),
      refreshBudgets(),
    ]);
  }, [refreshExpenses, refreshTravels, refreshExchanges, refreshBudgets]);

  useEffect(() => {
    getDatabase()
      .then(() => {
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
        isDbReady,
        expenses,
        travels,
        exchanges,
        budgets,
        refreshExpenses,
        refreshTravels,
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
