import { useNavigate } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Briefcase, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function PortfolioWidget() {
  const navigate = useNavigate();
  const { holdings, totals, loading } = usePortfolio();
  const { currency } = useCurrency();

  if (loading || holdings.length === 0) return null;

  const isPositive = totals.returns >= 0;

  return (
    <button
      onClick={() => navigate("/portfolio")}
      className="w-full rounded-xl bg-card border border-border/50 p-4 text-left hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Portfolio</span>
        </div>
        <span className="text-xs text-primary font-medium">View →</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground">Invested</p>
          <p className="text-sm font-bold text-foreground">{currency.symbol}{(totals.invested / 1000).toFixed(1)}K</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Current</p>
          <p className="text-sm font-bold text-primary">{currency.symbol}{(totals.current / 1000).toFixed(1)}K</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Returns</p>
          <div className="flex items-center gap-0.5">
            {isPositive ? <ArrowUpRight className="w-3 h-3 text-income" /> : <ArrowDownRight className="w-3 h-3 text-expense" />}
            <p className={`text-sm font-bold ${isPositive ? "text-income" : "text-expense"}`}>
              {totals.returnsPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
