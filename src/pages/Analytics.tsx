import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, RefreshCw, CalendarDays, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getTransactions, getStats, getCategoryBreakdown } from "@/lib/store";
import { CATEGORY_CONFIG, Category, Transaction } from "@/lib/types";
import * as XLSX from "xlsx";

const COLORS = [
  "hsl(153 60% 50%)",
  "hsl(263 70% 58%)",
  "hsl(200 80% 55%)",
  "hsl(45 90% 55%)",
  "hsl(0 72% 55%)",
  "hsl(320 70% 55%)",
  "hsl(180 60% 45%)",
];

type ViewMode = "monthly" | "yearly";
type Tab = "expenses" | "income" | "recurring";

function filterByPeriod(transactions: Transaction[], mode: ViewMode, selected: string): Transaction[] {
  return transactions.filter(t => {
    if (mode === "monthly") return t.date.substring(0, 7) === selected;
    return t.date.substring(0, 4) === selected;
  });
}

function getAvailableMonths(transactions: Transaction[]): string[] {
  const set = new Set(transactions.map(t => t.date.substring(0, 7)));
  return Array.from(set).sort().reverse();
}

function getAvailableYears(transactions: Transaction[]): string[] {
  const set = new Set(transactions.map(t => t.date.substring(0, 4)));
  return Array.from(set).sort().reverse();
}

function getRecurringPayments(transactions: Transaction[]) {
  const descMap: Record<string, Transaction[]> = {};
  transactions.forEach(t => {
    const key = t.description.toLowerCase().trim();
    if (!descMap[key]) descMap[key] = [];
    descMap[key].push(t);
  });
  return Object.entries(descMap)
    .filter(([, txns]) => txns.length >= 2)
    .map(([, txns]) => ({
      description: txns[0].description,
      count: txns.length,
      totalAmount: txns.reduce((s, t) => s + t.amount, 0),
      avgAmount: txns.reduce((s, t) => s + t.amount, 0) / txns.length,
      category: txns[0].category,
      type: txns[0].type,
      lastDate: txns.sort((a, b) => b.date.localeCompare(a.date))[0].date,
    }))
    .sort((a, b) => b.count - a.count);
}

function getIncomeBreakdown(transactions: Transaction[]) {
  const incomes = transactions.filter(t => t.type === "income");
  const map: Record<string, number> = {};
  incomes.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return Object.entries(map).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

function getMonthlySummary(transactions: Transaction[]) {
  const map: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const month = t.date.substring(0, 7);
    if (!map[month]) map[month] = { income: 0, expense: 0 };
    map[month][t.type] += t.amount;
  });
  return Object.entries(map).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
}

