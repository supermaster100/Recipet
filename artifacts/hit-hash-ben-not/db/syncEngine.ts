import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/services/supabase";

const OFFLINE_QUEUE_KEY = "sync_offline_queue";
const LAST_PULL_KEY = "sync_last_pull_";

export type SyncTableName =
  | "General"
  | "Receipts"
  | "Travels"
  | "Legs"
  | "Exchanges"
  | "ATMWithdrawals"
  | "MoneyTransfers"
  | "ClientTransfers"
  | "CashWalletLedger"
  | "CostCenters";

interface OfflineOp {
  table: SyncTableName;
  localId: string;
  updatedAt: number;
  payload: Record<string, unknown>;
}

export class SyncEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getPendingCount(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return 0;
      const queue: OfflineOp[] = JSON.parse(raw);
      return queue.length;
    } catch {
      return 0;
    }
  }

  async queueOfflineWrite(op: OfflineOp): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: OfflineOp[] = raw ? JSON.parse(raw) : [];
      const idx = queue.findIndex(
        (q) => q.table === op.table && q.localId === op.localId
      );
      if (idx >= 0) {
        queue[idx] = op;
      } else {
        queue.push(op);
      }
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  }

  async flushOfflineQueue(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const queue: OfflineOp[] = JSON.parse(raw);
      if (queue.length === 0) return;

      const remaining: OfflineOp[] = [];
      for (const op of queue) {
        try {
          // TODO: upsert op.payload into Supabase table op.table
          // await supabase.from(op.table).upsert({ ...op.payload, user_id: this.userId }, { onConflict: "local_id" });
        } catch {
          remaining.push(op);
        }
      }
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } catch {}
  }

  async pushChanges(table: SyncTableName): Promise<void> {
    // TODO: read rows from SQLite where synced_at IS NULL OR updated_at > synced_at
    // TODO: upsert each row into Supabase with user_id = this.userId
    // TODO: update synced_at on successfully pushed rows
    void table;
    void supabase;
  }

  async pushDeletes(table: SyncTableName): Promise<void> {
    // TODO: read rows from SQLite where deleted_at IS NOT NULL AND synced_at IS NULL
    // TODO: soft-delete (update deleted_at) in Supabase matching local_id
    // TODO: mark synced_at on those rows
    void table;
  }

  async pullChanges(table: SyncTableName): Promise<void> {
    // TODO: fetch rows from Supabase where user_id = this.userId AND updated_at > last pull timestamp
    // TODO: upsert each remote row into SQLite by local_id (last-write-wins by updated_at)
    // TODO: store new pull timestamp via AsyncStorage key LAST_PULL_KEY + table
    void table;
    void LAST_PULL_KEY;
  }

  async syncTable(table: SyncTableName): Promise<void> {
    await this.pushDeletes(table);
    await this.pushChanges(table);
    await this.pullChanges(table);
  }

  async syncAll(): Promise<void> {
    await this.flushOfflineQueue();
    const tables: SyncTableName[] = [
      "General",
      "Receipts",
      "Travels",
      "Legs",
      "Exchanges",
      "ATMWithdrawals",
      "MoneyTransfers",
      "ClientTransfers",
      "CashWalletLedger",
      "CostCenters",
    ];
    for (const table of tables) {
      await this.syncTable(table);
    }
  }
}
