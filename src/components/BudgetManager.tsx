import { useState } from "react";
import { CATEGORY_CONFIG, EXPENSE_CATEGORIES, Category } from "@/lib/types";
import { getBudgets, setBudget, BudgetLimit } from "@/lib/budget";
import { Target, Check, X } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  spent: Record<string, number>;
}

export default function BudgetManager({ spent }: Props) {
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => getBudgets());
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { currency } = useCurrency();

  const handleSave = (category: string) => {
    const val = parseFloat(editValue);
    if (val > 0) {
      setBudget(category, val);
      setBudgets(getBudgets());
    }
    setEditing(null);
    setEditValue("");
  };

  const handleRemove = (category: string) => {
    setBudget(category, 0);
    setBudgets(getBudgets());
  };

  return (
    <div className="space-y-3">
      {EXPENSE_CATEGORIES.filter(c => c !== "other").map(cat => {
        const config = CATEGORY_CONFIG[cat];
        const budget = budgets.find(b => b.category === cat);
        const catSpent = spent[cat] || 0;
        const pct = budget ? Math.min((catSpent / budget.limit) * 100, 100) : 0;
        const over = budget ? catSpent > budget.limit : false;

        return (
          <div key={cat} className="rounded-xl bg-card border border-border/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                {config.emoji} {config.label}
              </span>
              {editing === cat ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{currency.symbol}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-20 text-xs bg-secondary rounded-lg px-2 py-1 text-foreground outline-none"
                    placeholder="0.00"
                    autoFocus
                  />
                  <button onClick={() => handleSave(cat)} className="p-1 rounded hover:bg-secondary">
                    <Check className="w-3.5 h-3.5 text-income" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-secondary">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {budget && (
                    <button onClick={() => handleRemove(cat)} className="p-1 rounded hover:bg-secondary">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => { setEditing(cat); setEditValue(budget?.limit.toString() || ""); }}
                    className="text-[10px] text-primary font-medium"
                  >
                    {budget ? `${currency.symbol}${budget.limit}` : "Set limit"}
                  </button>
                </div>
              )}
            </div>

            {budget && (
              <>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: over ? "hsl(var(--expense))" : "hsl(var(--primary))",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium ${over ? "text-expense" : "text-muted-foreground"}`}>
                    {currency.symbol}{catSpent.toFixed(0)} / {currency.symbol}{budget.limit.toFixed(0)}
                  </span>
                  <span className={`text-[10px] font-semibold ${over ? "text-expense" : "text-primary"}`}>
                    {over ? `Over by ${currency.symbol}${(catSpent - budget.limit).toFixed(0)}` : `${(100 - pct).toFixed(0)}% left`}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
