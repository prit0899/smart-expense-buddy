import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { addTransaction } from "@/lib/store";
import { TransactionType, Category, CATEGORY_CONFIG, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types";
import { ArrowLeft, Check } from "lucide-react";

export default function AddTransaction() {
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [description, setDescription] = useState("");

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    addTransaction({
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      category,
      description: description || CATEGORY_CONFIG[category].label,
      date: new Date().toISOString().split("T")[0],
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen pb-24 safe-top">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">Add Transaction</h1>
      </header>

      <div className="px-5 space-y-6">
        {/* Type Toggle */}
        <div className="flex rounded-xl bg-secondary p-1 gap-1">
          {(["expense", "income"] as TransactionType[]).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); setCategory(t === "expense" ? "food" : "salary"); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === t
                  ? t === "expense"
                    ? "bg-expense text-foreground"
                    : "bg-income text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Amount</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-display font-bold text-muted-foreground">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-display font-bold bg-transparent text-foreground outline-none w-48 text-center tabular-nums placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(c => {
              const { emoji, label } = CATEGORY_CONFIG[c];
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    category === c
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card"
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Description</p>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-card border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <Button variant="glow" size="lg" className="w-full h-12 rounded-xl font-semibold" onClick={handleSubmit}>
          <Check className="w-5 h-5" />
          Add {type === "income" ? "Income" : "Expense"}
        </Button>
      </div>
    </div>
  );
}
