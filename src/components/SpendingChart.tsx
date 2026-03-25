import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CATEGORY_CONFIG, Category } from "@/lib/types";

const COLORS = [
  "hsl(153 60% 50%)",
  "hsl(263 70% 58%)",
  "hsl(200 80% 55%)",
  "hsl(45 90% 55%)",
  "hsl(0 72% 55%)",
  "hsl(320 70% 55%)",
  "hsl(180 60% 45%)",
];

interface Props {
  data: { category: string; amount: number }[];
}

export default function SpendingChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No expense data yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={55}
              strokeWidth={2}
              stroke="hsl(228 12% 8%)"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.slice(0, 4).map((item, i) => {
          const config = CATEGORY_CONFIG[item.category as Category];
          const pct = ((item.amount / total) * 100).toFixed(0);
          return (
            <div key={item.category} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-muted-foreground flex-1 truncate">{config?.emoji} {config?.label || item.category}</span>
              <span className="text-xs font-medium text-foreground tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
