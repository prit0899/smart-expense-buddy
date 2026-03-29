import { motion } from "framer-motion";
import { Flame, Trophy, Calendar, Shield } from "lucide-react";
import { StreakData } from "@/lib/streaks";

interface Props {
  streaks: StreakData;
}

export default function StreakCard({ streaks }: Props) {
  const items = [
    { icon: Flame, label: "Current Streak", value: `${streaks.currentStreak}d`, color: "text-orange-400", bg: "bg-orange-400/10" },
    { icon: Trophy, label: "Best Streak", value: `${streaks.bestStreak}d`, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { icon: Calendar, label: "Days Tracked", value: `${streaks.totalDaysTracked}`, color: "text-primary", bg: "bg-primary/10" },
    { icon: Shield, label: "No-Binge Days", value: `${streaks.noBingeDays}`, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className="rounded-xl bg-card border border-border/50 p-3 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground leading-none">{item.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
