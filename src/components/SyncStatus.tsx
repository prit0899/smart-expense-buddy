import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, Check, LogOut } from "lucide-react";
import { getPendingCount, getLastSyncTime, syncToCloud } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function SyncStatus() {
  const { user, signOut } = useAuth();
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setPending(getPendingCount());
      setLastSync(getLastSyncTime());
    };
    update();
    const interval = setInterval(update, 5000);
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  const handleManualSync = async () => {
    if (!user || syncing) return;
    setSyncing(true);
    const result = await syncToCloud(user.id);
    setSyncing(false);
    setPending(getPendingCount());
    setLastSync(getLastSyncTime());
    if (result.success) {
      toast.success(`Synced ${result.synced} items`);
    } else {
      toast.error(result.error || "Sync failed");
    }
  };

  const handleSignOut = async () => {
    if (pending > 0) {
      toast.error("Sync pending changes before signing out");
      return;
    }
    await signOut();
  };

  if (!user) return null;

  const formatLastSync = () => {
    if (!lastSync) return "Never";
    const diff = Date.now() - new Date(lastSync).getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3600_000)}h ago`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleManualSync}
        disabled={syncing || pending === 0}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 text-xs transition-colors hover:bg-secondary"
      >
        {syncing ? (
          <RefreshCw className="w-3 h-3 text-primary animate-spin" />
        ) : pending > 0 ? (
          <Cloud className="w-3 h-3 text-accent" />
        ) : online ? (
          <Check className="w-3 h-3 text-primary" />
        ) : (
          <CloudOff className="w-3 h-3 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">
          {syncing ? "Syncing..." : pending > 0 ? `${pending} pending` : formatLastSync()}
        </span>
      </button>
      <button
        onClick={handleSignOut}
        className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
        title="Sign out"
      >
        <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
