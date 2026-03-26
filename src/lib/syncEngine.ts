import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "./types";

const SYNC_QUEUE_KEY = "fintrack-sync-queue";
const LAST_SYNC_KEY = "fintrack-last-sync";

interface SyncQueueItem {
  action: "upsert" | "delete";
  transaction?: Transaction;
  id?: string;
  timestamp: number;
}

function getQueue(): SyncQueueItem[] {
  const raw = localStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setQueue(q: SyncQueueItem[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q));
}

export function queueUpsert(t: Transaction) {
  const q = getQueue();
  // Remove existing entries for same id
  const filtered = q.filter(item => item.id !== t.id && item.transaction?.id !== t.id);
  filtered.push({ action: "upsert", transaction: t, id: t.id, timestamp: Date.now() });
  setQueue(filtered);
}

export function queueDelete(id: string) {
  const q = getQueue();
  const filtered = q.filter(item => item.id !== id && item.transaction?.id !== id);
  filtered.push({ action: "delete", id, timestamp: Date.now() });
  setQueue(filtered);
}

export function getPendingCount(): number {
  return getQueue().length;
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export async function syncToCloud(userId: string): Promise<{ success: boolean; synced: number; error?: string }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: true, synced: 0 };

  let synced = 0;

  for (const item of queue) {
    try {
      if (item.action === "upsert" && item.transaction) {
        const { error } = await supabase.from("transactions").upsert({
          id: item.transaction.id,
          user_id: userId,
          type: item.transaction.type,
          amount: item.transaction.amount,
          category: item.transaction.category,
          description: item.transaction.description,
          date: item.transaction.date,
          receipt_url: item.transaction.receiptUrl || null,
          synced_at: new Date().toISOString(),
        }, { onConflict: "id" });
        if (error) throw error;
      } else if (item.action === "delete" && item.id) {
        const { error } = await supabase.from("transactions").delete().eq("id", item.id);
        if (error) throw error;
      }
      synced++;
    } catch (err: any) {
      console.error("Sync error:", err);
      // Keep remaining items in queue
      setQueue(queue.slice(synced));
      return { success: false, synced, error: err.message };
    }
  }

  setQueue([]);
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  return { success: true, synced };
}

export async function pullFromCloud(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Pull error:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type as Transaction["type"],
    amount: Number(row.amount),
    category: row.category as Transaction["category"],
    description: row.description,
    date: row.date,
    receiptUrl: row.receipt_url || undefined,
  }));
}

// Auto-sync when online
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(userId: string, onSync?: (result: { synced: number }) => void) {
  stopAutoSync();

  const doSync = async () => {
    if (!navigator.onLine) return;
    const pending = getPendingCount();
    if (pending === 0) return;
    const result = await syncToCloud(userId);
    if (result.synced > 0 && onSync) onSync({ synced: result.synced });
  };

  // Sync immediately
  doSync();

  // Then every 30 seconds
  syncInterval = setInterval(doSync, 30_000);

  // Also sync when coming back online
  window.addEventListener("online", doSync);

  return () => {
    stopAutoSync();
    window.removeEventListener("online", doSync);
  };
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
