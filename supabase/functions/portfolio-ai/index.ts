import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, messages, portfolio } = await req.json();

    if (!portfolio) {
      return new Response(JSON.stringify({ error: "Portfolio data required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalInvested = portfolio.reduce((s: number, f: any) => s + f.invested_amount, 0);
    const totalCurrent = portfolio.reduce((s: number, f: any) => s + f.current_value, 0);
    const totalReturn = totalCurrent - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const portfolioSummary = portfolio
      .map((f: any) => {
        const ret = f.invested_amount > 0
          ? ((f.current_value - f.invested_amount) / f.invested_amount * 100).toFixed(2)
          : "0.00";
        return `${f.name} (${f.category}): Invested ₹${f.invested_amount.toFixed(0)}, Current ₹${f.current_value.toFixed(0)}, Return ${ret}%`;
      })
      .join("\n");

    const contextBlock = `Portfolio:\nTotal Invested: ₹${totalInvested.toFixed(0)}\nCurrent Value: ₹${totalCurrent.toFixed(0)}\nReturn: ${totalReturnPct.toFixed(2)}%\n\nHoldings:\n${portfolioSummary}`;

    if (action === "analyze") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert mutual fund and stock portfolio manager. Analyze portfolios and give structured advice.`,
            },
            {
              role: "user",
              content: `Analyze this portfolio:\n\n${contextBlock}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "portfolio_analysis",
                description: "Return structured portfolio analysis",
                parameters: {
                  type: "object",
                  properties: {
                    score: { type: "number", description: "Portfolio health score 1-100" },
                    scoreLabel: { type: "string", enum: ["Poor", "Fair", "Good", "Excellent"] },
                    summary: { type: "string", description: "2-3 sentence assessment" },
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    actions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "string", enum: ["High", "Medium", "Low"] },
                          action: { type: "string" },
                          reason: { type: "string" },
                        },
                        required: ["priority", "action", "reason"],
                      },
                    },
                    allocation: {
                      type: "object",
                      properties: {
                        equity: { type: "number" },
                        debt: { type: "number" },
                        gold: { type: "number" },
                        other: { type: "number" },
                      },
                      required: ["equity", "debt", "gold", "other"],
                    },
                    verdict: { type: "string", description: "One bold conclusion line" },
                  },
                  required: ["score", "scoreLabel", "summary", "strengths", "weaknesses", "actions", "allocation", "verdict"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "portfolio_analysis" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const analysis = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({ analysis }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No structured analysis returned");
    }

    if (action === "chat") {
      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "Messages required for chat" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert mutual fund and stock advisor. The user has this portfolio:\n\n${contextBlock}\n\nGive practical, specific advice. Be concise. Use ₹ for amounts.`,
            },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("portfolio-ai error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
