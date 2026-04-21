import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) {
      setSubscribed(false);
      setTier(null);
      setEnd(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(!!data?.subscribed);
      setTier(data?.subscription_tier ?? null);
      setEnd(data?.subscription_end ?? null);
    } catch (e) {
      console.error("Subscription check failed:", e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  return (
    <SubscriptionContext.Provider value={{ subscribed, subscription_tier: tier, subscription_end: end, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}