function exportToExcel(transactions: Transaction[]) {
  const data = transactions.map(t => ({
    Date: t.date,
    Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    Category: CATEGORY_CONFIG[t.category as Category]?.label || t.category,
    Description: t.description,
    Amount: t.type === "income" ? t.amount : -t.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const colWidths = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 30 }, { wch: 12 }];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");

  // Summary sheet
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const summaryData = [
    { Metric: "Total Income", Value: income },
    { Metric: "Total Expenses", Value: expense },
    { Metric: "Net Balance", Value: income - expense },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  ws2["!cols"] = [{ wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  XLSX.writeFile(wb, `FinTrack_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export default function Analytics() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("expenses");
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  const allTransactions = useMemo(() => getTransactions(), []);
  const months = useMemo(() => getAvailableMonths(allTransactions), [allTransactions]);
  const years = useMemo(() => getAvailableYears(allTransactions), [allTransactions]);

  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    months[0] || new Date().toISOString().substring(0, 7)
  );

  const periodOptions = viewMode === "monthly" ? months : years;
  const currentPeriodLabel = viewMode === "monthly"
    ? new Date(selectedPeriod + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : selectedPeriod;

  // Ensure selected period is valid when toggling view
  const effectivePeriod = periodOptions.includes(selectedPeriod)
    ? selectedPeriod
    : periodOptions[0] || (viewMode === "monthly" ? new Date().toISOString().substring(0, 7) : new Date().getFullYear().toString());

  const transactions = useMemo(() => filterByPeriod(allTransactions, viewMode, effectivePeriod), [allTransactions, viewMode, effectivePeriod]);
  const stats = useMemo(() => getStats(transactions), [transactions]);
  const expenseBreakdown = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
  const incomeBreakdown = useMemo(() => getIncomeBreakdown(transactions), [transactions]);
  const recurring = useMemo(() => getRecurringPayments(allTransactions), [allTransactions]);
  const monthly = useMemo(() => getMonthlySummary(allTransactions), [allTransactions]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "expenses", label: "Expenses", icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { key: "income", label: "Income", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "recurring", label: "Recurring", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  ];

  const currentBreakdown = tab === "expenses" ? expenseBreakdown : incomeBreakdown;
  const total = currentBreakdown.reduce((s, d) => s + d.amount, 0);

  return (
    <PageTransition>
    <div className="min-h-screen pb-24 safe-top">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-display font-bold text-foreground">Analytics</h1>
          </div>
        </div>
        <button
          onClick={() => exportToExcel(allTransactions)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </header>

      {/* View mode toggle + period selector */}
      <div className="px-5 space-y-3 mb-5">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
          {(["monthly", "yearly"] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => {
                setViewMode(m);
                setSelectedPeriod(m === "monthly" ? months[0] || "" : years[0] || "");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {m === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>

        {periodOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {periodOptions.map(p => {
              const label = viewMode === "monthly"
                ? new Date(p + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                : p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    effectivePeriod === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="px-5 grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Income</p>
          <p className="text-sm font-display font-bold text-income">${stats.totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Expense</p>
          <p className="text-sm font-display font-bold text-expense">${stats.totalExpense.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
          <p className="text-sm font-display font-bold text-primary">${stats.balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Period label */}
      <div className="px-5 mb-4">
        <p className="text-xs text-muted-foreground">{currentPeriodLabel}</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab !== "recurring" ? (
        <div className="px-5 space-y-5">
          {currentBreakdown.length > 0 ? (
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {tab === "expenses" ? "Expense" : "Income"} by Category
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={2} stroke="hsl(228 12% 8%)">
                        {currentBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {currentBreakdown.map((item, i) => {
                    const config = CATEGORY_CONFIG[item.category as Category];
                    const pct = total > 0 ? ((item.amount / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={item.category} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-muted-foreground flex-1 truncate">{config?.emoji} {config?.label || item.category}</span>
                        <span className="text-xs font-medium text-foreground tabular-nums">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">No {tab} data for this period</p>
            </div>
          )}

          {/* Category details */}
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Category Details</h3>
            <div className="space-y-3">
              {currentBreakdown.map((item, i) => {
                const config = CATEGORY_CONFIG[item.category as Category];
                const pct = total > 0 ? (item.amount / total) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{config?.emoji} {config?.label || item.category}</span>
                      <span className="text-xs font-medium text-foreground tabular-nums">${item.amount.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly bar chart */}
          {monthly.length > 0 && (
            <div className="rounded-xl bg-card border border-border/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Overview</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 10% 20%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} tickFormatter={v => v.substring(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} width={45} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(228 12% 14%)", border: "1px solid hsl(228 10% 20%)", borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="income" fill="hsl(153 60% 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="hsl(0 72% 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {recurring.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">Payments with similar descriptions appearing 2+ times.</p>
              {recurring.map((item, i) => {
                const config = CATEGORY_CONFIG[item.category as Category];
                return (
                  <div key={i} className="rounded-xl bg-card border border-border/50 p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{config?.emoji} {config?.label} · Last: {item.lastDate}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <RefreshCw className="w-3 h-3 text-accent" />
                        <span className="text-xs font-semibold text-accent">{item.count}×</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">
                        Avg: <span className={`font-medium ${item.type === "income" ? "text-income" : "text-expense"}`}>${item.avgAmount.toFixed(2)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Total: <span className={`font-medium ${item.type === "income" ? "text-income" : "text-expense"}`}>${item.totalAmount.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
              <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recurring payments detected yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add more transactions to see patterns</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
