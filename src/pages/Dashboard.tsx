import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import SpendingChart from "@/components/SpendingChart";
import TransactionItem from "@/components/TransactionItem";
import SyncStatus from "@/components/SyncStatus";
import BudgetManager from "@/components/BudgetManager";
import StreakCard from "@/components/StreakCard";
import SmartAlerts from "@/components/SmartAlerts";
import PageTransition from "@/components/PageTransition";
import AnimatedCard from "@/components/AnimatedCard";
import { getTransactions, getStats, getCategoryBreakdown } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { startAutoSync } from "@/lib/syncEngine";
import { calculateStreaks, getSmartAlerts } from "@/lib/streaks";
import { toast } from "sonner";
import { Target, Lightbulb, Flame, Bell } from "lucide-react";

function getInsights(transactions: ReturnType<typeof getTransactions>) {
  const insights: string[] = [];
  const expenses = transactions.filter(t => t.type === "expense");
  const incomes = transactions.filter(t => t.type === "income");

  if (expenses.length > 0) {
    const topCat = expenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    const top = Object.entries(topCat).sort((a, b) => b[1] - a[1])[0];
    if (top) insights.push(`🔥 Your biggest expense category is ${top[0]} at $${top[1].toFixed(0)}`);
  }

  if (incomes.length > 0 && expenses.length > 0) {
    const totalInc = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const saveRate = ((totalInc - totalExp) / totalInc * 100).toFixed(0);
    insights.push(`💰 Your savings rate is ${saveRate}%`);
  }

  const today = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && t.type === "expense";
  });
  if (thisMonth.length > 0) {
    const monthTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyAvg = monthTotal / today.getDate();
    const projected = dailyAvg * daysInMonth;
    insights.push(`📊 Projected spending this month: $${projected.toFixed(0)}`);
  }

  return insights;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const transactions = useMemo(() => getTransactions(), []);
  const stats = useMemo(() => getStats(transactions), [transactions]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
  const recent = transactions.slice(0, 4);
  const insights = useMemo(() => getInsights(transactions), [transactions]);
  const streaks = useMemo(() => calculateStreaks(transactions), [transactions]);
  const smartAlerts = useMemo(() => getSmartAlerts(transactions), [transactions]);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [transactions]);

  useEffect(() => {
    if (!user) return;
    const cleanup = startAutoSync(user.id, ({ synced }) => {
      if (synced > 0) toast.success(`Auto-synced ${synced} items`, { duration: 2000 });
    });
    return cleanup;
  }, [user]);

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 safe-top">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-5 pt-6 pb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Welcome back</p>
              <h1 className="text-2xl font-display font-bold text-foreground mt-1">FinTrack</h1>
            </div>
            <SyncStatus />
          </div>
        </motion.header>

        <div className="px-5 grid grid-cols-2 gap-3">
          <AnimatedCard delay={0.05} className="col-span-2">
            <StatCard type="balance" amount={stats.balance} />
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <StatCard type="income" amount={stats.totalIncome} />
          </AnimatedCard>
          <AnimatedCard delay={0.15}>
            <StatCard type="expense" amount={stats.totalExpense} />
          </AnimatedCard>
        </div>

        {/* Streak Tracking */}
        <AnimatedCard delay={0.2} className="mt-5 px-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-foreground">Tracking Streaks</h2>
          </div>
          <StreakCard streaks={streaks} />
        </AnimatedCard>

        {/* Smart Alerts */}
        {smartAlerts.length > 0 && (
          <AnimatedCard delay={0.25} className="mt-5 px-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-semibold text-foreground">Smart Alerts</h2>
            </div>
            <SmartAlerts alerts={smartAlerts} />
          </AnimatedCard>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <AnimatedCard delay={0.3} className="mt-5 px-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Insights</h2>
            </div>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-2.5"
                >
                  <p className="text-xs text-foreground">{insight}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedCard>
        )}

        <AnimatedCard delay={0.35} className="mt-5 px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Spending Breakdown</h2>
            <button onClick={() => navigate("/analytics")} className="text-xs text-primary font-medium">
              Full Analytics →
            </button>
          </div>
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <SpendingChart data={breakdown} />
          </div>
        </AnimatedCard>

        {/* Budget limits */}
        <AnimatedCard delay={0.4} className="mt-5 px-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Budget Limits</h2>
          </div>
          <BudgetManager spent={spentByCategory} />
        </AnimatedCard>

        <AnimatedCard delay={0.45} className="mt-5 px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
            <button onClick={() => navigate("/transactions")} className="text-xs text-primary font-medium">
              See all
            </button>
          </div>
          <div className="space-y-2">
            {recent.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <TransactionItem transaction={t} />
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
