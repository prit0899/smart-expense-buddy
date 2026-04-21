import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_TO_TIER: Record<string, string> = {
  price_1TOfzJChgj60tu8prkvt2gbd: "weekly",
  price_1TOfzSChgj60tu8pLJxcONc1: "monthly",
  price_1TOfzTChgj60tu8pGQJlpUOZ: "yearly",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(userError.message);
    const user = userData.user;
    if (!user?.email) throw new Error("User email not found");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      await supabase.from("subscribers").upsert({
        user_id: user.id,
        email: user.email,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        stripe_customer_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    const hasActive = subs.data.length > 0;
    let tier: string | null = null;
    let subEnd: string | null = null;

    if (hasActive) {
      const sub = subs.data[0];
      subEnd = new Date(sub.current_period_end * 1000).toISOString();
      const priceId = sub.items.data[0].price.id;
      tier = PRICE_TO_TIER[priceId] || "pro";
    }

    await supabase.from("subscribers").upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscribed: hasActive,
      subscription_tier: tier,
      subscription_end: subEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({
      subscribed: hasActive,
      subscription_tier: tier,
      subscription_end: subEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("check-subscription error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});