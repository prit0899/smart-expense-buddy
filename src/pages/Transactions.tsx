import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TransactionItem from "@/components/TransactionItem";
import PageTransition from "@/components/PageTransition";
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
    <PageTransition>
      <div className="min-h-screen pb-24 safe-top">
        <header className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-display font-bold text-foreground">Transactions</h1>
        </header>

        <div className="px-5 flex gap-2 mb-4">
          {filters.map(f => (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        <div className="px-5 space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground text-sm py-12"
              >
                No transactions found
              </motion.p>
            ) : (
              filtered.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, height: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  layout
                >
                  <TransactionItem transaction={t} onDelete={handleDelete} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
