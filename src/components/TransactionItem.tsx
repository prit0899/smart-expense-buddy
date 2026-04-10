import { Transaction, CATEGORY_CONFIG } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: Props) {
  const { emoji, label } = CATEGORY_CONFIG[transaction.category];
  const isIncome = transaction.type === "income";
  const { currency } = useCurrency();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 group animate-fade-in">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground">{label} · {new Date(transaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
      </div>
      <p className={`text-sm font-semibold font-display tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
        {isIncome ? "+" : "-"}{currency.symbol}{transaction.amount.toFixed(2)}
      </p>
      {onDelete && (
        <button
          onClick={() => onDelete(transaction.id)}
          className="opacity-0 group-hover:opacity-100 ml-1 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      )}
    </div>
  );
}
