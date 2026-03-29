import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface Alert {
  type: "warning" | "success" | "info";
  message: string;
  icon: string;
}

const TYPE_STYLES = {
  warning: { border: "border-yellow-500/30", bg: "bg-yellow-500/5", iconColor: "text-yellow-400", Icon: AlertTriangle },
  success: { border: "border-primary/30", bg: "bg-primary/5", iconColor: "text-primary", Icon: CheckCircle2 },
  info: { border: "border-accent/30", bg: "bg-accent/5", iconColor: "text-accent", Icon: Info },
};

export default function SmartAlerts({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const style = TYPE_STYLES[alert.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              className={`rounded-xl ${style.bg} border ${style.border} px-4 py-3 flex items-start gap-3`}
            >
              <span className="text-base mt-0.5 shrink-0">{alert.icon}</span>
              <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
