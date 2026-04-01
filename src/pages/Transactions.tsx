import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import TransactionItem from "@/components/TransactionItem";
import PageTransition from "@/components/PageTransition";
import { getTransactions, deleteTransaction } from "@/lib/store";
import { TransactionType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function Transactions() {
  const [transactions, setTransactions] = useState(() => getTransactions());
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filtered = useMemo(() => {
    let result = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    if (dateFrom) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      result = result.filter(t => t.date >= fromStr);
    }
    if (dateTo) {
      const toStr = format(dateTo, "yyyy-MM-dd");
      result = result.filter(t => t.date <= toStr);
    }

    return result;
  }, [transactions, filter, search, dateFrom, dateTo]);

  const handleDelete = useCallback((id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
  }, []);

  const hasDateFilter = dateFrom || dateTo;

  const clearDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

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

        {/* Search */}
        <div className="px-5 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="px-5 flex items-center gap-2 mb-3">
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

          {/* Date filter */}
          <div className="ml-auto flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", hasDateFilter && "border-primary text-primary")}>
                  <CalendarDays className="w-3.5 h-3.5" />
                  {dateFrom ? format(dateFrom, "MMM d") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", hasDateFilter && "border-primary text-primary")}>
                  <CalendarDays className="w-3.5 h-3.5" />
                  {dateTo ? format(dateTo, "MMM d") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            {hasDateFilter && (
              <button onClick={clearDates} className="p-1 rounded hover:bg-secondary">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="px-5 mb-2">
          <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
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
