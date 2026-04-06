import { PortfolioAnalysis } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  analysis: PortfolioAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
}

const scoreColor = (s: number) => (s >= 75 ? "text-income" : s >= 50 ? "text-yellow-400" : "text-expense");
const scoreBorder = (s: number) => (s >= 75 ? "border-income" : s >= 50 ? "border-yellow-400" : "border-expense");
const priorityColor = (p: string) => (p === "High" ? "text-expense bg-expense/10" : p === "Medium" ? "text-yellow-400 bg-yellow-400/10" : "text-income bg-income/10");

export default function AnalysisView({ analysis, loading, onAnalyze }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground tracking-widest">ANALYZING PORTFOLIO...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-3xl">🔍</p>
        <p className="text-xs text-muted-foreground tracking-widest">NO ANALYSIS YET</p>
        <Button onClick={onAnalyze} variant="glow" size="sm">Run Analysis</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="rounded-xl bg-card border border-border/50 p-4 flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full border-4 ${scoreBorder(analysis.score)} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-xl font-bold ${scoreColor(analysis.score)}`}>{analysis.score}</span>
          <span className="text-[8px] text-muted-foreground">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold tracking-wider ${scoreColor(analysis.score)}`}>{analysis.scoreLabel?.toUpperCase()}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{analysis.summary}</p>
        </div>
      </div>

      {/* Verdict */}
      <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center">
        <p className="text-[10px] text-accent tracking-widest mb-1">AI VERDICT</p>
        <p className="text-sm font-bold text-foreground">{analysis.verdict}</p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-income/5 border border-income/20 p-3">
          <p className="text-[10px] text-income tracking-widest mb-2">✅ STRENGTHS</p>
          {analysis.strengths.map((s, i) => (
            <p key={i} className="text-[11px] text-income/80 mb-1 leading-relaxed">• {s}</p>
          ))}
        </div>
        <div className="rounded-xl bg-expense/5 border border-expense/20 p-3">
          <p className="text-[10px] text-expense tracking-widest mb-2">⚠️ WEAKNESSES</p>
          {analysis.weaknesses.map((w, i) => (
            <p key={i} className="text-[11px] text-expense/80 mb-1 leading-relaxed">• {w}</p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl bg-card border border-border/50 p-4">
        <p className="text-[10px] text-muted-foreground tracking-widest mb-3">🎯 ACTION ITEMS</p>
        <div className="space-y-3">
          {analysis.actions.map((a, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className={`text-[9px] px-2 py-1 rounded tracking-wider shrink-0 mt-0.5 ${priorityColor(a.priority)}`}>
                {a.priority.toUpperCase()}
              </span>
              <div>
                <p className="text-xs text-foreground">{a.action}</p>
                <p className="text-[10px] text-muted-foreground">{a.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allocation */}
      {analysis.allocation && (
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <p className="text-[10px] text-muted-foreground tracking-widest mb-3">📊 RECOMMENDED ALLOCATION</p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(analysis.allocation).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-lg font-bold text-accent">{v}%</p>
                <p className="text-[10px] text-muted-foreground tracking-wider">{k.toUpperCase()}</p>
                <div className="h-1 bg-secondary rounded mt-2">
                  <div className="h-1 bg-accent rounded" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={onAnalyze} variant="outline" className="w-full" size="sm">
        🔄 Re-Analyze
      </Button>
    </div>
  );
}
