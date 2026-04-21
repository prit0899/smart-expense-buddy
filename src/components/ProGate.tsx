import { ReactNode } from "react";
import { Lock, Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

interface ProGateProps {
  children: ReactNode;
  feature?: string;
  description?: string;
  /** When true, render children for Pro users; for free users render a blurred skeleton with overlay */
  blurPreview?: boolean;
}

/**
 * Wraps Pro-only content. Free users see a blurred preview with an upgrade overlay.
 * Pro users see the actual content.
 */
export default function ProGate({ children, feature = "Pro feature", description, blurPreview = true }: ProGateProps) {
  const { subscribed } = useSubscription();
  const navigate = useNavigate();

  if (subscribed) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {blurPreview && (
        <div className="pointer-events-none select-none blur-md opacity-40" aria-hidden>
          {children}
        </div>
      )}
      <div className={`${blurPreview ? "absolute inset-0" : ""} flex flex-col items-center justify-center bg-gradient-to-br from-card/95 via-card/90 to-primary/10 backdrop-blur-sm border border-primary/20 rounded-xl p-5 text-center`}>
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mb-2">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          {feature}
        </p>
        {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
        <button
          onClick={() => navigate("/")}
          className="mt-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-3 h-3" />
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder shown for locked features.
 */
export function ProSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={`${height} rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/10 animate-pulse`} />
  );
}