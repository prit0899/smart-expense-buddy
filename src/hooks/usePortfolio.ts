import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Holding } from "@/lib/portfolio";
import { toast } from "sonner";

export function usePortfolio() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHoldings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load portfolio");
      console.error(error);
    } else {
      setHoldings((data as unknown as Holding[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const addHolding = async (holding: Omit<Holding, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase
      .from("portfolio_holdings")
      .insert({ ...holding, user_id: user.id } as any);

    if (error) {
      toast.error("Failed to add holding");
      console.error(error);
    } else {
      toast.success("Holding added!");
      fetchHoldings();
    }
  };

  const deleteHolding = async (id: string) => {
    const { error } = await supabase
      .from("portfolio_holdings")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete holding");
      console.error(error);
    } else {
      toast.success("Holding removed");
      fetchHoldings();
    }
  };

  const updateHolding = async (id: string, updates: Partial<Holding>) => {
    const { error } = await supabase
      .from("portfolio_holdings")
      .update(updates as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update holding");
      console.error(error);
    } else {
      toast.success("Holding updated");
      fetchHoldings();
    }
  };

  const totals = {
    invested: holdings.reduce((s, h) => s + h.invested_amount, 0),
    current: holdings.reduce((s, h) => s + h.current_value, 0),
    get returns() { return this.current - this.invested; },
    get returnsPct() { return this.invested > 0 ? (this.returns / this.invested) * 100 : 0; },
  };

  return { holdings, loading, addHolding, deleteHolding, updateHolding, totals, refetch: fetchHoldings };
}
