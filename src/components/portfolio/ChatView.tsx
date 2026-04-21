import { useState, useRef, useEffect } from "react";
import { Holding } from "@/lib/portfolio";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Crown, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { canUse, incrementUsage, getRemaining, FREE_LIMITS } from "@/lib/freeLimits";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which fund should I exit first?",
  "How can I reduce my risk?",
  "What's my ideal monthly SIP amount?",
  "Should I add more debt allocation?",
];

export default function ChatView({ holdings }: { holdings: Holding[] }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { subscribed } = useSubscription();
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(() => getRemaining("ai_chat_per_day"));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    if (!subscribed && !canUse("ai_chat_per_day")) {
      toast.error(`Free limit reached (${FREE_LIMITS.ai_chat_per_day}/day). Upgrade to Pro for unlimited AI chat.`);
      return;
    }

    setInput("");

    const userMsg: ChatMsg = { role: "user", content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("portfolio-ai", {
        body: {
          action: "chat",
          portfolio: holdings,
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        throw new Error(data.error);
      }

      setMessages([...newHistory, { role: "assistant", content: data.reply }]);
      if (!subscribed) {
        incrementUsage("ai_chat_per_day");
        setRemaining(getRemaining("ai_chat_per_day"));
      }
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Error connecting. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[55vh]">
      {!subscribed && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
          <p className="text-[11px] text-muted-foreground">
            <Crown className="w-3 h-3 inline mr-1 text-amber-400" />
            Free: <span className="text-foreground font-medium">{remaining}/{FREE_LIMITS.ai_chat_per_day}</span> AI chats left today
          </p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-[11px] text-primary font-semibold"
          >
            <Sparkles className="w-3 h-3" /> Pro
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-xs text-muted-foreground tracking-widest mb-5">ASK ANYTHING ABOUT YOUR PORTFOLIO</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="w-full text-left rounded-lg bg-card border border-border/50 px-3 py-2.5 text-xs text-muted-foreground hover:border-primary/30 transition-colors"
                >
                  → {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border/50 text-foreground rounded-bl-sm"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-1 [&_li]:mb-0.5">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 rounded-xl px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your portfolio..."
          className="text-sm"
        />
        <Button size="icon" onClick={() => send()} disabled={loading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
