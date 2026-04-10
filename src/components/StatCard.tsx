import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface StatCardProps {
  type: "balance" | "income" | "expense";
  amount: number;
}

const CONFIG = {
  balance: { label: "Balance", icon: Wallet, color: "text-foreground", bg: "bg-secondary" },
  income: { label: "Income", icon: TrendingUp, color: "text-income", bg: "bg-income/10" },
  expense: { label: "Expenses", icon: TrendingDown, color: "text-expense", bg: "bg-expense/10" },
};

export default function StatCard({ type, amount }: StatCardProps) {
  const { label, icon: Icon, color, bg } = CONFIG[type];
  const { currency } = useCurrency();

  return (
    <div className={`rounded-xl p-4 ${bg} border border-border/50 animate-slide-up`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-display font-bold ${color}`}>
        {type === "expense" ? "-" : ""}{currency.symbol}{amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}
