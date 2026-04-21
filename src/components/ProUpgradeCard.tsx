import { useState, useEffect } from "react";
import { Crown, Check, Loader2, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

const PLANS = [
  { id: "weekly", label: "Weekly", price: "$4.99", period: "/wk" },
  { id: "monthly", label: "Monthly", price: "$9.99", period: "/mo", popular: true },
  { id: "yearly", label: "Yearly", price: "$29.99", period: "/yr", save: "Best value" },
];

export default function ProUpgradeCard() {
  const { subscribed, subscription_tier, subscription_end, refresh } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Refresh after returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Welcome to FinTrack Pro! 🎉");
      refresh();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("checkout") === "cancelled") {
      toast.info("Checkout cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refresh]);

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { plan } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      toast.error("Could not start checkout");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      toast.error("Could not open subscription manager");
    } finally {
      setPortalLoading(false);
    }
  };

  if (subscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">FinTrack Pro Active</p>
              <p className="text-xs text-muted-foreground capitalize">
                {subscription_tier} plan
                {subscription_end && ` · renews ${new Date(subscription_end).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium transition-colors"
          >
            {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SettingsIcon className="w-3.5 h-3.5" />}
            Manage
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-transparent border border-primary/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Upgrade to Pro</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Unlock advanced analytics, unlimited AI insights, and ad-free experience.</p>
      <div className="grid grid-cols-3 gap-2">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleCheckout(p.id)}
            disabled={loading !== null}
            className={`relative rounded-xl border p-2.5 text-left transition-all ${
              p.popular
                ? "border-primary/60 bg-primary/10"
                : "border-border/60 bg-card/50 hover:bg-card"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-2 right-1 text-[9px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                Popular
              </span>
            )}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{p.label}</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {p.price}<span className="text-[10px] font-normal text-muted-foreground">{p.period}</span>
            </p>
            {loading === p.id ? (
              <Loader2 className="w-3 h-3 mt-1 animate-spin text-primary" />
            ) : (
              <Check className="w-3 h-3 mt-1 text-primary opacity-60" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}