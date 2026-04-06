import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioAnalysis, categoryColor } from "@/lib/portfolio";
import PageTransition from "@/components/PageTransition";
import AnimatedCard from "@/components/AnimatedCard";
import DonutChart from "@/components/portfolio/DonutChart";
import HoldingCard from "@/components/portfolio/HoldingCard";
import AddHoldingForm from "@/components/portfolio/AddHoldingForm";
import AnalysisView from "@/components/portfolio/AnalysisView";
import ChatView from "@/components/portfolio/ChatView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, MessageCircle, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Portfolio() {
  const { holdings, loading, addHolding, deleteHolding, totals } = usePortfolio();
  const [showAdd, setShowAdd] = useState(false);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzePortfolio = async () => {
    if (holdings.length === 0) {
      toast.error("Add some holdings first");
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("portfolio-ai", {
        body: { action: "analyze", portfolio: holdings },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        throw new Error(data.error);
      }
      setAnalysis(data.analysis);
    } catch {
      toast.error("Analysis failed. Try again.");
    }
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center pb-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 safe-top">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pt-6 pb-4"
        >
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Investments</p>
          <h1 className="text-2xl font-display font-bold text-foreground mt-1">Portfolio</h1>
        </motion.header>

        {/* Summary */}
        <AnimatedCard delay={0.05} className="px-5">
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-card border border-border/50 p-4">
            {[
              { label: "INVESTED", value: `₹${(totals.invested / 1000).toFixed(1)}K`, cls: "text-muted-foreground" },
              { label: "CURRENT", value: `₹${(totals.current / 1000).toFixed(1)}K`, cls: "text-primary" },
              { label: "RETURNS", value: `${totals.returnsPct.toFixed(2)}%`, cls: totals.returns >= 0 ? "text-income" : "text-expense" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] text-muted-foreground tracking-widest mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.cls}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Tabs */}
        <div className="px-5 mt-5">
          <Tabs defaultValue="portfolio">
            <TabsList className="w-full">
              <TabsTrigger value="portfolio" className="flex-1 text-xs gap-1">
                <Briefcase className="w-3.5 h-3.5" /> Holdings
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex-1 text-xs gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> AI Analysis
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 text-xs gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> Ask AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground tracking-widest">ALL HOLDINGS ({holdings.length})</p>
                    <Button size="sm" variant="glow" onClick={() => setShowAdd(!showAdd)} className="text-xs gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>

                  {showAdd && (
                    <div className="mb-3">
                      <AddHoldingForm onAdd={addHolding} onClose={() => setShowAdd(false)} />
                    </div>
                  )}

                  {holdings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-3xl mb-2">📈</p>
                      <p className="text-xs text-muted-foreground">No holdings yet. Add your first fund or stock!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {holdings.map((h) => (
                        <motion.div
                          key={h.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <HoldingCard holding={h} onDelete={deleteHolding} />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {holdings.length > 0 && (
                    <Button onClick={analyzePortfolio} variant="glow" className="w-full mt-4 tracking-wider text-xs" disabled={analyzing}>
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "🤖"} ANALYZE WITH AI
                    </Button>
                  )}
                </div>

                {holdings.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest text-center mb-3">ALLOCATION</p>
                    <DonutChart holdings={holdings} />
                    <div className="mt-3 space-y-1.5">
                      {holdings.map((h, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: categoryColor(h.category) }} />
                          <span className="text-[9px] text-muted-foreground flex-1 truncate">
                            {h.name.split(" ").slice(0, 3).join(" ")}
                          </span>
                          <span className="text-[9px] text-foreground/70">
                            {totals.current > 0 ? ((h.current_value / totals.current) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              <AnalysisView analysis={analysis} loading={analyzing} onAnalyze={analyzePortfolio} />
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <ChatView holdings={holdings} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
