import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/StatCard";
import SpendingChart from "@/components/SpendingChart";
import TransactionItem from "@/components/TransactionItem";
import SyncStatus from "@/components/SyncStatus";
import { getTransactions, getStats, getCategoryBreakdown } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { startAutoSync } from "@/lib/syncEngine";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const transactions = useMemo(() => getTransactions(), []);
  const stats = useMemo(() => getStats(transactions), [transactions]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
  const recent = transactions.slice(0, 4);

  useEffect(() => {
    if (!user) return;
    const cleanup = startAutoSync(user.id, ({ synced }) => {
      if (synced > 0) toast.success(`Auto-synced ${synced} items`, { duration: 2000 });
    });
    return cleanup;
  }, [user]);

  return (
    <div className="min-h-screen pb-24 safe-top">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Welcome back</p>
            <h1 className="text-2xl font-display font-bold text-foreground mt-1">FinTrack</h1>
          </div>
          <SyncStatus />
        </div>
      </header>

      <div className="px-5 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <StatCard type="balance" amount={stats.balance} />
        </div>
        <StatCard type="income" amount={stats.totalIncome} />
        <StatCard type="expense" amount={stats.totalExpense} />
      </div>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Spending Breakdown</h2>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <SpendingChart data={breakdown} />
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
          <button onClick={() => navigate("/transactions")} className="text-xs text-primary font-medium">
            See all
          </button>
        </div>
        <div className="space-y-2">
          {recent.map(t => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
