import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { SyncEngine } from "@/db/syncEngine";

const LAST_SYNCED_KEY = "sync_last_synced_at";

type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncContextValue {
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  pendingCount: number;
  isOnline: boolean;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export function SyncProvider({ children, userId }: SyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const engineRef = useRef<SyncEngine | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNCED_KEY).then((raw) => {
      if (raw) setLastSyncedAt(Number(raw));
    });
  }, []);

  useEffect(() => {
    if (userId) {
      engineRef.current = new SyncEngine(userId);
    } else {
      engineRef.current = null;
    }
  }, [userId]);

  const checkOnline = useCallback(async (): Promise<boolean> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      return online;
    } catch {
      return false;
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (syncingRef.current || !engineRef.current) return;
    const online = await checkOnline();
    if (!online) {
      setSyncStatus("offline");
      return;
    }
    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      const engine = engineRef.current;
      await engine.syncAll();
      const now = Date.now();
      setLastSyncedAt(now);
      await AsyncStorage.setItem(LAST_SYNCED_KEY, String(now));
      const pending = await engine.getPendingCount();
      setPendingCount(pending);
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [checkOnline]);

  useEffect(() => {
    if (!userId) return;
    checkOnline().then((online) => {
      if (online) triggerSync();
    });
  }, [userId, checkOnline, triggerSync]);

  return (
    <SyncContext.Provider
      value={{ syncStatus, lastSyncedAt, pendingCount, isOnline, triggerSync }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncContext must be used within SyncProvider");
  return ctx;
}
