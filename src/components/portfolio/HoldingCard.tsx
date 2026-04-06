import { Holding, categoryColor } from "@/lib/portfolio";
import { Trash2 } from "lucide-react";

interface Props {
  holding: Holding;
  onDelete: (id: string) => void;
}

export default function HoldingCard({ holding, onDelete }: Props) {
  const ret = holding.invested_amount > 0
    ? ((holding.current_value - holding.invested_amount) / holding.invested_amount) * 100
    : 0;
  const pnl = holding.current_value - holding.invested_amount;
  const color = categoryColor(holding.category);

  return (
    <div
      className="rounded-xl bg-card border border-border/50 p-3"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{holding.name}</p>
          <p className="text-[10px] mt-0.5 tracking-wider" style={{ color }}>{holding.category}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">₹{holding.current_value.toFixed(0)}</p>
            <p className={`text-[11px] px-1.5 py-0.5 rounded ${ret >= 0 ? "text-income bg-income/10" : "text-expense bg-expense/10"}`}>
              {ret >= 0 ? "+" : ""}{ret.toFixed(2)}%
            </p>
          </div>
          <button
            onClick={() => onDelete(holding.id)}
            className="w-7 h-7 rounded-md bg-expense/10 border border-expense/20 text-expense flex items-center justify-center hover:bg-expense/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <p className="text-[10px] text-muted-foreground">
          Invested: <span className="text-foreground/70">₹{holding.invested_amount.toFixed(0)}</span>
        </p>
        <p className="text-[10px] text-muted-foreground">
          P&L: <span className={ret >= 0 ? "text-income" : "text-expense"}>₹{pnl.toFixed(0)}</span>
        </p>
      </div>
    </div>
  );
}
