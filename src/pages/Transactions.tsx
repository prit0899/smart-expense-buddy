import { useState, useMemo, useCallback } from "react";
import TransactionItem from "@/components/TransactionItem";
import { getTransactions, deleteTransaction } from "@/lib/store";
import { TransactionType } from "@/lib/types";

export default function Transactions() {
  const [transactions, setTransactions] = useState(() => getTransactions());
  const [filter, setFilter] = useState<"all" | TransactionType>("all");

  const filtered = useMemo(
    () => filter === "all" ? transactions : transactions.filter(t => t.type === filter),
    [transactions, filter]
  );

  const handleDelete = useCallback((id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
  }, []);

  const filters: { value: "all" | TransactionType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
  ];

  return (
    <div className="min-h-screen pb-24 safe-top">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-display font-bold text-foreground">Transactions</h1>
      </header>

      <div className="px-5 flex gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">No transactions found</p>
        ) : (
          filtered.map(t => (
            <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
